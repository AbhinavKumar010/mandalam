import React, { useEffect, useRef, useState } from 'react';
import './Reels.css';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import API from '../api/axios';

function ReelItem({ reel }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } else {
        video.pause();
        setPlaying(false);
      }
    }, { threshold: [0, 0.75, 1] });

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  return (
    <article className="reel-item">
      <video
        ref={videoRef}
        src={reel.videoUrl || reel.mediaUrl || reel.imageUrl}
        poster={reel.thumbnailUrl}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        controls={false}
        onClick={togglePlayback}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="reel-item__video"
      />
      <div className="reel-item__caption">
        <div className="reel-item__creator">
          <Avatar src={reel.user?.profilePic} name={reel.user?.username || reel.username} className="reel-item__avatar" />
          <span className="reel-item__username">{reel.user?.username || reel.username || 'Creator'}</span>
          {reel.isDemo && <span className="reel-item__sample">Sample</span>}
        </div>
        {reel.caption && <p className="reel-item__text">{reel.caption}</p>}
      </div>
      <div className="reel-item__controls">
        <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute reel' : 'Mute reel'} className="reel-item__control">
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause reel' : 'Play reel'} className="reel-item__control">
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </article>
  );
}

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/posts')
      .then(({ data }) => {
        const videoPosts = data
          .filter((post) => post.mediaType === 'video' || post.videoUrl)
          .map((post) => ({ ...post, videoUrl: post.videoUrl || post.mediaUrl || post.imageUrl }));
        setReels(videoPosts);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not load reels.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="reels-page">
      <Sidebar />
      <main aria-label="Reels" className="reels-page__main">
        {loading && <p className="reels-page__state">Loading reels...</p>}
        {!loading && error && <p role="alert" className="reels-page__state reels-page__state--error">{error}</p>}
        {!loading && !error && reels.length === 0 && <p className="reels-page__state">No video reels yet.</p>}
        {!loading && !error && reels.map((reel) => <section key={reel._id || reel.id} className="reels-page__section"><ReelItem reel={reel} /></section>)}
      </main>
      <BottomNav />
    </div>
  );
}