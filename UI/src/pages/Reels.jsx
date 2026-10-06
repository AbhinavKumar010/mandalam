import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import API from '../api/axios';
import { reelSamples } from '../data/reelSamples';

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
    <article className="relative mx-auto flex h-full w-full max-w-[470px] snap-start items-center justify-center overflow-hidden bg-black text-white md:my-4 md:h-[calc(100%-2rem)] md:rounded-2xl">
      <video
        ref={videoRef}
        src={reel.videoUrl || reel.imageUrl}
        poster={reel.thumbnailUrl}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        controls={false}
        onClick={togglePlayback}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-5 pt-24">
        <div className="flex items-center gap-2">
          <Avatar src={reel.user?.profilePic} name={reel.user?.username || reel.username} className="h-9 w-9 border border-white/60 bg-neutral-800 text-white" />
          <span className="text-sm font-semibold">{reel.user?.username || reel.username || 'Creator'}</span>
          {reel.isDemo && <span className="rounded bg-white/15 px-2 py-1 text-[10px] uppercase">Sample</span>}
        </div>
        {reel.caption && <p className="mt-2 max-w-[34ch] text-sm">{reel.caption}</p>}
      </div>
      <div className="absolute bottom-5 right-4 flex flex-col gap-3">
        <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute reel' : 'Mute reel'} className="rounded-full bg-black/45 p-3 text-white backdrop-blur">
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause reel' : 'Play reel'} className="rounded-full bg-black/45 p-3 text-white backdrop-blur">
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
          .map((post) => ({ ...post, videoUrl: post.videoUrl || post.imageUrl }));
        setReels(videoPosts.length ? videoPosts : import.meta.env.DEV ? reelSamples : []);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not load reels.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-white">
      <Sidebar />
      <main aria-label="Reels" className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth pb-12 md:pb-0">
        {loading && <p className="flex h-full items-center justify-center text-sm text-neutral-400">Loading reels...</p>}
        {!loading && error && <p role="alert" className="flex h-full items-center justify-center px-5 text-center text-sm text-red-300">{error}</p>}
        {!loading && !error && reels.length === 0 && <p className="flex h-full items-center justify-center px-5 text-center text-sm text-neutral-400">No video reels yet.</p>}
        {!loading && !error && reels.map((reel) => <section key={reel._id || reel.id} className="h-[calc(100dvh-3rem)] snap-start md:h-screen"><ReelItem reel={reel} /></section>)}
      </main>
      <BottomNav />
    </div>
  );
}