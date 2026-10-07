import React, { useEffect, useState } from 'react';
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
    <div className="flex min-h-screen bg-neutral-50 dark:bg-black text-black dark:text-white">
      <Sidebar />
      <div className="flex-1 max-w-[935px] mx-auto py-8 px-4 pb-20 md:pb-8">
        {/* Search Header */}
        <div className="max-w-md mx-auto mb-8 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
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
            className="w-full pl-10 pr-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-sm outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>

        {/* 3-Column Explore Grid */}
        {loading && <p className="py-12 text-center text-sm text-neutral-500">Loading posts...</p>}
        {!loading && loadError && <p role="alert" className="py-12 text-center text-sm text-red-500">{loadError}</p>}
        {!loading && !loadError && filteredPosts.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-500">
            {search ? 'No posts match your search.' : 'No posts to explore yet.'}
          </p>
        )}
        {!loading && !loadError && filteredPosts.length > 0 && <div className="grid grid-cols-3 gap-1 md:gap-4">
          {filteredPosts.map((post) => (
            <button key={post._id} type="button" onClick={() => setSelectedPost(post)} aria-label={`Open post by ${post.user?.username || 'user'}`} className="relative group aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 cursor-pointer">
              {post.mediaType === 'video' || post.videoUrl ? (
                <video
                  src={post.mediaUrl || post.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <img
                  src={post.mediaUrl || post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold text-sm">
                <span className="flex items-center gap-1.5">
                  <Heart size={18} className="fill-white" />
                  {post.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={18} className="fill-white" />
                  {post.comments?.length || 0}
                </span>
              </div>
            </button>
          ))}
        </div>}
      </div>
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="relative w-full max-w-[470px]" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close post" onClick={() => setSelectedPost(null)} className="absolute -right-2 -top-10 text-white">
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