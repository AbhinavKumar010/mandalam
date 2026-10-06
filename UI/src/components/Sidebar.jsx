import React, { useState } from 'react';
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
    <div className="relative flex">
      {/* Primary Sidebar (Hidden on mobile via 'hidden md:flex') */}
      <aside className="hidden md:flex w-64 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0 flex-col justify-between p-4 bg-white dark:bg-black text-black dark:text-white z-30">
        <div>
          <h1 className="text-2xl font-bold tracking-tight px-3 py-4 font-serif">Chalchitra</h1>
          <nav className="flex flex-col gap-2 mt-4">
            {/* Search Button (Toggles Drawer) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors text-left w-full ${
                isSearchOpen ? 'bg-neutral-100 dark:bg-neutral-800 font-bold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <Search size={24} />
              <span className="text-base font-medium">Search</span>
            </button>

            {/* Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSearchOpen(false)}
                className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                {item.icon}
                <span className="text-base font-medium">{item.name}</span>
              </Link>
            ))}

            {/* Create Post Button */}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                if (onOpenCreateModal) onOpenCreateModal();
              }}
              className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-left w-full"
            >
              <PlusSquare size={24} />
              <span className="text-base font-medium">Create</span>
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-red-500"
        >
          <LogOut size={24} />
          <span className="text-base font-medium">Log out</span>
        </button>
      </aside>

      {/* Instagram-style Slide-out Search Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-y-0 left-64 w-80 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shadow-xl p-5 z-20 flex flex-col transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Search</h2>
            <button onClick={() => setIsSearchOpen(false)} className="text-neutral-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search posts or creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-neutral-400"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mt-3 flex flex-col gap-2">
              {searchTerm.trim() ? (
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
                  }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-left"
                >
                  <Search size={18} />
                  <span className="text-sm">Search for “{searchTerm.trim()}”</span>
                </button>
              ) : (
                <p className="p-2 text-xs text-neutral-500">Search captions and creator names.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}