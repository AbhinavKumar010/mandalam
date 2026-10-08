import React, { useEffect, useState } from 'react';
import './Profile.css';
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
    <div className="profile-page">
      <Sidebar />

      <main className="profile-page__content">
        {/* Profile Header Details */}
        <header className="profile-page__header">
          <Avatar src={user.profilePic} name={user.username} alt={user.username} className="profile-page__avatar" />

          <div className="profile-page__details">
            <div className="profile-page__identity">
              <h2 className="profile-page__username">{user.username}</h2>
              <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={menuOpen} className="profile-page__menu-trigger">
                <Menu size={21} />
              </button>
              {menuOpen && (
                <div role="menu" className="profile-page__menu">
                  {menuItems.map(({ label, icon: Icon, onClick }) => (
                    <button key={label} type="button" role="menuitem" onClick={() => { onClick(); setMenuOpen(false); }} className="profile-page__menu-item">
                      <Icon size={17} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Counts */}
            <div className="profile-page__counts">
              <span><strong>{userPosts.length}</strong> posts</span>
              <span><strong>{user.followers || 0}</strong> followers</span>
              <span><strong>{user.following || 0}</strong> following</span>
            </div>

            {/* Bio */}
            <div>
              <p className="profile-page__full-name">{user.fullName || user.username}</p>
              {user.bio && <p className="profile-page__bio">{user.bio}</p>}
            </div>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="profile-page__tabs">
          <button
            onClick={() => setActiveTab('posts')}
            className={`profile-page__tab ${activeTab === 'posts' ? 'profile-page__tab--active' : ''}`}
          >
            <Grid size={14} /> Posts
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`profile-page__tab ${activeTab === 'saved' ? 'profile-page__tab--active' : ''}`}
          >
            <Bookmark size={14} /> Saved
          </button>
        </div>

        {/* 3x3 Photo Gallery Grid */}
        <div className="profile-page__gallery">
          {visiblePosts.map((post) => (
            <div key={post._id} className="profile-page__tile">
              {post.mediaType === 'video' || post.videoUrl ? (
                <video
                  src={post.mediaUrl || post.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="profile-page__media"
                />
              ) : (
                <img
                  src={post.mediaUrl || post.imageUrl}
                  alt={post.caption}
                  className="profile-page__media"
                />
              )}
            </div>
          ))}
        </div>
        {loadingPosts && <p className="profile-page__state">Loading posts...</p>}
        {!loadingPosts && postsError && <p role="alert" className="profile-page__state profile-page__state--error">{postsError}</p>}
        {!loadingPosts && !postsError && visiblePosts.length === 0 && (
          <p className="profile-page__state">
            {activeTab === 'saved' ? 'Posts you save will appear here.' : 'Your posts will appear here.'}
          </p>
        )}
      </main>
      <BottomNav />
    </div>
  );
}