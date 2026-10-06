import React from 'react';

const defaultAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function Avatar({ src, name, className = '', alt }) {
  const hasRealImage = src && src !== defaultAvatarUrl;
  const initials = name?.trim()?.slice(0, 1) || '?';

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 font-semibold uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 ${className}`}>
      {hasRealImage ? (
        <img src={src} alt={alt || name || 'Profile'} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={alt || name || 'Profile'}>{initials}</span>
      )}
    </span>
  );
}