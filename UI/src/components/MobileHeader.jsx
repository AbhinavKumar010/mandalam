import React from 'react';
import './MobileHeader.css';
import { Search, MessageCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MobileHeader() {
  return (
    <header className="mobile-header">
      <h1 className="mobile-header__brand">Chalchitra</h1>
      <div className="mobile-header__actions">
        <Link to="/explore" aria-label="Explore" className="mobile-header__link">
          <Search size={22} />
        </Link>
        <Link to="/notifications" aria-label="Notifications" className="mobile-header__link">
          <Bell size={22} />
        </Link>
        <Link to="/messages" className="mobile-header__link">
          <MessageCircle size={22} />
        </Link>
      </div>
    </header>
  );
}