import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  const name = user.displayName || 'User';
  const avatar = user.photoURL || '/default-avatar.png';

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
      <div className="flex items-center gap-3">
        <span className="text-sm text-on-surface-variant">{name}</span>
        <img
          src={avatar}
          alt="User avatar"
          className="w-9 h-9 rounded-full object-cover border border-outline-variant/30"
        />
      </div>
    </header>
  );
}
