import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  id?: string;
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', interactive = false, padding = 'md', id }: CardProps) {
  return (
    <div
      id={id}
      className={[
        'card-surface',
        paddingMap[padding],
        interactive ? 'card-interactive cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  badge,
  action,
  className = '',
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${className}`}>
      <div className="space-y-1.5">
        {badge}
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-on-surface">{title}</h2>
        {subtitle && <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
