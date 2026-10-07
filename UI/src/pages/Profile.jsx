import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Bookmark, Menu, Settings as SettingsIcon, Bell, Shield, Users, UserRoundX, MessageCircle, Heart, Star, VolumeX } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import API from '../api/axios';
import { getSavedPostIds } from '../api/savedPosts';

export default function Profile() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [savedPostIds, setSavedPostIds] = useState(getSavedPostIds);
  const [activeTab, setActiveTab] = useState('posts');
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await API.get('/auth/me');
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (err) {
        setPostsError(err.response?.data?.message || 'Could not load account details.');
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const { data } = await API.get('/posts');
        setPosts(data);
      } catch (err) {
        setPostsError(err.response?.data?.message || 'Could not load profile posts.');
      } finally {
        setLoadingPosts(false);
      }
    };
    if (user._id) fetchUserPosts();
  }, [user._id]);

  const userPosts = posts.filter((post) => post.user?._id === user._id);

  useEffect(() => {
    const updateSavedPosts = (event) => setSavedPostIds(event.detail || getSavedPostIds());
    window.addEventListener('saved-posts-changed', updateSavedPosts);
    window.addEventListener('storage', updateSavedPosts);
    return () => {
      window.removeEventListener('saved-posts-changed', updateSavedPosts);
      window.removeEventListener('storage', updateSavedPosts);
    };
  }, []);

  const visiblePosts = activeTab === 'saved'
    ? posts.filter((post) => savedPostIds.includes(post._id))
    : userPosts;

  const menuItems = [
    { label: 'Settings', icon: SettingsIcon, onClick: () => navigate('/settings?section=privacy') },
    { label: 'Saved', icon: Bookmark, onClick: () => setActiveTab('saved') },
    { label: 'Notifications', icon: Bell, onClick: () => navigate('/notifications') },
    { label: 'Privacy', icon: Shield, onClick: () => navigate('/settings?section=privacy') },
    { label: 'Close friends', icon: Users, onClick: () => navigate('/settings?section=close-friends') },
    { label: 'Blocked', icon: UserRoundX, onClick: () => navigate('/settings?section=blocked') },
    { label: 'Comments', icon: MessageCircle, onClick: () => navigate('/notifications?type=comment') },
    { label: 'Likes', icon: Heart, onClick: () => navigate('/notifications?type=like') },
    { label: 'Favorites', icon: Star, onClick: () => navigate('/settings?section=favorites') },
    { label: 'Muted', icon: VolumeX, onClick: () => navigate('/settings?section=muted') },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Sidebar />

      <main className="flex-1 max-w-[935px] mx-auto py-8 px-6 pb-20 md:pb-8">
        {/* Profile Header Details */}
        <header className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-20 pb-10 border-b border-neutral-200 dark:border-neutral-800">
          <Avatar src={user.profilePic} name={user.username} alt={user.username} className="h-28 w-28 border border-neutral-300 text-3xl dark:border-neutral-700 md:h-36 md:w-36" />

          <div className="flex-1 flex flex-col gap-4">
            <div className="relative flex flex-wrap items-center gap-4">
              <h2 className="text-xl font-normal">{user.username}</h2>
              <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={menuOpen} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900">
                <Menu size={21} />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 top-11 z-50 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                  {menuItems.map(({ label, icon: Icon, onClick }) => (
                    <button key={label} type="button" role="menuitem" onClick={() => { onClick(); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900">
                      <Icon size={17} className="text-neutral-500" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Counts */}
            <div className="flex gap-8 text-sm">
              <span><strong>{userPosts.length}</strong> posts</span>
              <span><strong>{user.followers || 0}</strong> followers</span>
              <span><strong>{user.following || 0}</strong> following</span>
            </div>

            {/* Bio */}
            <div>
              <p className="font-semibold text-sm">{user.fullName || user.username}</p>
              {user.bio && <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">{user.bio}</p>}
            </div>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex justify-center gap-12 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 py-4 border-t ${
              activeTab === 'posts'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent'
            }`}
          >
            <Grid size={14} /> Posts
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 py-4 border-t ${
              activeTab === 'saved'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent'
            }`}
          >
            <Bookmark size={14} /> Saved
          </button>
        </div>

        {/* 3x3 Photo Gallery Grid */}
        <div className="grid grid-cols-3 gap-1 md:gap-4 mt-2">
          {visiblePosts.map((post) => (
            <div key={post._id} className="aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden cursor-pointer">
              {post.mediaType === 'video' || post.videoUrl ? (
                <video
                  src={post.mediaUrl || post.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              ) : (
                <img
                  src={post.mediaUrl || post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              )}
            </div>
          ))}
        </div>
        {loadingPosts && <p className="py-12 text-center text-sm text-neutral-500">Loading posts...</p>}
        {!loadingPosts && postsError && <p role="alert" className="py-12 text-center text-sm text-red-500">{postsError}</p>}
        {!loadingPosts && !postsError && visiblePosts.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-500">
            {activeTab === 'saved' ? 'Posts you save will appear here.' : 'Your posts will appear here.'}
          </p>
        )}
      </main>
      <BottomNav />
    </div>
  );
}