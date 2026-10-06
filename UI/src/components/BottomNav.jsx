import React from 'react';
import { Home, Search, PlusSquare, Film, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';

export default function BottomNav({ onOpenCreateModal }) {
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 h-12 px-6 flex items-center justify-between">
      <Link
        to="/"
        aria-label="Home"
        className={location.pathname === '/' ? 'text-black dark:text-white' : 'text-neutral-500'}
      >
        <Home size={24} />
      </Link>

      <Link
        to="/explore"
        aria-label="Explore"
        className={location.pathname === '/explore' ? 'text-black dark:text-white' : 'text-neutral-500'}
      >
        <Search size={24} />
      </Link>

      <Link to="/reels" aria-label="Reels" className={location.pathname === '/reels' ? 'text-black dark:text-white' : 'text-neutral-500'}>
        <Film size={24} />
      </Link>

      {onOpenCreateModal && (
        <button
          onClick={onOpenCreateModal}
          aria-label="Create post"
          className="text-neutral-800 dark:text-neutral-200 focus:outline-none"
        >
          <PlusSquare size={24} />
        </button>
      )}

      <Link to="/messages" aria-label="Messages" className={location.pathname === '/messages' ? 'text-black dark:text-white' : 'text-neutral-500'}>
        <MessageCircle size={24} />
      </Link>

      <Link
        to="/profile"
        aria-label="Profile"
        className={`w-6 h-6 rounded-full overflow-hidden border ${
          location.pathname === '/profile'
            ? 'border-black dark:border-white'
            : 'border-transparent'
        }`}
      >
        <Avatar src={currentUser.profilePic} name={currentUser.username} alt="Profile" className="h-full w-full" />
      </Link>
    </nav>
  );
}