import React, { useState } from 'react';
import './Sidebar.css';
import { Home, Search, Compass, Film, MessageCircle, PlusSquare, UserRound, Bell, LogOut, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar({ onOpenCreateModal }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', icon: <Home size={24} />, path: '/' },
    { name: 'Explore', icon: <Compass size={24} />, path: '/explore' },
    { name: 'Reels', icon: <Film size={24} />, path: '/reels' },
    { name: 'Messages', icon: <MessageCircle size={24} />, path: '/messages' },
    { name: 'Notifications', icon: <Bell size={24} />, path: '/notifications' },
    { name: 'Profile', icon: <UserRound size={24} />, path: '/profile' },
  ];

  return (
    <div className="sidebar-layout">
      {/* Primary Sidebar (Hidden on mobile via 'hidden md:flex') */}
      <aside className="sidebar">
        <div>
          <h1 className="sidebar__brand">Chalchitra</h1>
          <nav className="sidebar__nav">
            {/* Search Button (Toggles Drawer) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`sidebar__item ${isSearchOpen ? 'sidebar__item--active' : ''}`}
            >
              <Search size={24} />
              <span className="sidebar__item-label">Search</span>
            </button>

            {/* Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSearchOpen(false)}
                className="sidebar__item"
              >
                {item.icon}
                <span className="sidebar__item-label">{item.name}</span>
              </Link>
            ))}

            {/* Create Post Button */}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                if (onOpenCreateModal) onOpenCreateModal();
              }}
              className="sidebar__item"
            >
              <PlusSquare size={24} />
              <span className="sidebar__item-label">Create</span>
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="sidebar__item sidebar__logout"
        >
          <LogOut size={24} />
          <span className="sidebar__item-label">Log out</span>
        </button>
      </aside>

      {/* Instagram-style Slide-out Search Drawer */}
      {isSearchOpen && (
        <div className="search-drawer">
          <div className="search-drawer__header">
            <h2>Search</h2>
            <button onClick={() => setIsSearchOpen(false)} className="search-drawer__close">
              <X size={20} />
            </button>
          </div>

          <div className="search-drawer__field">
            <Search size={16} className="search-drawer__icon" />
            <input
              type="text"
              placeholder="Search posts or creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-drawer__input"
              autoFocus
            />
          </div>

          <div className="search-drawer__results">
            <div className="search-drawer__result-list">
              {searchTerm.trim() ? (
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
                  }}
                  className="search-drawer__result"
                >
                  <Search size={18} />
                  <span>Search for “{searchTerm.trim()}”</span>
                </button>
              ) : (
                <p className="search-drawer__hint">Search captions and creator names.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}