import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Instagram, 
  Zap, 
  UserPlus, 
  HelpCircle, 
  TrendingUp, 
  MessageSquare, 
  Phone, 
  Flag, 
  User, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Bell,
  ArrowRightLeft
} from 'lucide-react';
import { Contact, Activity, FAQ, BusinessProfile } from '../types';

function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setCount(0);
      return;
    }
    const totalMiliseconds = duration;
    const stepTime = 15;
    const totalSteps = Math.max(Math.floor(totalMiliseconds / stepTime), 1);
    const increment = end / totalSteps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(increment * currentStep));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

interface DashboardViewProps {
  businessProfile: BusinessProfile;
  contacts: Contact[];
  faqs: FAQ[];
  activities: Activity[];
  onNavigateTo: (screen: 'contacts' | 'automation_builder' | 'faq_settings' | 'onboarding1') => void;
}

export default function DashboardView({
  businessProfile,
  contacts,
  faqs,
  activities,
  onNavigateTo
}: DashboardViewProps) {
  const [currentDateString, setCurrentDateString] = useState('');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ day: string; value: number } | null>(null);
  const [dashboardFaqFilter, setDashboardFaqFilter] = useState<string>('All');

  const filteredFaqs = dashboardFaqFilter === 'All'
    ? faqs
    : faqs.filter(f => f.category === dashboardFaqFilter);

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateString(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Contact Growth data index mapping
  const chartData = [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 40 },
    { day: 'Wed', value: 65 },
    { day: 'Thu', value: 50 },
    { day: 'Fri', value: 85 },
    { day: 'Sat', value: 75 },
    { day: 'Sun', value: 125 }
  ];

  // Map activities to their icon colors
  const getActivityStyles = (type: Activity['type']) => {
    switch (type) {
      case 'person':
        return {
          bg: 'bg-blue-100 text-blue-600',
          icon: <User className="w-4 h-4 text-blue-600" />
        };
      case 'call':
        return {
          bg: 'bg-green-100 text-green-600',
          icon: <Phone className="w-4 h-4 text-green-600" />
        };
      case 'chat_bubble':
        return {
          bg: 'bg-purple-100 text-purple-600',
          icon: <MessageSquare className="w-4 h-4 text-purple-600" />
        };
      case 'flag':
        return {
          bg: 'bg-amber-100 text-amber-600',
          icon: <Flag className="w-4 h-4 text-amber-600" />
        };
      default:
        return {
          bg: 'bg-primary/10 text-primary',
          icon: <Sparkles className="w-4 h-4 text-primary" />
        };
    }
  };

  return (
    <div className="space-y-8 text-left pb-16" id="dashboard-view-panel">
      {/* Sarah's Welcome Header and Bell counter represent Screen 6 */}
      <header className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-on-surface">
            Welcome back, Sarah!
          </h2>
          <p className="font-sans text-sm text-on-surface-variant font-medium">
            {currentDateString || "Tuesday, June 23, 2026"}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-on-surface-variant shadow-sm border border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer relative">
            <Bell className="w-5 h-5 text-on-surface-variant" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          
          {/* Initials badge SB */}
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center border-2 border-surface-container-highest shadow-sm">
            <span className="font-sans font-bold text-sm text-primary">SB</span>
          </div>
        </div>
      </header>

      {/* Statistics Row Stats grid (Screen 6) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="dashboard-stats-grid">
        {/* Stat item 1 */}
        <div 
          onClick={() => onNavigateTo('onboarding1')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-4 hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-success-whatsapp/10 flex items-center justify-center text-success-whatsapp">
            <CheckCircle className="w-6 h-6 text-success-whatsapp fill-success-whatsapp/15" />
          </div>
          <div className="text-left">
            <p className="font-sans font-bold text-xs text-on-surface-variant leading-none mb-1">Instagram Link</p>
            <p className="font-sans font-extrabold text-lg text-success-whatsapp">Connected</p>
          </div>
        </div>

        {/* Stat item 2 */}
        <div 
          onClick={() => onNavigateTo('automation_builder')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-4 hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer font-sans"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap className="w-6 h-6 text-primary fill-primary/10" />
          </div>
          <div className="text-left">
            <p className="font-sans font-bold text-xs text-on-surface-variant leading-none mb-1">Automation Engine</p>
            <p className="font-sans font-extrabold text-lg text-primary">{businessProfile.statusOn ? 'Active ON' : 'Draft Mode'}</p>
          </div>
        </div>

        {/* Stat item 3 */}
        <div 
          onClick={() => onNavigateTo('contacts')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-4 hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer font-sans"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <UserPlus className="w-6 h-6 text-secondary" />
          </div>
          <div className="text-left">
            <p className="font-sans font-bold text-xs text-on-surface-variant leading-none mb-1">Contacts Collected</p>
            <p className="font-sans font-extrabold text-lg text-on-surface">
              <AnimatedCounter value={contacts.length} />
            </p>
          </div>
        </div>

        {/* Stat item 4 */}
        <div 
          onClick={() => onNavigateTo('faq_settings')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-4 hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer font-sans"
        >
          <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary">
            <HelpCircle className="w-6 h-6 text-tertiary" />
          </div>
          <div className="text-left">
            <p className="font-sans font-bold text-xs text-on-surface-variant leading-none mb-1">FAQs Configured</p>
            <p className="font-sans font-extrabold text-lg text-on-surface">
              <AnimatedCounter value={faqs.length} />
            </p>
          </div>
        </div>
      </section>

      {/* Main Bento Graph and Activity columns split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Contact Growth Area Graph Spans 2 cols */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between" id="dashboard-chart-block">
          <div className="flex justify-between items-center mb-6">
            <div className="text-left">
              <h3 className="font-display font-bold text-lg text-on-surface">Contact Lead Growth</h3>
              <p className="font-sans text-xs text-on-surface-variant">Trends over the last 7 days</p>
            </div>
            <div>
              <span className="px-3 py-1 bg-success-whatsapp/10 text-success-whatsapp rounded-lg font-sans font-bold text-xs">
                +12% conversion index
              </span>
            </div>
          </div>

          {/* Interactive Responsive custom vector graph represent Recharts */}
          <div className="h-64 w-full relative flex items-end justify-between border-b border-outline-variant/20 pb-8 pt-4">
            {/* SVG drawing containing gorgeous gradients */}
            <svg 
              className="absolute bottom-8 left-0 w-full h-44 overflow-visible" 
              viewBox="0 0 600 150" 
              preserveAspectRatio="none"
              id="svg-contact-growth"
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3525cd" stopOpacity="0.25"></stop>
                  <stop offset="100%" stopColor="#3525cd" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>

              {/* Area path */}
              <path 
                d="M 10 100 Q 100 110 190 60 T 370 70 T 550 20 L 590 10 L 590 150 L 10 150 Z" 
                fill="url(#chartFill)"
              />

              {/* Curve line */}
              <path 
                d="M 10 100 Q 100 110 190 60 T 370 70 T 550 20 L 590 10" 
                fill="none" 
                stroke="#3525cd" 
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Graph checkpoints nodes */}
              <circle cx="10" cy="100" r="5" fill="#3525cd" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" />
              <circle cx="190" cy="60" r="5" fill="#3525cd" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" />
              <circle cx="370" cy="70" r="5" fill="#3525cd" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" />
              <circle cx="550" cy="20" r="5" fill="#3525cd" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" />
            </svg>

            {/* Hover details display overlay trigger */}
            {hoveredDataPoint && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-on-surface text-white px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex gap-2 items-center shadow-lg z-10 animate-scale-up">
                <span className="text-primary-fixed">{hoveredDataPoint.day}:</span>
                <span>{hoveredDataPoint.value} new leads</span>
              </div>
            )}

            {/* Simulated interactive hovering triggers for days */}
            {chartData.map((d, idx) => (
              <div 
                key={idx} 
                className="flex-1 h-full hover:bg-primary/5 transition-colors cursor-pointer rounded-lg relative z-10 flex flex-col justify-end"
                onMouseEnter={() => setHoveredDataPoint({ day: d.day, value: d.value })}
                onMouseLeave={() => setHoveredDataPoint(null)}
              >
                <span className="text-[10px] text-outline font-sans font-bold mt-2 text-center pb-1">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center mt-3 text-[11px] text-outline px-2">
            <span className="font-sans font-semibold">Conversations converted into leads: <AnimatedCounter value={contacts.length * 4} /> total</span>
            <span>Refreshed: Just now</span>
          </div>
        </section>

        {/* Right Side: Recent Activity Feed index */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between" id="dashboard-activity-feed">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-base text-on-surface">Recent DM Activity</h3>
            <button 
              onClick={() => onNavigateTo('contacts')}
              className="text-primary font-sans font-bold text-xs hover:underline cursor-pointer"
            >
              View Leads CRM
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-outline font-sans text-xs">
                No active events logged yet.
              </div>
            ) : (
              activities.slice(0, 4).map((act) => {
                const style = getActivityStyles(act.type);
                return (
                  <div 
                    key={act.id} 
                    className="flex gap-3 p-2 hover:bg-surface-container-low/50 rounded-xl transition-all text-left cursor-default group"
                  >
                    <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-sans font-bold text-xs text-on-surface truncate pr-1">@{act.username}</p>
                        <span className="font-sans text-[10px] text-outline shrink-0 opacity-80">{act.timestamp}</span>
                      </div>
                      <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                        {act.action}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Dynamic Store FAQ Directory grouped by category */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 text-left" id="dashboard-faq-summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" /> Active FAQ Responders
            </h3>
            <p className="font-sans text-xs text-on-surface-variant">
              Interactive preview of answers currently armed on your Instagram brand.
            </p>
          </div>
          <button 
            onClick={() => onNavigateTo('faq_settings')}
            className="text-primary font-sans font-bold text-xs hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Configure FAQs
          </button>
        </div>

        {/* Categories toggler */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-outline-variant/20 pb-4">
          {['All', 'Pricing', 'Location', 'Shipping', 'General'].map((cat) => {
            const isActive = dashboardFaqFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setDashboardFaqFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100/70'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Grouped Lists or Filtered List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaqs.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-outline font-sans text-xs">
              No FAQs configured under this category. Click "Configure FAQs" to create one!
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div 
                key={faq.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/50 hover:bg-slate-50/80 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] uppercase font-sans font-extrabold px-2 py-0.5 rounded-full border bg-white ${
                      faq.category === 'Pricing' 
                        ? 'text-primary border-primary/20 bg-primary/5' 
                        : faq.category === 'Location' 
                        ? 'text-tertiary border-tertiary-container/30 bg-tertiary-container/5'
                        : faq.category === 'Shipping' 
                        ? 'text-secondary border-secondary/20 bg-secondary/5' 
                        : 'text-on-surface-variant border-outline-variant/30 bg-outline-variant/5'
                    }`}>
                      {faq.category}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-slate-800 mb-1">Q: {faq.question}</h4>
                  <p className="font-sans text-xs text-slate-500 italic pl-2 border-l-2 border-primary/20 leading-relaxed mb-3">
                    "A: {faq.answer}"
                  </p>
                </div>
                {/* FAQ tags representation if available */}
                {faq.tags && faq.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {faq.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-sans font-medium px-2 py-0.5 bg-white text-slate-500 border border-slate-200 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Promos lower layout row represent bottom section of Screen 6 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Promo item 1: Scale outreach */}
        <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 flex flex-col justify-between items-start relative overflow-hidden group">
          <div className="relative z-10 space-y-4 text-left">
            <span className="bg-primary/15 text-primary tracking-widest font-sans font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full">
              INTEGRATION ENGINE
            </span>
            <h4 className="font-display font-extrabold text-lg text-primary">Scale Your CRM Outreach</h4>
            <p className="font-sans text-sm text-on-surface-variant max-w-sm leading-relaxed">
              Automatically sync the customer contact numbers and emails collected by AssistlyDM straight into Google Sheets, Slack, or Salesforce.
            </p>
            <button 
              onClick={() => alert("Integrations are configured via Settings. Sync models are armed!")}
              className="bg-primary text-white px-5 py-3 rounded-xl font-sans font-bold text-xs hover:bg-primary-container transition-colors cursor-pointer"
            >
              Setup Integrations
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        {/* Promo item 2: Stories feature release (Dark Card) */}
        <div className="bg-inverse-surface text-white p-8 rounded-2xl flex flex-col justify-between items-start relative overflow-hidden text-left font-sans">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-secondary-fixed">
              <Sparkles className="w-5 h-5 text-secondary-fixed fill-secondary-fixed" />
              <span className="font-sans font-bold text-xs uppercase tracking-wide">Brand New Release Feature</span>
            </div>
            <h4 className="font-display font-extrabold text-lg text-white">AI Story Reply Responders</h4>
            <p className="font-sans text-sm text-white/80 leading-relaxed">
              Your automated DM bot can now automatically detect when followers mention your business in their Stories and reply instantly with a custom coupon!
            </p>
          </div>
          <button 
            onClick={() => alert("Story Responders can be styled inside the Trigger Automations tab!")}
            className="text-primary-fixed hover:underline flex items-center gap-1 font-sans font-bold text-xs mt-6 cursor-pointer"
          >
            Learn how it works <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
