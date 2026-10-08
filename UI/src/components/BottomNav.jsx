import React from 'react';
import './BottomNav.css';
import { Home, Search, PlusSquare, Film, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';

export default function BottomNav({ onOpenCreateModal }) {
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <nav className="bottom-nav">
      <Link
        to="/"
        aria-label="Home"
        className={`bottom-nav__link ${location.pathname === '/' ? 'bottom-nav__link--active' : ''}`}
      >
        <Home size={24} />
      </Link>

      <Link
        to="/explore"
        aria-label="Explore"
        className={`bottom-nav__link ${location.pathname === '/explore' ? 'bottom-nav__link--active' : ''}`}
      >
        <Search size={24} />
      </Link>

      <Link to="/reels" aria-label="Reels" className={`bottom-nav__link ${location.pathname === '/reels' ? 'bottom-nav__link--active' : ''}`}>
        <Film size={24} />
      </Link>

      {onOpenCreateModal && (
        <button
          onClick={onOpenCreateModal}
          aria-label="Create post"
          className="bottom-nav__action"
        >
          <PlusSquare size={24} />
        </button>
      )}

      <Link to="/messages" aria-label="Messages" className={`bottom-nav__link ${location.pathname === '/messages' ? 'bottom-nav__link--active' : ''}`}>
        <MessageCircle size={24} />
      </Link>

      <Link
        to="/profile"
        aria-label="Profile"
        className={`bottom-nav__profile ${
          location.pathname === '/profile'
            ? 'bottom-nav__profile--active'
            : ''
        }`}
      >
        <Avatar src={currentUser.profilePic} name={currentUser.username} alt="Profile" className="bottom-nav__avatar" />
      </Link>
    </nav>
  );
}