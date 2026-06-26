import React, { useEffect, useRef, useState } from 'react';
// logo served from public folder; accessed via /logo.jpeg
import LandingFooter from './LandingFooter';
import { PLAN_CATALOG, type BillablePlan } from '../lib/plans';

const IG_ICON =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCEKKsORYI72OOL-VFVUV-GmpAwnLuOhaxhalBkBwqSoOnlznMXGNPuD4U67cbUNKh76HhYKc8-IUK1-1kKGI_aWnNlsp6Mettzg7mwsOOu2jQ815U5FhjV5MnucDrRd15Djrh2V6NT7zDZbuT6hlMNfQnq8gZo-GCXFm823pE17v8KS0PSYBvNp1nyDXIFO74HRLGGpqns4e4A971_FPI6k7I8on6XZGCSxZ7alFT-wYrGW1lTu056gkovKa_ZwmfeodgIM3DaIks';

const IG_ICON_LARGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA6OnYOnhQaijPlso-HEy6PfwThia0ZqdSddfW1RceRkysz372Ywa4q8XUX-JZvkaLckk4Btd9RQt-HzK3DVNIJ2dieMjo6Nr7C6Langcs60_GHyvLSZUhO0x_4y3MSyMsiKptTMtp3t-7cPRhfx_DSAIEZ4-QNEYMxjfbXyE26eEfIgPSV-rS2mpO--CXcGeWMqneuEH4GM0dABXAVSTdobESbVwwLzNtTfTANKSqrJc6A6ZW8KWSFbdPpGvwsZZfA61ReOpDbyNM';

const INDIAN_FLAG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpp9oOljojgC5qRp8tDMoE7FXhJMcoHPrQgr9j6fx36B_0L-kp955n4ZX2hLzTmyhKsnfUguZDiliG9MwE3dsY1y4c-eLrBr9ef8PZjWy0cMzkcL5Py8atOXQyibIqUSyriEZ2zLlsYQm0r9eVFbaUcJFjqj4x6CopEpEuTqthk9YdPTNjcgI5XrJroNhoFBC88P0LA0JsHyJWE6YbUIzSV6-wrxKcaZTMtTVpKw1DPoICWOHWlCweOQhvfCsEcXRSImoVoKdxZmc';

const TESTIMONIAL_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAiF6miLuzsD-IGViSMA19g-izsy7NsufAbiYtK0tUaWmADONxqSdnelnKkgOOWGLs4E5-zcy9zNslEfj14fkBp3sGCPbjcLUq4InoVOruNSKJnVTVfNe-9wygKqgKNV24_Gp7RidCJBWM96RSSheSVsfjeRDdNuDrPUFb6D7FJmt9Sf-fMax4Zxb4WkEN6pZ7JM74Lp44S2S3gYrTw5C26cMMISJL73Pq7_yRr6p6qt5CBvNnR1ssVed0DCntvajzKRmg3rZqB8LE';

const TESTIMONIAL_AVATAR_AMIT =
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=112&h=112&q=80';

const TESTIMONIALS = [
  {
    quote:
      'AssistlyDM changed our business literally overnight. We went from missing 40% of our DMs to converting 25% of all inquiries within the first hour. It\'s paid for itself 10x over.',
    name: 'Sarah Jenkins',
    role: 'Founder, Glow Social',
    avatar: TESTIMONIAL_AVATAR,
  },
  {
    quote:
      'The response time is incredible. Customers actually thank us for being so fast. It\'s like having a 24/7 sales team that never sleeps or takes a break. Highly recommend for any e-com store.',
    name: 'Amit Khanna',
    role: 'E-commerce Owner',
    avatar: TESTIMONIAL_AVATAR_AMIT,
  },
  {
    quote:
      'Story mention automations alone brought us 300+ qualified leads last month. We finally stopped copy-pasting the same replies at midnight.',
    name: 'Priya Mehta',
    role: 'Fashion Creator, 180K followers',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=112&h=112&q=80',
  },
  {
    quote:
      'Payment links inside DMs closed ₹4.2L in sales without a single manual follow-up. Our team focuses on product — AssistlyDM handles the inbox.',
    name: 'Rohan Desai',
    role: 'D2C Brand Founder',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=112&h=112&q=80',
  },
  {
    quote:
      'Brand collab DMs used to get lost in fan messages. Now serious partnership requests land in a separate pipeline — we closed 3 deals in 30 days.',
    name: 'Neha Kapoor',
    role: 'Talent Manager',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=112&h=112&q=80',
  },
  {
    quote:
      'Setup took under 10 minutes. Meta-verified connection gave us confidence we wouldn\'t get flagged. Support on WhatsApp is genuinely 24/7.',
    name: 'Vikram Singh',
    role: 'Agency Owner, SocialScale',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=112&h=112&q=80',
  },
] as const;

const CREATOR_AVATARS = {
  storyFan: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80',
  brandLead: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80',
  community: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80',
  ],
};

const REVEAL_SELECTOR = '.reveal:not(.active), .reveal-left:not(.active), .reveal-right:not(.active), .reveal-scale:not(.active)';

function AvatarImg({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} referrerPolicy="no-referrer" />;
}

function CommunityAvatarStack() {
  return (
    <div className="flex items-center pt-1">
      {CREATOR_AVATARS.community.map((src, i) => (
        <span key={src} className={i > 0 ? '-ml-3 inline-flex' : 'inline-flex'}>
          <AvatarImg
            src={src}
            alt={`Community member ${i + 1}`}
            className="h-9 w-9 border-2 border-white shadow-sm"
          />
        </span>
      ))}
      <div className="-ml-3 h-9 min-w-9 px-1.5 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
        +12k
      </div>
    </div>
  );
}

function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: '"FILL" 1' } : undefined}
    >
      {name}
    </span>
  );
}

function StarRow() {
  return (
    <div className="flex gap-1 mb-md">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-sm text-[#FBBF24]"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          star
        </span>
      ))}
    </div>
  );
}

type TestimonialItem = (typeof TESTIMONIALS)[number];

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <article className="testimonial-card bg-white p-lg md:p-xl rounded-2xl shadow-sm border border-outline-variant/30 shrink-0 w-[min(100%,340px)] sm:w-[380px] h-[350px] flex flex-col justify-between">
      <StarRow />
      <p className="text-base md:text-lg mb-xl italic text-on-surface leading-relaxed line-clamp-5">
        &quot;{item.quote}&quot;
      </p>
      <div className="flex items-center gap-md">
        <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary/10 shrink-0">
          <img alt={item.name} className="w-full h-full object-cover" src={item.avatar} referrerPolicy="no-referrer" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-base truncate">{item.name}</p>
          <p className="text-[11px] text-primary uppercase font-extrabold tracking-widest truncate">{item.role}</p>
        </div>
      </div>
    </article>
  );
}

function TestimonialsMarquee() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div className="testimonial-marquee-wrap relative overflow-hidden">
      <div className="testimonial-marquee-fade testimonial-marquee-fade--left" aria-hidden />
      <div className="testimonial-marquee-fade testimonial-marquee-fade--right" aria-hidden />
      <div className="testimonial-marquee-track">
        {loop.map((item, i) => (
          <div key={`${item.name}-${i}`} className="shrink-0">
            <TestimonialCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function HeroTrustFloatCard({
  children,
  className = '',
  delayClass = '',
}: {
  children: React.ReactNode;
  className?: string;
  delayClass?: string;
}) {
  return (
    <div
      className={`hero-trust-float-card bg-white/95 backdrop-blur-sm rounded-2xl border border-outline-variant/25 shadow-lg px-4 py-3.5 flex items-center gap-2.5 w-full max-w-[240px] lg:max-w-[220px] xl:max-w-[240px] ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}

function HeroTrustFloatCards() {
  return (
    <div className="flex flex-col items-center lg:items-end gap-3 lg:gap-4 order-2 lg:order-1 w-full lg:w-auto">
      <HeroTrustFloatCard delayClass="hero-trust-float-card--d0">
        <svg viewBox="0 0 256 171" className="h-8 w-auto shrink-0" aria-hidden>
          <path
            fill="#0081FB"
            d="M60.8 169.9c-24.5 0-43.3-18.3-43.3-42.8 0-28.5 18.5-54.1 45.8-54.1 12.1 0 22.1 4.4 29.8 13.1l6.7 7.9 6.7-7.9c7.7-8.7 17.7-13.1 29.8-13.1 27.3 0 45.8 25.6 45.8 54.1 0 24.5-18.8 42.8-43.3 42.8-12.8 0-23.5-5.7-31.5-16.5l-6.7-8.9-6.7 8.9c-8 10.8-18.7 16.5-31.5 16.5z"
          />
        </svg>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0081FB]">Meta Verified</p>
          <p className="text-sm font-bold text-on-surface leading-tight">Official Business Partner</p>
        </div>
        <Icon name="verified" className="text-[#0081FB] text-xl shrink-0" fill />
      </HeroTrustFloatCard>

      <HeroTrustFloatCard delayClass="hero-trust-float-card--d1">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl instagram-bg shrink-0">
          <img alt="" className="h-5 w-5" src={IG_ICON_LARGE} />
        </span>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Instagram Official API</p>
          <p className="text-sm font-bold text-on-surface leading-tight">Graph API v21 · Verified</p>
        </div>
        <Icon name="check_circle" className="text-success-whatsapp text-xl shrink-0" />
      </HeroTrustFloatCard>

      <HeroTrustFloatCard delayClass="hero-trust-float-card--d2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/20 shrink-0">
          <GoogleIcon className="h-5 w-5" />
        </span>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Secure Login</p>
          <p className="text-sm font-bold text-on-surface leading-tight">Sign in with Google</p>
        </div>
        <Icon name="lock" className="text-primary text-lg shrink-0" />
      </HeroTrustFloatCard>
    </div>
  );
}

function HeroPhoneWithTrust() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-end gap-8 lg:gap-4 xl:gap-6 w-full">
      <HeroTrustFloatCards />
      <div className="order-1 lg:order-2 shrink-0">
        <HeroPhoneMockup />
      </div>
    </div>
  );
}

function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px] lg:w-[320px] xl:w-[340px]">
      <div className="hero-float-card absolute -top-2 right-0 sm:-right-6 z-20 bg-white rounded-2xl shadow-lg border border-outline-variant/20 px-4 py-3 max-w-[180px]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Lead captured</p>
        <p className="text-sm font-bold text-on-surface mt-0.5">@priya_sharma · Email saved</p>
      </div>

      <div className="hero-float-card hero-float-card--delay absolute bottom-20 -left-4 sm:-left-10 z-20 bg-white rounded-2xl shadow-lg border border-outline-variant/20 px-4 py-3 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-emerald-50 text-success-whatsapp flex items-center justify-center shrink-0">
          <Icon name="check" className="text-lg font-bold" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Auto-reply sent</p>
          <p className="text-sm font-bold text-on-surface">In 1.2 seconds</p>
        </div>
      </div>

      <div className="relative rounded-[2.75rem] border-[10px] border-slate-900 bg-slate-900 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.35)] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-10" aria-hidden />
        <div className="bg-white flex flex-col h-[520px] sm:h-[560px]">
          <div className="instagram-bg px-4 pt-9 pb-3 flex items-center gap-3 text-white shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <img alt="" className="w-6 h-6" src={IG_ICON} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight">AssistlyDM</p>
              <p className="text-[11px] text-white/80">Active now</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-3 py-4 space-y-3 bg-[#fafafa]">
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-[#efefef] text-on-surface text-[13px] leading-snug rounded-2xl rounded-br-md px-3.5 py-2.5">
                Is the monthly plan still available?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[88%] bg-white border border-outline-variant/20 text-on-surface text-[13px] leading-snug rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm">
                Hi! Yes — it&apos;s ₹99/mo after a 14-day free trial. Unlimited auto-DMs included. Want to get started? 🚀
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-[#efefef] text-on-surface text-[13px] leading-snug rounded-2xl rounded-br-md px-3.5 py-2.5">
                Yes please!
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[88%] bg-white border border-outline-variant/20 text-on-surface text-[13px] leading-snug rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm">
                Here&apos;s your checkout link — start your free trial in one tap. ✅
              </div>
            </div>
          </div>

          <div className="shrink-0 px-3 py-2.5 border-t border-outline-variant/15 bg-white flex items-center gap-2">
            <div className="flex-1 h-9 rounded-full bg-surface-container-low text-[11px] text-on-surface-variant flex items-center px-3">
              Message...
            </div>
            <div className="w-8 h-8 rounded-full instagram-bg flex items-center justify-center text-white">
              <Icon name="send" className="text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroTrustAvatars() {
  const avatars = [
    TESTIMONIAL_AVATAR,
    TESTIMONIAL_AVATAR_AMIT,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80',
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <div className="flex items-center">
        {avatars.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm ${i > 0 ? '-ml-2.5' : ''}`}
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="material-symbols-outlined text-[#FBBF24] text-base"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              star
            </span>
          ))}
        </div>
        <span className="text-sm text-on-surface-variant font-medium">2,000+ creators trust AssistlyDM</span>
      </div>
    </div>
  );
}

function MetaBusinessPartnerLogo() {
  return (
    <div className="flex items-center gap-3 select-none" aria-label="Meta Business Partners">
      <svg viewBox="0 0 256 171" className="h-11 w-auto shrink-0" aria-hidden>
        <path
          fill="#0081FB"
          d="M60.8 169.9c-24.5 0-43.3-18.3-43.3-42.8 0-28.5 18.5-54.1 45.8-54.1 12.1 0 22.1 4.4 29.8 13.1l6.7 7.9 6.7-7.9c7.7-8.7 17.7-13.1 29.8-13.1 27.3 0 45.8 25.6 45.8 54.1 0 24.5-18.8 42.8-43.3 42.8-12.8 0-23.5-5.7-31.5-16.5l-6.7-8.9-6.7 8.9c-8 10.8-18.7 16.5-31.5 16.5z"
        />
      </svg>
      <div className="leading-[1.15]">
        <span className="block text-[#0081FB] font-bold text-base md:text-lg tracking-tight">Meta Business</span>
        <span className="block text-[#0081FB] font-bold text-base md:text-lg tracking-tight">Partners</span>
      </div>
    </div>
  );
}

type TrustBadgeCardProps = {
  badge: string;
  badgeColor?: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
};

function TrustBadgeCard({
  badge,
  badgeColor = '#0081FB',
  title,
  description,
  visual,
  reverse = false,
}: TrustBadgeCardProps): React.ReactElement {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] border border-slate-100 p-8 md:p-10 lg:p-12 flex flex-col ${
        reverse ? 'md:flex-row-reverse' : 'md:flex-row'
      } items-center gap-8 md:gap-12 hover-lift transition-shadow hover:shadow-[0_8px_32px_-6px_rgba(15,23,42,0.12)]`}
    >
      <div className="flex-1 text-left w-full">
        <p
          className="font-bold text-[11px] uppercase tracking-[0.2em] mb-3"
          style={{ color: badgeColor }}
        >
          {badge}
        </p>
        <h3 className="font-headline-lg font-bold text-2xl md:text-[1.75rem] text-on-surface mb-4 leading-snug tracking-tight">
          {title}
        </h3>
        <p className="text-on-surface-variant text-base md:text-[1.05rem] leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0 flex items-center justify-center w-full md:w-auto md:min-w-[220px] py-2">
        {visual}
      </div>
    </div>
  );
}

const TRUST_BADGES = [
  {
    badge: 'Badged Partner',
    badgeColor: '#0081FB',
    title: 'AssistlyDM is a Meta Business Partner',
    description:
      'We are a certified Meta Business Partner, offering peace of mind to 2,000+ creators and businesses by ensuring complete compliance with Instagram automation standards — no shadow APIs, no account bans.',
    visual: <MetaBusinessPartnerLogo />,
    reverse: false,
  },
  {
    badge: 'Official API',
    badgeColor: '#4f46e5',
    title: 'Built on the Instagram Graph API',
    description:
      'Every message is sent through Meta\'s official Graph API — the same infrastructure used by enterprise brands. Your account stays safe, your data stays encrypted, and your automations stay TOS-compliant.',
    visual: (
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl instagram-bg flex items-center justify-center shadow-lg">
          <img alt="" className="h-9 w-9" src={IG_ICON_LARGE} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 text-success-whatsapp font-bold text-xs uppercase tracking-wider">
            <Icon name="verified" className="text-base" /> Verified
          </span>
          <span className="text-on-surface font-bold text-sm">Graph API v21</span>
        </div>
      </div>
    ),
    reverse: true,
  },
  {
    badge: 'Enterprise Security',
    badgeColor: '#059669',
    title: 'Bank-grade security for your DMs & leads',
    description:
      'OAuth-only Instagram login — we never see your password. All lead data is encrypted in transit and at rest. Role-based access and audit logs keep your customer pipeline secure as you scale.',
    visual: (
      <div className="flex flex-col items-center gap-2 text-emerald-600">
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Icon name="shield_lock" className="text-[44px]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">256-bit SSL</span>
      </div>
    ),
    reverse: false,
  },
  {
    badge: 'Sales Ready',
    badgeColor: '#0C4A6E',
    title: 'Close deals without leaving the DM',
    description:
      'Send product links, catalog cards, and booking URLs directly inside Instagram conversations — built for India\'s 63 million MSMEs with instant lead capture and follow-up automations.',
    visual: (
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto">
          <Icon name="shopping_cart_checkout" className="text-[40px] text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-on-surface-variant">
          <span className="text-xs font-bold uppercase tracking-wider bg-surface-container-low px-3 py-1 rounded-full">Links</span>
          <span className="text-xs font-bold uppercase tracking-wider bg-surface-container-low px-3 py-1 rounded-full">Catalog</span>
          <span className="text-xs font-bold uppercase tracking-wider bg-surface-container-low px-3 py-1 rounded-full">Bookings</span>
        </div>
      </div>
    ),
    reverse: true,
  },
];

const PIPELINE_STEPS = [
  {
    label: 'Official Instagram API',
    sublabel: 'Webhooks · DMs · Comments',
    icon: 'instagram' as const,
  },
  {
    label: 'AssistlyDM Engine',
    sublabel: 'AI routing · Rules · Lead capture',
    icon: 'engine' as const,
  },
  {
    label: '24/7 Sales Engine',
    sublabel: 'Payments · Bookings · Follow-ups',
    icon: 'sales' as const,
  },
];

const PIPELINE_EVENTS = [
  { step: 0, tag: 'Incoming', text: 'DM from @priya_sharma: "Is this still available?"' },
  { step: 1, tag: 'Processing', text: 'Keyword matched → FAQ auto-reply sent in 1.2s' },
  { step: 2, tag: 'Converted', text: 'Checkout link delivered · Lead saved to CRM' },
];

const PRICING_FEATURES = [
  'Unlimited Auto-DM Replies',
  'Keyword Comment Automation',
  'Story Mention Reactions',
  'Lead Capture & Contacts CRM',
  '24/7 Priority Support',
] as const;

const PRICING_PLANS = (['Monthly', 'Yearly'] as BillablePlan[]).map((key) => ({
  id: key.toLowerCase(),
  name: PLAN_CATALOG[key].label,
  price: PLAN_CATALOG[key].priceLabel,
  period: PLAN_CATALOG[key].cycleLabel,
  badge: PLAN_CATALOG[key].badge || '',
  subtitle: PLAN_CATALOG[key].description,
  cta: key === 'Monthly' ? 'Start Free Trial' : 'Get Yearly Plan',
  highlighted: PLAN_CATALOG[key].highlighted ?? false,
}));

function PipelineConnector({ delay = false }: { delay?: boolean }) {
  return (
    <div className="relative flex items-center justify-center shrink-0 w-full h-10 md:w-16 md:h-auto md:flex-1 md:min-w-[3rem] lg:min-w-[5rem] md:max-w-[7rem]">
      <div className="absolute inset-0 flex items-center justify-center md:hidden">
        <div className="w-0.5 h-full rounded-full pipeline-connector-line pipeline-connector-line--vertical" />
      </div>
      <div className="absolute inset-0 hidden md:flex items-center">
        <div className="w-full h-0.5 rounded-full pipeline-connector-line" />
      </div>
      <div
        className={`absolute pipeline-packet w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] md:left-0 md:top-1/2 left-1/2 top-0 ${delay ? 'pipeline-packet--delay' : ''}`}
        aria-hidden
      />
    </div>
  );
}

function IntegrationPipeline() {
  const [activeStep, setActiveStep] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setEventIndex(activeStep);
  }, [activeStep]);

  const currentEvent = PIPELINE_EVENTS[eventIndex];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-0 md:gap-2 lg:gap-4 mb-10">
        {PIPELINE_STEPS.map((step, i) => (
          <React.Fragment key={step.label}>
            <div
              className={`flex flex-col items-center text-center transition-all duration-500 ${
                activeStep === i ? 'scale-105' : 'scale-100 opacity-80'
              }`}
            >
              <div
                className={`relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mb-md transition-all duration-500 ${
                  step.icon === 'instagram'
                    ? 'bg-white'
                    : step.icon === 'engine'
                      ? 'bg-primary-container border-4 border-white/20'
                      : 'bg-success-whatsapp'
                } ${activeStep === i ? 'pipeline-node-active' : ''}`}
              >
                {step.icon === 'instagram' && <img alt="Instagram" className="h-12 w-12" src={IG_ICON_LARGE} />}
                {step.icon === 'engine' && <img alt="AssistlyDM" className="h-12 w-12 rounded-xl object-cover" src="/logo.jpeg" />}
                {step.icon === 'sales' && <Icon name="trending_up" className="text-[48px] text-white" />}
                {activeStep === i && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white" />
                  </span>
                )}
              </div>
              <p className="font-bold text-lg leading-tight">{step.label}</p>
              <p className="text-xs text-white/70 mt-1 max-w-[11rem]">{step.sublabel}</p>
              <span
                className={`mt-2 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full transition-all duration-500 ${
                  activeStep === i ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                {activeStep === i ? 'Active' : 'Standby'}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && <PipelineConnector delay={i === 1} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-5 text-left overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="pipeline-live-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Live pipeline</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Always on</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step.label}>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all duration-500 ${
                  activeStep >= i ? 'bg-white/25 text-white' : 'bg-white/5 text-white/35'
                }`}
              >
                {i + 1}. {step.label.split(' ').slice(0, 2).join(' ')}
              </span>
              {i < PIPELINE_STEPS.length - 1 && (
                <Icon name="arrow_forward" className="text-sm text-white/30 hidden sm:inline" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div
          key={currentEvent.text}
          className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-3 pipeline-event-in"
        >
          <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest bg-white text-primary px-2 py-1 rounded-md">
            {currentEvent.tag}
          </span>
          <p className="text-sm md:text-base font-medium text-white/95 leading-snug">{currentEvent.text}</p>
        </div>
      </div>
    </div>
  );
}

function TrustBadgesSection() {
  return (
    <section className="py-24 md:py-32 bg-surface-alt relative z-10" id="trust">
      <div className="max-w-container-max mx-auto px-lg">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 reveal">
          <span className="text-primary font-extrabold uppercase tracking-widest text-[12px] mb-4 block">
            Trust &amp; Compliance
          </span>
          <h2 className="font-headline-lg text-3xl md:text-4xl text-on-surface leading-tight">
            Built on official partnerships, not workarounds
          </h2>
        </div>
        <div className="max-w-5xl mx-auto space-y-6">
          {TRUST_BADGES.map((item, i) => (
            <div key={item.title} className="reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <TrustBadgeCard
                badge={item.badge}
                badgeColor={item.badgeColor}
                title={item.title}
                description={item.description}
                visual={item.visual}
                reverse={item.reverse}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface HeroLandingViewProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onGoToConsole: () => void;
  isLoggedIn?: boolean;
}

export default function HeroLandingView({
  onGetStarted,
  onLogin,
  onGoToConsole,
  isLoggedIn = false,
}: HeroLandingViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );

    const observeAll = () => {
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el));
    };

    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });

    const onScroll = () => {
      const header = headerInnerRef.current;
      if (!header) return;
      if (window.scrollY > 20) {
        header.classList.add('shadow-lg', 'bg-white/90');
      } else {
        header.classList.remove('shadow-lg', 'bg-white/90');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Features', id: 'features' },
    { label: 'Solutions', id: 'creators' },
    { label: 'Trust', id: 'trust' },
    { label: 'Pricing', id: 'pricing' },
  ];

  return (
    <div ref={rootRef} className="bg-surface text-on-surface font-sans overflow-x-hidden antialiased">

      {/* Navigation */}
      <header className="fixed top-0 w-full z-[100] px-4 md:px-lg py-md">
        <div
          ref={headerInnerRef}
          className="max-w-container-max mx-auto flex justify-between items-center glass-card rounded-full px-4 md:px-lg py-sm shadow-sm transition-shadow"
        >
          <button type="button" onClick={() => scrollTo('landing-hero-view')} className="flex items-center gap-sm cursor-pointer shrink-0">
            <img alt="AssistlyDM Logo" className="h-8 w-8 rounded-lg object-contain" src="/logo.jpeg" />
            <span className="font-headline-md font-bold text-primary tracking-tight hidden sm:inline">AssistlyDM</span>
          </button>

          <nav className="hidden md:flex items-center gap-6 lg:gap-xl">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-sm font-medium cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-md">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onGoToConsole}
                className="hidden sm:block text-primary font-semibold hover:opacity-75 transition-opacity cursor-pointer text-sm"
              >
                Console
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="hidden sm:inline-flex items-center gap-2 text-on-surface font-semibold hover:opacity-75 transition-opacity cursor-pointer text-sm border border-outline-variant/40 rounded-full px-3 py-1.5 bg-white"
              >
                <GoogleIcon className="h-4 w-4" />
                Sign in with Google
              </button>
            )}
            <button
              type="button"
              onClick={onGetStarted}
              className="hidden sm:inline-flex bg-primary text-on-primary px-lg py-sm rounded-full font-bold text-sm hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 text-on-surface-variant hover:text-primary cursor-pointer"
              aria-label="Toggle menu"
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-2xl" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden max-w-container-max mx-auto mt-2 glass-card rounded-2xl px-lg py-md shadow-lg border border-outline-variant/20">
            <nav className="flex flex-col gap-sm">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollTo(link.id)}
                  className="text-left py-2 text-on-surface-variant hover:text-primary font-medium cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <div className="h-px bg-outline-variant/30 my-2" />
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center justify-center gap-2 text-left py-2 text-on-surface font-semibold cursor-pointer border border-outline-variant/40 rounded-xl px-3"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Sign in with Google
                </button>
              )}
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm cursor-pointer mt-1"
              >
                Get Started
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-white" id="landing-hero-view">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white to-surface-container-low/40" aria-hidden />

          <div className="max-w-container-max mx-auto px-lg relative z-10 py-12 md:py-16 w-full" id="hero-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 xl:gap-16 items-center">
              {/* Left — copy & CTAs */}
              <div className="reveal active max-w-xl lg:max-w-none mx-auto lg:mx-0 text-center lg:text-left">
                <h1 className="font-display-lg font-extrabold text-[2.35rem] sm:text-5xl lg:text-[3.25rem] xl:text-6xl leading-[1.08] text-on-surface mb-5 tracking-tight">
                  Your 24/7 sales team{' '}
                  <span className="text-primary">is one connection away.</span>
                </h1>

                <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                  AssistlyDM automates Instagram DMs, comments, and story replies — so every lead gets answered in under 2 seconds.
                  Built for creators and brands in India. Starting at ₹99/month after a 14-day free trial.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5">
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-3.5 rounded-full font-bold text-base sm:text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Start 14-Day Free Trial
                    <Icon name="arrow_forward" className="text-xl" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo('how-it-works')}
                    className="inline-flex items-center justify-center gap-2 border border-outline-variant/50 bg-white text-on-surface px-8 py-3.5 rounded-full font-bold text-base sm:text-lg hover:bg-surface-container-low transition-all cursor-pointer"
                  >
                    <Icon name="play_circle" className="text-xl text-on-surface-variant" />
                    See it in action
                  </button>
                </div>

                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto border border-outline-variant/50 bg-white text-on-surface px-6 py-3 rounded-full font-semibold text-base shadow-sm hover:bg-surface-container-low hover:shadow-md active:scale-[0.98] transition-all cursor-pointer mb-5 mx-auto lg:mx-0"
                  >
                    <GoogleIcon />
                    Continue with Google — secure login
                    <Icon name="lock" className="text-base text-on-surface-variant" />
                  </button>
                )}

                <p className="text-sm text-on-surface-variant/80 mb-6">
                  3 min setup · Cancel anytime · No password required
                </p>

                <div className="flex justify-center lg:justify-start">
                  <HeroTrustAvatars />
                </div>
              </div>

              {/* Right — trust cards + phone */}
              <div className="reveal active w-full" style={{ transitionDelay: '150ms' }}>
                <HeroPhoneWithTrust />
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-32 bg-surface-container-lowest relative z-10 isolate" id="problem">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 reveal-left">
                <div className="relative">
                  <div className="bg-white p-lg rounded-2xl shadow-2xl border border-outline-variant/30 relative z-10">
                    <div className="flex items-center justify-between mb-lg">
                      <h4 className="font-bold text-lg">Current Workflow</h4>
                      <span className="bg-error/10 text-error px-sm py-xs rounded text-[10px] font-bold uppercase tracking-widest">Inefficient</span>
                    </div>
                    <div className="space-y-md">
                      <div className="flex items-center gap-md p-md bg-surface-container-low rounded-lg opacity-40">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm">
                          <img alt="Instagram" className="h-6 w-6" src={IG_ICON} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-24 bg-outline-variant rounded" />
                          <div className="h-2 w-16 bg-outline-variant/50 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-md p-md bg-error/5 rounded-lg border-l-4 border-error shadow-sm">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm">
                          <Icon name="timer_off" className="text-error" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-on-surface">Unanswered DM</p>
                          <p className="text-[11px] text-on-surface-variant font-medium">Lead abandoned after 4+ hours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-md p-md bg-surface-container-low rounded-lg opacity-40">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm">
                          <Icon name="mail" className="text-primary" />
                        </div>
                        <div className="h-2 w-32 bg-outline-variant rounded" />
                      </div>
                    </div>
                    <p className="mt-lg text-center text-sm text-error font-semibold italic">
                      &quot;You&apos;re losing 60% of potential sales due to delay.&quot;
                    </p>
                  </div>
                  <div className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 bg-error text-white px-md py-sm rounded-xl shadow-xl transform rotate-6 animate-pulse z-20">
                    <span className="font-bold text-sm">Lost Revenue</span>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 reveal-right">
                <h2 className="font-black text-3xl tracking-tighter hover:text-primary transition-colors cursor-default italic tracking-tight">
                  Drowning in DMs while your leads go cold?
                </h2>
                <p className="text-lg text-on-surface-variant mb-lg leading-relaxed">
                  In the attention economy, speed is your only competitive advantage. If you don&apos;t reply within 5 minutes, 80% of leads move to your competitor. Manually answering the same questions isn&apos;t a strategy—it&apos;s a bottleneck.
                </p>
                <ul className="space-y-lg">
                  <li className="flex items-start gap-md group">
                    <div className="bg-error/10 p-2 rounded-lg group-hover:bg-error/20 transition-colors">
                      <Icon name="cancel" className="text-error font-bold" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Manual Burnout</p>
                      <p className="text-on-surface-variant">Your team spends 4+ hours daily copy-pasting answers that AI could handle in milliseconds.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-md group">
                    <div className="bg-error/10 p-2 rounded-lg group-hover:bg-error/20 transition-colors">
                      <Icon name="cancel" className="text-error font-bold" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Lead Leakage</p>
                      <p className="text-on-surface-variant">Hot leads in comments get buried under the algorithm before you even see them.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <TrustBadgesSection />

        {/* Creator Economy */}
        <section className="py-32 bg-creator-surface relative overflow-hidden" id="creators">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-creator-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="max-w-container-max mx-auto px-lg relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 reveal">
              <span className="text-creator-accent font-extrabold uppercase tracking-widest text-[12px] mb-4 block">Tailored for Talent</span>
              <h2 className="font-headline-lg text-4xl md:text-5xl mb-6">Empowering Creators &amp; Businesses</h2>
              <p className="text-xl text-on-surface-variant font-medium">
                Turn followers into fans, and fans into customers with tools built for the modern creator.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-20">
              <div className="bg-white p-lg rounded-2xl border border-creator-accent/20 hover-lift reveal-scale" style={{ transitionDelay: '0ms' }}>
                <div className="w-16 h-16 bg-creator-accent/10 text-creator-accent rounded-2xl flex items-center justify-center mb-lg">
                  <Icon name="shopping_bag" className="text-[32px]" />
                </div>
                <h3 className="font-bold text-2xl mb-sm">Maximize Revenue</h3>
                <p className="text-on-surface-variant leading-relaxed mb-md">Turn every story tag into a sale with automated shop links.</p>
                <div className="bg-creator-surface p-md rounded-xl border border-creator-accent/10">
                  <div className="flex items-center gap-sm mb-2">
                    <div className="w-2 h-2 rounded-full bg-creator-accent" />
                    <span className="text-[10px] font-bold text-creator-accent uppercase tracking-widest">Story Trigger Active</span>
                  </div>
                  <div className="flex items-center gap-md">
                    <AvatarImg src={CREATOR_AVATARS.storyFan} alt="Story mention from fan" className="w-8 h-8 ring-2 ring-white" />
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[72%] bg-creator-accent/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-lg rounded-2xl border border-creator-accent/20 hover-lift reveal-scale" style={{ transitionDelay: '120ms' }}>
                <div className="w-16 h-16 bg-creator-accent/10 text-creator-accent rounded-2xl flex items-center justify-center mb-lg">
                  <Icon name="filter_list" className="text-[32px]" />
                </div>
                <h3 className="font-bold text-2xl mb-sm">Brand-First Automation</h3>
                <p className="text-on-surface-variant leading-relaxed mb-md">Automatically sort serious brand offers from regular fan DMs.</p>
                <div className="bg-creator-surface p-md rounded-xl border border-creator-accent/10">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-2">
                    <span className="text-on-surface-variant">DM Triage</span>
                    <span className="text-success-whatsapp">Collab Detected</span>
                  </div>
                  <div className="flex items-center gap-md mb-2">
                    <AvatarImg src={CREATOR_AVATARS.brandLead} alt="Brand collaboration lead" className="w-8 h-8 ring-2 ring-white" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-creator-accent w-[85%]" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-lg rounded-2xl border border-creator-accent/20 hover-lift reveal-scale" style={{ transitionDelay: '240ms' }}>
                <div className="w-16 h-16 bg-creator-accent/10 text-creator-accent rounded-2xl flex items-center justify-center mb-lg">
                  <Icon name="favorite" className="text-[32px]" />
                </div>
                <h3 className="font-bold text-2xl mb-sm">Community Nurturing</h3>
                <p className="text-on-surface-variant leading-relaxed mb-md">
                  Engagement that feels personal, even at scale. Acknowledge every fan comment with unique, context-aware AI replies.
                </p>
                <CommunityAvatarStack />
              </div>
            </div>
          </div>
        </section>

        {/* Integration banner */}
        <section className="py-24 bg-primary text-on-primary relative overflow-hidden" id="integration">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,transparent_70%)]" />
          <div className="max-w-container-max mx-auto px-lg text-center reveal relative z-10">
            <span className="text-white/70 font-extrabold uppercase tracking-widest text-[12px] mb-4 block">How it connects</span>
            <h2 className="font-display-lg text-4xl md:text-5xl mb-6">One Integration. Total Automation.</h2>
            <p className="text-lg max-w-2xl mx-auto opacity-90 leading-relaxed font-medium mb-12">
              Watch your Instagram inbox flow through AssistlyDM — from incoming DM to closed sale, automatically.
            </p>
            <IntegrationPipeline />
            <p className="mt-10 text-base max-w-3xl mx-auto opacity-80 leading-relaxed font-medium">
              Connect your account in clicks. AssistlyDM handles the heavy lifting—answering questions, sharing catalogs, and closing deals while you sleep.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-32 bg-surface-alt" id="features">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="text-center mb-20 reveal">
              <span className="text-primary font-extrabold uppercase tracking-widest text-[12px] mb-4 block">Core Capabilities</span>
              <h2 className="font-headline-lg text-4xl md:text-5xl">Built for High-Growth Brands</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {[
                { icon: 'chat_bubble', title: 'Auto-Reply Comments', desc: 'Instantly DM anyone who comments specific keywords on your reels or posts. Turn casual engagement into direct sales conversations.' },
                { icon: 'calendar_month', title: 'Smart Scheduling', desc: 'Direct Calendly integration. Let leads book demos or consultations instantly inside the DM thread without jumping apps.' },
                { icon: 'contact_page', title: 'Lead Intelligence', desc: "Automatically harvest emails and phone numbers. Build a robust CRM database outside of Instagram's walled garden." },
                { icon: 'translate', title: 'Global Language Support', desc: "Respond to global customers in 50+ native languages with AI-driven context. Speak your customer's language fluently." },
                { icon: 'payments', title: 'In-Chat Checkout', desc: 'Share shop links and checkout URLs in DMs. Close sales without sending followers off Instagram.' },
                { icon: 'analytics', title: 'Revenue Analytics', desc: 'Track every rupee generated through automation. Real-time dashboards showing conversion rates and ROI per campaign.' },
              ].map((f, i) => (
                <div key={f.title} className="bg-white p-lg rounded-xl border border-outline-variant/30 hover-lift reveal-scale group" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-md group-hover:bg-primary group-hover:text-white transition-all">
                    <Icon name={f.icon} />
                  </div>
                  <h3 className="font-bold text-xl mb-sm">{f.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-surface-container-lowest" id="how-it-works">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="text-center mb-20 reveal">
              <h2 className="font-headline-lg text-4xl md:text-5xl">Go live in 3 simple steps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl relative">
              {[
                { n: 1, title: 'Secure Connect', desc: 'Link your Instagram account via our official Meta-verified bridge. 100% safe & TOS compliant.', delay: '0ms' },
                { n: 2, title: 'Configure Rules', desc: 'Define keywords and AI knowledge base.', delay: '150ms' },
                { n: 3, title: 'Automate & Scale', desc: 'Watch the engine work. Scale your sales volume without increasing your headcount.', delay: '300ms' },
              ].map((s, i, arr) => (
                <div
                  key={s.n}
                  className={`flex flex-col items-center text-center reveal-scale connecting-line ${i === arr.length - 1 ? 'connecting-line-last' : ''}`}
                  style={{ transitionDelay: s.delay }}
                >
                  <div className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-3xl mb-lg shadow-xl shadow-primary/20 relative z-10 hover:scale-110 transition-transform">
                    {s.n}
                  </div>
                  <h3 className="font-bold text-2xl mb-md">{s.title}</h3>
                  <p className="text-on-surface-variant px-md">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* India ecosystem */}
        <section className="py-32 bg-surface-container-low border-y border-outline-variant/20 overflow-hidden relative">
          <div className="max-w-4xl mx-auto px-lg text-center reveal">
            <div className="inline-flex items-center gap-md bg-white px-md py-sm rounded-full shadow-sm border border-outline-variant/30 mb-lg">
              <img alt="Indian Flag" className="h-4 w-6 rounded-sm shadow-sm" src={INDIAN_FLAG} />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">Proudly Built in India</span>
            </div>
            <h2 className="font-headline-lg text-4xl md:text-5xl mb-md">Tailored for the Indian Ecosystem</h2>
            <p className="text-lg text-on-surface-variant mb-16 leading-relaxed">
              We&apos;re built for India&apos;s 63 million MSMEs. From Calendly booking links to WhatsApp fallback and local 24/7 support, we speak the language of Bharat&apos;s creators.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-xl items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              {['META', 'shopify', 'CALENDLY', 'ZAPIER'].map((brand) => (
                <div key={brand} className={`font-black text-3xl tracking-tighter hover:text-primary transition-colors cursor-default ${brand === 'shopify' ? 'italic tracking-tight' : ''}`}>{brand}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-32 bg-surface-container-lowest" id="pricing">
          <div className="max-w-container-max mx-auto px-lg">
            <div className="text-center mb-20 reveal">
              <h2 className="font-headline-lg text-4xl md:text-5xl mb-md">Simple, Predictable Pricing</h2>
              <p className="text-lg text-on-surface-variant">Transparent plans designed for every stage of growth.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl mx-auto">
              {PRICING_PLANS.map((plan, i) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl relative overflow-hidden reveal-scale hover-lift ${
                    plan.highlighted
                      ? 'shadow-2xl border-2 border-primary'
                      : 'shadow-lg border border-outline-variant/30'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`text-center py-3 font-bold text-[11px] uppercase tracking-widest ${
                      plan.highlighted ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {plan.badge}
                  </div>
                  <div className="p-lg md:p-xl">
                    <h3 className="font-bold text-2xl md:text-3xl mb-1">{plan.name}</h3>
                    <p className="text-sm text-on-surface-variant mb-lg">{plan.subtitle}</p>
                    <div className="flex items-baseline gap-1 mb-xl">
                      <span className="text-5xl font-black text-primary">{plan.price}</span>
                      <span className="text-on-surface-variant font-medium">{plan.period}</span>
                    </div>
                    <ul className="space-y-lg mb-xl">
                      {PRICING_FEATURES.map((item) => (
                        <li key={item} className="flex items-center gap-md">
                          <Icon name="check_circle" className="text-success-whatsapp font-bold shrink-0" />
                          <span className="font-medium text-sm md:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={onGetStarted}
                      className={`w-full py-lg rounded-xl font-bold text-lg active:scale-95 transition-all mb-md cursor-pointer ${
                        plan.highlighted
                          ? 'bg-primary text-on-primary hover:shadow-xl hover:shadow-primary/30'
                          : 'border-2 border-primary text-primary hover:bg-primary/5'
                      }`}
                    >
                      {plan.cta}
                    </button>
                    <p className="text-center text-xs text-on-surface-variant font-medium">
                      {plan.id === 'monthly' ? 'No card required to start trial.' : 'Billed once yearly. Cancel anytime.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 bg-surface-alt overflow-hidden" id="testimonials">
          <div className="max-w-container-max mx-auto px-lg mb-12 md:mb-16">
            <div className="text-center reveal">
              <h2 className="font-headline-lg text-3xl md:text-4xl">Trusted by 2,000+ Scalable Brands</h2>
            </div>
          </div>
          <TestimonialsMarquee />
        </section>

        {/* Final CTA */}
        <section className="py-32 px-lg relative overflow-hidden bg-primary text-on-primary">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform origin-top-right" />
          <div className="max-w-3xl mx-auto text-center relative z-10 reveal-scale">
            <h2 className="font-display-lg text-4xl md:text-6xl mb-md">Ready to never lose a lead again?</h2>
            <p className="text-xl mb-xl opacity-90 leading-relaxed max-w-2xl mx-auto">
              Join the automation revolution. Setup takes less time than drinking your morning tea. Scale your impact today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-md">
              <button
                type="button"
                onClick={onGetStarted}
                className="bg-white text-primary px-xl py-md rounded-xl font-extrabold text-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="border-2 border-white/40 backdrop-blur-sm px-xl py-md rounded-xl font-extrabold text-xl hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
              >
                Book a Live Demo
              </button>
            </div>
            <div className="mt-xl flex items-center justify-center gap-sm opacity-70 text-sm">
              <Icon name="verified_user" className="text-[18px]" />
              Official Meta Business Partner Verified
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
