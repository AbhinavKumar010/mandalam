import React from 'react';
import './Avatar.css';

const defaultAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function Avatar({ src, name, className = '', alt }) {
  const hasRealImage = src && src !== defaultAvatarUrl;
  const initials = name?.trim()?.slice(0, 1) || '?';

  return (
    <span className={`avatar ${className}`}>
      {hasRealImage ? (
        <img src={src} alt={alt || name || 'Profile'} className="avatar__image" />
      ) : (
        <span aria-label={alt || name || 'Profile'}>{initials}</span>
      )}
    </span>
  );
}