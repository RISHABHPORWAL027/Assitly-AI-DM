import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Bot, 
  Home, 
  Zap, 
  Settings, 
  Users, 
  CreditCard, 
  Instagram, 
  LogOut, 
  ExternalLink,
  ShieldAlert,
  BookOpen,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';

import { ScreenType, FAQ, Contact, AutomationSettings, BusinessProfile, Activity } from './types';
import HeroLandingView from './components/HeroLandingView';
import OnboardingStep1 from './components/OnboardingStep1';
import AutomationBuilderView from './components/AutomationBuilderView';
import FAQSettingsView from './components/FAQSettingsView';
import ContactsView from './components/ContactsView';
import PricingView from './components/PricingView';
import DashboardView from './components/DashboardView';

// Default initial payloads
const defaultBusinessProfile: BusinessProfile = {
  name: "Chef Sarah's Cafe",
  email: "sarah@chefscafe.com",
  address: "123 Artisan Way, San Francisco, CA",
  hoursWeekdays: "8:00 AM - 8:00 PM",
  hoursWeekends: "10:00 AM - 6:00 PM",
  statusOn: true
};

const defaultAutomation: AutomationSettings = {
  triggerType: 'Instagram DM',
  triggerKeywords: ['hey', 'hello', 'hi', 'greetings', 'pricing', 'hours'],
  messageText: 'Hey there! 🍰 Welcome to {company_name}! We answers pricing, location and store hours automatically. Ask us anything, or check menu prices!',
  isLive: true
};

const defaultFAQs: FAQ[] = [
  { id: 'faq_1', question: 'How much are your custom cakes?', answer: 'Our custom celebration cakes start at $45 and vary based on layers and flavors. DM us your design style and scale for a detailed rate!', category: 'Pricing', tags: ['cakes', 'bakes', 'rates'] },
  { id: 'faq_2', question: 'Where can I find your cafe?', answer: 'We are located at 123 Artisan Way in San Francisco! Look for the large blue awning next to the contemporary gallery.', category: 'Location', tags: ['address', 'hours', 'direction'] },
  { id: 'faq_3', question: 'Do you offer local shipping / delivery?', answer: 'Yes! We offer flat-rate $10 local delivery inside San Francisco. Pick up is always available free of charge during hours.', category: 'Shipping', tags: ['delivery', 'fees', 'pickup'] },
  { id: 'faq_4', question: 'Do you have vegan allergen options?', answer: 'We bake fresh vegan gluten-free cookies and almond-milk chocolate cupcakes daily. Ask a barista to hold yours!', category: 'General', tags: ['vegan', 'gluten-free', 'allergies'] }
];

const defaultContacts: Contact[] = [
  { id: 'lead_1', username: 'johndoe_design', phone: '+1 (555) 0192', email: 'john.d@design.co', dateAdded: 'Today', source: 'Instagram' },
  { id: 'lead_2', username: 'stylist_mia', phone: '+1 (555) 0392', email: 'mia@stylist.co', dateAdded: 'Yesterday', source: 'Automation' },
  { id: 'lead_3', username: 'coffee_roasters', phone: '+1 (555) 7821', email: 'beans@roasters.com', dateAdded: '2 days ago', source: 'Automation' },
  { id: 'lead_4', username: 'alex_ventur', phone: '+1 (555) 9021', email: 'alex@ventures.com', dateAdded: 'Oct 20, 2023', source: 'Instagram' }
];

const defaultActivities: Activity[] = [
  { id: 'act_1', username: 'johndoe_design', timestamp: '2m ago', action: 'Asked about pricing plans for birthday bakes', type: 'chat_bubble' },
  { id: 'act_2', username: 'stylist_mia', timestamp: '15m ago', action: 'Left phone number via lead capture prompt', type: 'call' },
  { id: 'act_3', username: 'coffee_roasters', timestamp: '1h ago', action: 'Triggered store timings automated response', type: 'person' },
  { id: 'act_4', username: 'alex_ventur', timestamp: '3h ago', action: 'Sent unknown request requiring Human Help', type: 'flag' }
];

export default function App() {
  // Navigation screen router
  const [screen, setScreen] = useState<ScreenType>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States with LocalPersistence initializer
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('assistly_profile');
    return saved ? JSON.parse(saved) : defaultBusinessProfile;
  });

  const [automation, setAutomation] = useState<AutomationSettings>(() => {
    const saved = localStorage.getItem('assistly_automation');
    return saved ? JSON.parse(saved) : defaultAutomation;
  });

  const [faqs, setFaqs] = useState<FAQ[]>(() => {
    const saved = localStorage.getItem('assistly_faqs');
    return saved ? JSON.parse(saved) : defaultFAQs;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('assistly_contacts');
    return saved ? JSON.parse(saved) : defaultContacts;
  });

  const [activities, setActivities] = useState<Activity[]>(defaultActivities);
  const [isInstagramConnected, setIsInstagramConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem('assistly_ig_link');
    return saved ? JSON.parse(saved) : true; // default linked for Sarah showcase
  });

  const [currentPlan, setCurrentPlan] = useState<'Free' | 'Starter' | 'Growth'>(() => {
    const saved = localStorage.getItem('assistly_plan');
    return saved ? JSON.parse(saved) : 'Starter';
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('assistly_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('assistly_automation', JSON.stringify(automation));
  }, [automation]);

  useEffect(() => {
    localStorage.setItem('assistly_faqs', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem('assistly_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('assistly_ig_link', JSON.stringify(isInstagramConnected));
  }, [isInstagramConnected]);

  useEffect(() => {
    localStorage.setItem('assistly_plan', JSON.stringify(currentPlan));
  }, [currentPlan]);

  const handleUpdateProfile = (updated: BusinessProfile) => {
    setProfile(updated);
  };

  const handleUpdateAutomation = (updated: AutomationSettings) => {
    setAutomation(updated);
  };

  const handleUpdateFAQs = (updated: FAQ[]) => {
    setFaqs(updated);
  };

  const handleUpdateContacts = (updated: Contact[]) => {
    setContacts(updated);
  };

  const handleConnectedStatusChange = (status: boolean) => {
    setIsInstagramConnected(status);
    if (status) {
      // Append a connection activity
      const connAct: Activity = {
        id: 'act_' + Date.now(),
        username: 'meta_security',
        timestamp: 'Just now',
        action: 'Secure Meta Handshake Link Verified',
        type: 'person'
      };
      setActivities([connAct, ...activities]);
    }
  };

  const handleUpgradePlan = (plan: 'Starter' | 'Growth') => {
    setCurrentPlan(plan);
  };

  const handleSaveAutomationComplete = () => {
    alert('Automation configuration saved and armed securely! Check the Interactive Simulator.');
    setScreen('dashboard');
  };

  // Nav actions
  const isWorkspace = screen !== 'landing';

  const navItems = [
    { name: 'Dashboard', id: 'dashboard' as const, icon: <Home className="w-5 h-5" /> },
    { name: 'Instagram Wizard', id: 'onboarding1' as const, icon: <Instagram className="w-5 h-5" /> },
    { name: 'Direct Automations', id: 'automation_builder' as const, icon: <Zap className="w-5 h-5" /> },
    { name: 'Business FAQs', id: 'faq_settings' as const, icon: <Settings className="w-5 h-5" /> },
    { name: 'Collected CRM Leads', id: 'contacts' as const, icon: <Users className="w-5 h-5" /> },
    { name: 'Subscription Plan', id: 'pricing' as const, icon: <CreditCard className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-surface-alt text-on-surface flex flex-col font-sans selection:bg-primary/20">
      
      {/* Dynamic Global Top Header (Marketing or Workspace context) */}
      <nav className="bg-white border-b border-outline-variant/30 sticky top-0 z-40" id="global-navigation-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo Brand Brand Identifier */}
            <div 
              onClick={() => setScreen('landing')}
              className="flex items-center gap-2 cursor-pointer group"
              id="app-branding-header"
            >
              <div className="w-9 h-9 rounded-xl instagram-bg flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white fill-white animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="font-display font-black text-lg tracking-tight text-on-surface">AssistlyDM</h1>
                <p className="text-[9px] font-mono text-outline leading-none">V1.2 Active Sandbox</p>
              </div>
            </div>

            {/* Desktop Navigation path lists */}
            {!isWorkspace ? (
              <div className="hidden md:flex items-center gap-8 font-sans text-sm font-semibold text-on-surface-variant">
                <a href="#landing-hero-view" className="hover:text-primary transition-colors">Features</a>
                <a href="#how-it-works-landing" className="hover:text-primary transition-colors">How It Works</a>
                <button onClick={() => setScreen('pricing')} className="hover:text-primary transition-colors cursor-pointer">Pricing</button>
                
                <span className="h-4 w-[1px] bg-outline-variant/60" />

                <button 
                  onClick={() => setScreen('dashboard')}
                  className="bg-primary text-white hover:bg-primary-container px-4.5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                  id="btn-nav-console"
                >
                  Go to DM Console
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="bg-success-whatsapp/15 text-success-whatsapp px-3 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider">
                  Sarah's Sandbox Dashboard
                </span>
                <button 
                  onClick={() => setScreen('landing')}
                  className="border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-lg text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer"
                  title="Logout back to public landing"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <div className="flex md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-outline hover:text-on-surface transition-colors cursor-pointer p-1"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu panel layout */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-outline-variant/30 px-4 py-4 space-y-3 shadow-lg flex flex-col text-left">
            {!isWorkspace ? (
              <>
                <a 
                  href="#landing-hero-view" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block font-sans font-semibold text-sm hover:text-primary"
                >
                  Features
                </a>
                <a 
                  href="#how-it-works-landing" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block font-sans font-semibold text-sm hover:text-primary"
                >
                  How It Works
                </a>
                <button 
                  onClick={() => { setScreen('pricing'); setMobileMenuOpen(false); }}
                  className="block text-left font-sans font-semibold text-sm hover:text-primary"
                >
                  Pricing
                </button>
                <div className="h-[1px] bg-outline-variant/30" />
                <button 
                  onClick={() => { setScreen('dashboard'); setMobileMenuOpen(false); }}
                  className="w-full bg-primary text-white py-3 rounded-xl font-sans font-bold text-sm text-center"
                >
                  Go to DM Console
                </button>
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setScreen(item.id); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-sans font-bold text-left ${
                      screen === item.id 
                        ? 'bg-primary text-white' 
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </nav>

      {/* Main Container Workspace */}
      <div className="flex flex-1 flex-col md:flex-row max-w-7xl mx-auto w-full">
        
        {/* Workspace core sidebar (Shown only inside cockpit environment) */}
        {isWorkspace && (
          <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant/30 bg-white p-6 justify-between gap-6 shrink-0" id="cockpit-sidebar">
            <div className="space-y-6">
              <span className="font-mono text-[9px] uppercase tracking-widest text-outline font-extrabold block text-left">
                Cockpit Navigation
              </span>

              {/* Sidebar items */}
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = screen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setScreen(item.id)}
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-sans font-extrabold text-left transition-all tracking-wide cursor-pointer ${
                        isActive 
                          ? 'bg-primary text-white shadow-md shadow-primary/10' 
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom active profile specs */}
            <div className="border-t border-outline-variant/30 pt-4 flex gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm text-on-surface">
                S
              </div>
              <div>
                <p className="font-sans font-bold text-xs text-on-surface truncate pr-1">Sarah's Cafe</p>
                <span className="px-2 py-0.5 bg-outline-variant/30 text-on-surface-variant text-[9px] font-mono rounded font-bold uppercase mt-1 inline-block">
                  {currentPlan} plan
                </span>
              </div>
            </div>
          </aside>
        )}

        {/* Primary View content switch */}
        <main className={`flex-1 flex flex-col p-4 md:p-8 ${isWorkspace ? 'bg-surface-alt' : 'bg-surface max-w-none w-full p-0 md:p-0'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col"
            >
              {screen === 'landing' && (
                <HeroLandingView 
                  onGetStarted={() => setScreen('onboarding1')} 
                  onNavigateToPricing={() => setScreen('pricing')}
                />
              )}

              {screen === 'onboarding1' && (
                <OnboardingStep1 
                  initialConnected={isInstagramConnected}
                  onConnectedStatusChange={handleConnectedStatusChange}
                  onNextStep={() => setScreen('automation_builder')}
                  onBackToDashboard={() => setScreen('dashboard')}
                />
              )}

              {screen === 'automation_builder' && (
                <AutomationBuilderView 
                  automation={automation}
                  businessProfile={profile}
                  onUpdateAutomation={handleUpdateAutomation}
                  onSave={handleSaveAutomationComplete}
                  onBack={() => setScreen('dashboard')}
                />
              )}

              {screen === 'faq_settings' && (
                <FAQSettingsView 
                  businessProfile={profile}
                  faqs={faqs}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateFAQs={handleUpdateFAQs}
                />
              )}

              {screen === 'contacts' && (
                <ContactsView 
                  contacts={contacts}
                  onUpdateContacts={handleUpdateContacts}
                />
              )}

              {screen === 'pricing' && (
                <PricingView 
                  currentPlan={currentPlan}
                  onUpgradePlan={handleUpgradePlan}
                />
              )}

              {screen === 'dashboard' && (
                <DashboardView 
                  businessProfile={profile}
                  contacts={contacts}
                  faqs={faqs}
                  activities={activities}
                  onNavigateTo={(target) => setScreen(target)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Global Minimal Footer */}
      <footer className="bg-white border-t border-outline-variant/30 py-8 text-center text-xs text-outline font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 AssistlyDM. Powered by the Meta Graph Integration API.</p>
          <div className="flex gap-4">
            <button onClick={() => setScreen('landing')} className="hover:underline hover:text-primary cursor-pointer">Product Landing</button>
            <button onClick={() => setScreen('pricing')} className="hover:underline hover:text-primary cursor-pointer">Sub Pricing</button>
            <span className="text-outline/40">|</span>
            <span className="font-mono text-[10px] text-primary font-bold">Secure SSL Authorized</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

