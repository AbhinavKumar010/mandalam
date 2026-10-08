import React, { useEffect, useState } from 'react';
import './Explore.css';
import { useSearchParams } from 'react-router-dom';
import { Search, Heart, MessageCircle, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import BottomNav from '../components/BottomNav';
import API from '../api/axios';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const search = searchParams.get('search') || '';
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchExplorePosts = async () => {
      try {
        const { data } = await API.get('/posts');
        setPosts(data);
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Could not load posts. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchExplorePosts();
  }, []);

  const filteredPosts = posts.filter((p) =>
    p.caption?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="explore-page">
      <Sidebar />
      <div className="explore-page__content">
        {/* Search Header */}
        <div className="explore-page__search">
          <Search size={16} className="explore-page__search-icon" />
          <input
            type="text"
            placeholder="Search creators or tags..."
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              const nextParams = new URLSearchParams(searchParams);
              if (value) nextParams.set('search', value);
              else nextParams.delete('search');
              setSearchParams(nextParams, { replace: true });
            }}
            className="explore-page__search-input"
          />
        </div>

        {/* 3-Column Explore Grid */}
        {loading && <p className="explore-page__state">Loading posts...</p>}
        {!loading && loadError && <p role="alert" className="explore-page__state explore-page__state--error">{loadError}</p>}
        {!loading && !loadError && filteredPosts.length === 0 && (
          <p className="explore-page__state">
            {search ? 'No posts match your search.' : 'No posts to explore yet.'}
          </p>
        )}
        {!loading && !loadError && filteredPosts.length > 0 && <div className="explore-page__grid">
          {filteredPosts.map((post) => (
            <button key={post._id} type="button" onClick={() => setSelectedPost(post)} aria-label={`Open post by ${post.user?.username || 'user'}`} className="explore-page__tile">
              {post.mediaType === 'video' || post.videoUrl ? (
                <video
                  src={post.mediaUrl || post.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="explore-page__media"
                />
              ) : (
                <img
                  src={post.mediaUrl || post.imageUrl}
                  alt={post.caption}
                  className="explore-page__media"
                />
              )}
              {/* Hover Overlay */}
              <div className="explore-page__overlay">
                <span className="explore-page__overlay-count">
                  <Heart size={18} fill="white" />
                  {post.likes?.length || 0}
                </span>
                <span className="explore-page__overlay-count">
                  <MessageCircle size={18} fill="white" />
                  {post.comments?.length || 0}
                </span>
              </div>
            </button>
          ))}
        </div>}
      </div>
      {selectedPost && (
        <div className="explore-page__modal" onClick={() => setSelectedPost(null)}>
          <div className="explore-page__modal-content" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close post" onClick={() => setSelectedPost(null)} className="explore-page__modal-close">
              <X size={24} />
            </button>
            <PostCard post={selectedPost} currentUserId={JSON.parse(localStorage.getItem('user') || '{}')._id} />
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}