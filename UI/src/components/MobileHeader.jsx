import React from 'react';
import { Search, MessageCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 px-4 h-12 flex items-center justify-between">
      <h1 className="text-xl font-bold font-serif tracking-tight">Chalchitra</h1>
      <div className="flex items-center gap-4">
        <Link to="/explore" aria-label="Explore" className="text-neutral-800 dark:text-neutral-200">
          <Search size={22} />
        </Link>
        <Link to="/notifications" aria-label="Notifications" className="text-neutral-800 dark:text-neutral-200">
          <Bell size={22} />
        </Link>
        <Link to="/messages" className="text-neutral-800 dark:text-neutral-200">
          <MessageCircle size={22} />
        </Link>
      </div>
    </header>
  );
}