import React, { useEffect, useState } from 'react';
import './Home.css';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import StoryTray from '../components/StoryTray';
import API from '../api/axios';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const { data } = await API.get('/posts');
        setPosts(data);
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Could not load the feed. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [reloadKey]);

  return (
    <div className="home-page">
      {/* Mobile Top Header */}
      <MobileHeader />

      <div className="home-page__layout">
        {/* Desktop Sidebar */}
        <Sidebar onOpenCreateModal={() => setIsModalOpen(true)} />

        {/* Main Content Area */}
        <main className="home-page__main">
          <div className="home-page__column">
            <StoryTray />
            {/* Posts Stream */}
            <div className="home-page__stream">
              {loading && <p className="home-page__state">Loading your feed...</p>}
              {!loading && loadError && (
                <div className="home-page__state">
                  <p role="alert">{loadError}</p>
                  <button onClick={() => setReloadKey((key) => key + 1)} className="home-page__action">Try again</button>
                </div>
              )}
              {!loading && !loadError && posts.length === 0 && (
                <div className="home-page__state">
                  <p>No posts yet. Share the first photo.</p>
                  <button onClick={() => setIsModalOpen(true)} className="home-page__action">Create a post</button>
                </div>
              )}
              {!loading && !loadError && posts.map((post) => (
                <PostCard key={post._id} post={post} currentUserId={currentUser._id} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenCreateModal={() => setIsModalOpen(true)} />

      {/* Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={(newPost) => setPosts((currentPosts) => [newPost, ...currentPosts])}
      />
    </div>
  );
}