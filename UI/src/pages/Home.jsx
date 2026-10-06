import React, { useEffect, useState } from 'react';
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
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white">
      {/* Mobile Top Header */}
      <MobileHeader />

      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar onOpenCreateModal={() => setIsModalOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 flex justify-center py-2 md:py-6 px-0 md:px-4 pb-16 md:pb-6">
          <div className="w-full max-w-[470px]">
            <StoryTray />
            {/* Posts Stream */}
            <div className="flex flex-col gap-3 md:gap-4">
              {loading && <p className="py-12 text-center text-sm text-neutral-500">Loading your feed...</p>}
              {!loading && loadError && (
                <div className="py-12 text-center">
                  <p role="alert" className="text-sm text-neutral-500">{loadError}</p>
                  <button onClick={() => setReloadKey((key) => key + 1)} className="mt-3 text-sm font-semibold text-blue-500">Try again</button>
                </div>
              )}
              {!loading && !loadError && posts.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-neutral-500">No posts yet. Share the first photo.</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-3 text-sm font-semibold text-blue-500">Create a post</button>
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