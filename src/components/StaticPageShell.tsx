import React from 'react';
// Logo path moved to public folder
import LandingFooter from './LandingFooter';

type StaticPageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function StaticPageShell({ title, subtitle, children }: StaticPageShellProps) {
  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant/20 px-lg py-4">
        <div className="max-w-container-max mx-auto flex items-center justify-between gap-4">
          <a href="#landing" className="flex items-center gap-sm shrink-0">
            <img alt="AssistlyDM" className="h-8 w-8 rounded-lg object-cover" src="/logo.jpeg" />
            <span className="font-headline-md font-bold text-primary tracking-tight hidden sm:inline">AssistlyDM</span>
          </a>
          <a
            href="#landing"
            className="text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
          >
            ← Back to home
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-lg py-12 md:py-16">
        <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface mb-3">{title}</h1>
        {subtitle && <p className="text-on-surface-variant mb-10">{subtitle}</p>}
        <div className="static-page-content text-on-surface-variant leading-relaxed space-y-6">{children}</div>
      </main>

      <LandingFooter />
    </div>
  );
}
