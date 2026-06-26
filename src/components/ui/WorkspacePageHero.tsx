import React from 'react';
import { BadgeCheck, ShieldCheck, Camera } from 'lucide-react';

type WorkspacePageHeroProps = {
  badge: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  visualIcon: React.ReactNode;
  chipTitle?: string;
  chipSubtitle?: string;
  gradient?: 'instagram' | 'primary';
};

export function WorkspacePageHero({
  badge,
  title,
  subtitle,
  actions,
  visualIcon,
  chipTitle = 'Live on Instagram',
  chipSubtitle = 'DMs & comments synced',
  gradient = 'instagram',
}: WorkspacePageHeroProps) {
  const gradientClass =
    gradient === 'instagram'
      ? 'bg-gradient-to-br from-instagram-gradient-start to-instagram-gradient-end'
      : 'bg-gradient-to-br from-primary via-primary-container to-secondary';

  return (
    <section className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container overflow-hidden relative group p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold uppercase tracking-wider">
              {badge}
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Official Meta Partner
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-success-whatsapp" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Secure</span>
            </div>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl font-bold text-on-surface leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">{subtitle}</p>

          {actions && <div className="pt-2 flex flex-wrap gap-4">{actions}</div>}
        </div>

        <div className="relative w-full lg:w-[440px] h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.01] shrink-0">
          <div className={`absolute inset-0 opacity-90 ${gradientClass}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-36 h-36 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl text-white">
              {visualIcon}
            </div>
          </div>
          <div className="absolute bottom-6 left-6 glass-card px-4 py-3 rounded-xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 instagram-bg rounded-lg flex items-center justify-center text-white shadow-lg">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">{chipTitle}</h4>
              <p className="text-[11px] text-on-surface-variant font-medium">{chipSubtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WorkspaceSummaryCard({
  title,
  label,
  hint,
  icon,
  watermarkIcon,
  accent = 'primary',
  pulse,
}: {
  title: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  watermarkIcon?: React.ReactNode;
  accent?: 'primary' | 'secondary' | 'tertiary';
  pulse?: boolean;
}) {
  const iconBg =
    accent === 'primary'
      ? 'bg-primary-fixed text-primary'
      : accent === 'secondary'
      ? 'bg-secondary-fixed text-secondary'
      : 'bg-tertiary-fixed text-tertiary';

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      {watermarkIcon && (
        <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
          {watermarkIcon}
        </div>
      )}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-on-surface">{title}</h3>
          {pulse && <span className="flex h-2 w-2 rounded-full bg-success-whatsapp animate-pulse" />}
        </div>
        <p className="text-sm font-semibold text-on-surface-variant">{label}</p>
        {hint && <p className="text-xs text-outline mt-2">{hint}</p>}
      </div>
    </div>
  );
}

export function WorkspaceFooter() {
  return (
    <footer className="py-8 text-center text-outline text-xs font-medium border-t border-surface-container mt-4">
      © {new Date().getFullYear()} AssistlyDM. Built for high-performance social business.
    </footer>
  );
}
