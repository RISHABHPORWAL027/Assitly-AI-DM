import React from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'pink' | 'green' | 'purple';
  imageUrl?: string;
};

const accentMap = {
  blue: 'stat-accent-blue',
  pink: 'stat-accent-pink',
  green: 'stat-accent-green',
  purple: 'stat-accent-purple',
};

export function StatCard({ label, value, hint, icon, accent = 'blue', imageUrl }: StatCardProps) {
  return (
    <div className={`stat-card ${accentMap[accent]}`}>
      {imageUrl && (
        <div className="stat-card-image-wrap">
          <img src={imageUrl} alt="" className="stat-card-image" />
          <div className="stat-card-image-overlay" />
        </div>
      )}
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <p className="stat-card-value">{value}</p>
        <p className="stat-card-label">{label}</p>
        {hint && <p className="stat-card-hint">{hint}</p>}
      </div>
    </div>
  );
}
