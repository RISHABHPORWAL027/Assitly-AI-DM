import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Check, 
  MessageSquare, 
  Bot, 
  User, 
  Link as LinkIcon, 
  Edit3, 
  Rocket,
  ArrowRightLeft,
  Scissors,
  Home,
  Building,
  Trophy,
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  Users,
  DollarSign,
  ShieldAlert,
  Award
} from 'lucide-react';

interface HeroLandingViewProps {
  onGetStarted: () => void;
  onNavigateToPricing: () => void;
}

export default function HeroLandingView({ onGetStarted, onNavigateToPricing }: HeroLandingViewProps) {
  // Animated conversation simulator
  const [chatStep, setChatStep] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; keywords?: string[]; actions?: string[] }>>([
    { sender: 'user', text: 'Hey there! Do you guys have slots this Saturday?' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const timer = setInterval(() => {
      setChatStep(prev => {
        const next = (prev + 1) % 4;
        if (next === 0) {
          setChatMessages([{ sender: 'user', text: 'Hey there! Do you guys have slots this Saturday?' }]);
        } else if (next === 1) {
          setChatMessages(prevMsg => [
            ...prevMsg,
            { 
              sender: 'bot', 
              text: 'Hey there! 🌟 Yes, we have availability this Saturday at 2 PM. Would you like to book that slot?',
              actions: ['Book Now', 'View Menu']
            }
          ]);
        } else if (next === 2) {
          setChatMessages(prevMsg => [
            ...prevMsg,
            { sender: 'user', text: 'Yes please! What is your address?' }
          ]);
        } else if (next === 3) {
          setChatMessages(prevMsg => [
            ...prevMsg,
            { 
              sender: 'bot', 
              text: 'We are located at 123 Artisan Way, San Francisco, CA. Look for the blue awning next to the gallery!' 
            }
          ]);
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const [activeNicheId, setActiveNicheId] = useState('salons');

  const nicheDetails = [
    {
      id: 'salons',
      name: 'Salons & Spas',
      tagline: 'Book haircuts, balayage, and manicures automatically.',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&h=400&q=80',
      alt: 'Luxury boutique salon styling chair and interior decor',
      question: 'Hey! Is there any slot for a balayage tomorrow afternoon?',
      reply: 'Hi highness! 💇‍♀️ Yes, we have a slot at 3 PM tomorrow with stylist Sarah. Tap below to book!',
      icon: <Scissors className="w-4 h-4" />
    },
    {
      id: 'villas',
      name: 'Luxury Villas & Stays',
      tagline: 'Answer booking inquiries, check-in details, and amenity lists.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&h=400&q=80',
      alt: 'Beautiful modern private villa with a crystal swimming pool',
      question: 'Hello! Is the villa pool heated during October?',
      reply: 'Hello traveler! ☀️ Yes, our private infinity pool is heated to a comfortable 84°F (29°C) year-round at no extra cost.',
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'realtors',
      name: 'Real Estate Agents',
      tagline: 'Capture buyer leads, schedule open houses, and send listings.',
      image: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&h=400&q=80',
      alt: 'Realtor showing potential new home buyer details on a tablet',
      question: 'Hi, is the 3-bed apartment in SOMA still available to tour?',
      reply: 'Hi! 🏠 Yes, the SOMA property is active! We have open walkthroughs this Thursday at 5 PM. Would you like a booking link?',
      icon: <Building className="w-4 h-4" />
    },
    {
      id: 'coaches',
      name: 'Coaches & Creators',
      tagline: 'Sell digital guides, courses, or schedule masterclass consultations.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&h=400&q=80',
      alt: 'Certified fitness personal coach explaining strategy with premium gear',
      question: 'Do you still have spots left for your 12-week scaling blueprint?',
      reply: 'Hey strategist! ⚡ Only 3 spots left for this cohort. You can grab your slot and view the curriculum right here!',
      icon: <Trophy className="w-4 h-4" />
    },
    {
      id: 'small-businesses',
      name: 'Local Retailers',
      tagline: 'Provide instant updates on opening hours, shop location, and stock.',
      image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=600&h=400&q=80',
      alt: 'Highly aesthetic local boutique storefront design',
      question: 'Hey there, are you guys open today and do you deliver?',
      reply: 'We are open today until 8 PM! 🛍️ Yes, we offer free shipping on all orders over $75. Order online using the link in our bio!',
      icon: <ShoppingBag className="w-4 h-4" />
    }
  ];

  const niches = [
    { name: 'Villas', id: 'n-villas' },
    { name: 'Salons', id: 'n-salons' },
    { name: 'Realtors', id: 'n-realtors' },
    { name: 'Coaches', id: 'n-coaches' },
    { name: 'Small Businesses', id: 'n-small' }
  ];

  const steps = [
    {
      step: 'Step 01',
      title: 'Connect Instagram',
      description: 'Securely link your professional Instagram account with one click using our official API integration.',
      icon: <LinkIcon className="w-7 h-7 text-primary" />,
      hoverClass: 'group-hover:bg-gradient-to-tr group-hover:from-instagram-gradient-start group-hover:to-instagram-gradient-end'
    },
    {
      step: 'Step 02',
      title: 'Add Business Info',
      description: 'Simply type in your pricing, hours, location, and common FAQs. Our AI learns your business details instantly.',
      icon: <Edit3 className="w-7 h-7 text-primary" />,
      hoverClass: 'group-hover:bg-primary'
    },
    {
      step: 'Step 03',
      title: 'Go Live',
      description: 'Toggle the switch and watch AssistlyDM handle inquiries instantly, leaving you to focus on your craft.',
      icon: <Rocket className="w-7 h-7 text-primary" />,
      hoverClass: 'group-hover:bg-success-whatsapp'
    }
  ];

  // ROI Calculator state
  const [estMonthlyDMs, setEstMonthlyDMs] = useState(800);
  const [avgTicketPrice, setAvgTicketPrice] = useState(65);
  const [currentResponseRate, setCurrentResponseRate] = useState(40); // % of DMs answered fast enough

  // Formulas
  // Missed opportunities = DMs * (100 - currentResponseRate)%
  const missedDMs = Math.round(estMonthlyDMs * (1 - currentResponseRate / 100));
  // Conservative estimate that 15% of missed DMs would turn into paying clients with a 1.5s auto-responder
  const recoveredSalesCount = Math.round(missedDMs * 0.18);
  const recoveredMonthlyValue = recoveredSalesCount * avgTicketPrice;
  const recoveredAnnualValue = recoveredMonthlyValue * 12;

  return (
    <div id="landing-hero-view" className="relative pb-16 bg-slate-50/50">
      {/* Top Banner Warning Box (Hook 1) */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-center text-xs font-sans font-bold flex items-center justify-center gap-2 select-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span>Every 5-minute delay on an Instagram DM drops sales conversions by 80%. Protect your pipeline today.</span>
      </div>

      {/* Hero Header Section */}
      <section className="relative min-h-[700px] flex items-center px-4 md:px-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full py-16">
          {/* Left Column Content */}
          <div className="space-y-6 z-10 text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary fill-primary" />
              <span className="font-sans font-semibold text-xs tracking-wider uppercase">Conversion-First Automation</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-on-surface leading-tight text-left tracking-tight">
              Turn "How Much?" <br />
              Comments & DMs <br />
              into <span className="text-primary bg-clip-text">Instant Checkouts</span>
            </h1>

            <p className="font-sans text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Stop losing paying customers to late replies. AssistlyDM acts as your 24/7 AI-Receptionist on Instagram—instantly delivering pricing, menus, booking calendar links, and location answers in under 2 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                id="btn-hero-cta"
                onClick={onGetStarted}
                className="bg-primary text-white px-8 py-4 rounded-xl font-sans font-bold text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Automating Free <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                id="btn-hero-demo"
                onClick={onNavigateToPricing}
                className="border border-outline/30 text-on-surface px-8 py-4 rounded-xl font-sans font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-on-surface mt-[1px]" /> See Plans & Rates
              </button>
            </div>

            {/* Quick Micro-Proofs */}
            <div className="pt-6 flex flex-wrap gap-x-6 gap-y-2 items-center text-xs text-slate-400 font-sans border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>No complex chat flow builds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Official Meta API Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>

          {/* Right Column Visual / Animated Conversation Preview */}
          <div className="relative flex items-center justify-center py-6">
            {/* Background ambient lighting */}
            <div className="absolute w-[360px] h-[360px] bg-primary/20 rounded-full blur-[80px]"></div>
            <div className="absolute w-[280px] h-[280px] bg-secondary/15 rounded-full blur-[60px] top-4 right-4 animate-pulse"></div>

            {/* High-Fidelity Smartphone Mockup Frame */}
            <div className="relative z-10 w-full max-w-[360px] bg-slate-950 p-2.5 rounded-[50px] shadow-2xl border-4 border-slate-800/90 transform hover:scale-[1.02] transition-transform duration-500">
              
              {/* Phone Inner Screen Mockup */}
              <div className="bg-slate-50 rounded-[40px] overflow-hidden flex flex-col h-[525px] relative">
                
                {/* Simulated Phone Ear-Piece & Camera Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-white flex justify-between items-center px-6 text-[10px] text-slate-500 font-sans select-none z-30 shrink-0">
                  <span className="font-semibold">9:41</span>
                  <div className="w-18 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute right-4"></div>
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <span>5G</span>
                  </div>
                </div>

                {/* Simulated Instagram Chat Header */}
                <div className="bg-white border-b border-slate-200/60 px-4 pt-8 pb-3 flex items-center justify-between shrink-0 select-none z-20 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full instagram-bg p-[1.5px] flex items-center justify-center shrink-0 shadow-xs">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="text-left">
                      <h4 className="font-display font-bold text-xs text-slate-800 flex items-center gap-1">
                        Artisan Salon 🌟
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans">Active now</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[9px] font-sans px-2 py-0.5 bg-primary/10 rounded-full text-primary font-bold">AI Active</span>
                  </div>
                </div>

                {/* Scrollable Message List (No Overlapping!) */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 flex flex-col scroll-smooth" 
                  id="anim-dm-chat-scroll"
                >
                  <AnimatePresence>
                    {chatMessages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35 }}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'user' ? 'self-start' : 'self-end items-end'
                        }`}
                      >
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs font-sans shadow-xs ${
                            msg.sender === 'user'
                              ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/60'
                              : 'instagram-bg text-white rounded-tr-sm shadow-md'
                          }`}
                        >
                          <p className="leading-relaxed text-left">{msg.text}</p>
                        </div>
                        
                        {/* Action buttons inside the message flow */}
                        {msg.actions && (
                          <div className="flex flex-wrap gap-1.5 mt-2 justify-end w-full">
                            {msg.actions.map((act, idx) => (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold border transition-all shadow-xs ${
                                  idx === 0
                                    ? 'bg-primary text-white border-primary hover:bg-primary-container'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {act}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Timestamp Label */}
                        <span className="text-[8px] text-slate-400 font-sans mt-1 px-1">
                          {msg.sender === 'user' ? 'Received' : '⚡ Auto-Replied Instantly'}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Anchor to scroll bottom */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mock Message Input Bottom Bar */}
                <div className="border-t border-slate-200/60 bg-white px-3 py-2.5 shrink-0 select-none">
                  <div className="border border-slate-200 rounded-full py-2 px-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50">
                    <span className="font-sans">Message...</span>
                    <div className="flex gap-2.5 text-slate-300">
                      <span>📷</span>
                      <span>❤️</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 bg-white border-b border-slate-100 overflow-hidden" id="social-proof-bar">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="font-display font-semibold text-slate-400 text-xs tracking-widest uppercase">
              AUTOMATING GROWTH FOR OVER 2,000+ INSTAGRAM LEADERS
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            {niches.map((n) => (
              <div key={n.id} className="flex items-center gap-2 group cursor-pointer">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Check className="w-3.5 h-3.5 font-bold" />
                </div>
                <span className="font-sans font-bold text-sm text-slate-600 group-hover:text-primary transition-colors">{n.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW Before vs. After Section (Hook 2) */}
      <section className="py-20 bg-slate-50 px-4 border-b border-slate-100" id="before-after-landing">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-sans font-bold text-xs uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5" /> Stop the Bleeding
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-on-surface leading-tight">
              Manual Hustle vs. Autonomous Growth
            </h2>
            <p className="font-sans text-on-surface-variant text-base md:text-lg">
              Are you still spending hours copy-pasting the same business answers in DMs? See why top local brands transitioned to Assistly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Before Card */}
            <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm relative overflow-hidden text-left flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-red-500 text-white font-sans font-bold text-[10px] uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
                Without Assistly
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-800">The Hard Manual Way</h3>
                    <p className="text-xs text-slate-400 font-sans">Slow replies, frustrated customers</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                    <p className="font-sans text-sm text-slate-500 leading-relaxed">
                      <strong>Slow Turnaround:</strong> Potential buyers message you at 11 PM and wait until 9 AM for a response. They have already booked with someone else.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                    <p className="font-sans text-sm text-slate-500 leading-relaxed">
                      <strong>Repetitive Copy-Paste:</strong> You lose precious daily hours repeating pricing structures, addresses, and lists manually.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                    <p className="font-sans text-sm text-slate-500 leading-relaxed">
                      <strong>Leaky Funnel:</strong> Comments saying "how much?" are left unanswered for days, causing the Instagram algorithm to bury your post reach.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-red-600 font-sans font-bold text-xs bg-red-50/50 p-3 rounded-xl">
                <span>Estimated Customer Dropoff Rate</span>
                <span className="text-sm">Up to 62% Lost</span>
              </div>
            </div>

            {/* The After Card */}
            <div className="bg-white rounded-3xl p-8 border border-primary/20 shadow-xl relative overflow-hidden text-left flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-primary text-white font-sans font-bold text-[10px] uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
                With Assistly DM
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-800">The Autonomous Way</h3>
                    <p className="text-xs text-primary font-sans">Instant answers, immediate sales</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                    <p className="font-sans text-sm text-slate-600 leading-relaxed">
                      <strong>Instantaneous Answers:</strong> Customer gets answers regarding slots, prices, or amenities in 1.5 seconds, even at 3 AM.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                    <p className="font-sans text-sm text-slate-600 leading-relaxed">
                      <strong>Interactive Call-to-Actions:</strong> Seamlessly inject custom buttons in chat for checkout pages or digital booking tools.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                    <p className="font-sans text-sm text-slate-600 leading-relaxed">
                      <strong>Automatic Leads Harvesting:</strong> Phone numbers, emails, and slots are systematically gathered into a central CRM in real-time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-sans font-bold text-xs bg-emerald-50 p-3 rounded-xl">
                <span>Average Response Duration</span>
                <span className="text-sm">Under 1.8 seconds ⚡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW Interactive Niche Showcase with Photorealistic Images */}
      <section className="py-20 bg-white px-4 border-b border-slate-100" id="niche-showcase-landing">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-secondary/10 px-3 py-1 rounded-full text-secondary font-sans font-bold text-xs uppercase tracking-wide">
              <span>Interactive Simulator</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-on-surface leading-tight">
              Tailored for Your Business
            </h2>
            <p className="font-sans text-on-surface-variant text-base">
              See how AssistlyDM speaks your language. Select your niche below to watch actual follower questions transform into instant actions.
            </p>
          </div>

          {/* Switcher Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
            {nicheDetails.map((item) => {
              const isActive = activeNicheId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNicheId(item.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full font-sans font-bold text-xs md:text-sm tracking-wide transition-all shadow-sm cursor-pointer border ${
                    isActive
                      ? 'bg-primary text-white border-primary scale-[1.03] shadow-md shadow-primary/15'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Industry Showcase Card */}
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {nicheDetails.map((item) => {
                if (item.id !== activeNicheId) return null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50/50 p-6 md:p-10 rounded-3xl border border-slate-200/60 shadow-xl text-left overflow-hidden min-h-[420px]"
                  >
                    {/* Column 1: Image Showcase (Lg: 5/12 cols) */}
                    <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl shadow-lg h-72 md:h-80 w-full shrink-0">
                      <img
                        src={item.image}
                        alt={item.alt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Gradient Backdrop on image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-5 flex flex-col justify-end">
                        <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#fd1d1d] bg-white px-2 py-0.5 rounded-md self-start mb-2 shadow-xs">
                          {item.name}
                        </span>
                        <h4 className="text-white font-display font-extrabold text-lg leading-snug">
                          {item.tagline}
                        </h4>
                      </div>
                    </div>

                    {/* Column 2: Dialogue Showcase (Lg: 7/12 cols) */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-display font-extrabold text-xl md:text-2xl text-slate-800">
                          How it handles your customers
                        </h3>
                        <p className="font-sans text-sm text-slate-500 max-w-lg leading-relaxed">
                          Followers frequently ask about prices, locations, or availability. Rather than making them wait hours, AssistlyDM feeds them the verified info instantly.
                        </p>
                      </div>

                      {/* Mock Dialogue Stream Card */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-md flex flex-col space-y-4">
                        
                        {/* Stream Header */}
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span className="text-[10px] font-display font-extrabold text-slate-400 uppercase tracking-widest">
                            Live Conversation Example
                          </span>
                        </div>

                        {/* Customer message (left-aligned) */}
                        <div className="flex flex-col items-start self-start max-w-[85%]">
                          <span className="text-[9px] font-sans font-bold text-slate-400 mb-1">
                            Follower Inquiry
                          </span>
                          <div className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-sm text-xs md:text-sm font-sans text-left leading-relaxed">
                            "{item.question}"
                          </div>
                        </div>

                        {/* AI response (right-aligned) */}
                        <div className="flex flex-col items-end self-end max-w-[85%]">
                          <span className="text-[9px] font-sans font-bold text-primary mb-1 flex items-center gap-1 justify-end">
                            <Bot className="w-3 h-3 text-primary" /> Instant AI Response
                          </span>
                          <div className="instagram-bg text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs md:text-sm font-sans text-left leading-relaxed shadow-sm">
                            "{item.reply}"
                          </div>
                        </div>

                      </div>

                      {/* Call-to-action details */}
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                          onClick={onGetStarted}
                          className="px-6 py-3 bg-primary text-white rounded-xl font-sans font-bold text-xs md:text-sm hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span>Automate my {item.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-xs text-slate-400 font-sans">
                          Takes less than 10 minutes to train and launch.
                        </p>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* NEW ROI Calculator Section (High Conversion Hook 3) */}
      <section className="py-20 bg-slate-50 px-4 border-b border-slate-100" id="roi-calculator">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-12 space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-sans font-bold text-xs uppercase tracking-wide">
              <DollarSign className="w-3.5 h-3.5" /> ROI Calculator
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-on-surface leading-tight">
              Calculate Your Untapped Revenue
            </h2>
            <p className="font-sans text-on-surface-variant text-base">
              Slide the metrics below to estimate how many missed sales could be recovered by turning slow responses into 1.5-second automated checkouts.
            </p>
          </div>

          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/60 shadow-xl p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Sliders Area (Lg: 7 cols) */}
            <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6 border-r-0 lg:border-r border-slate-100">
              
              {/* Slider 1: Estimated DMs */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-sans font-bold text-slate-700 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Est. Monthly Inquiries / DMs
                  </label>
                  <span className="text-primary font-sans font-extrabold bg-primary/10 px-3 py-1 rounded-lg text-sm">
                    {estMonthlyDMs.toLocaleString()} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={estMonthlyDMs}
                  onChange={(e) => setEstMonthlyDMs(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-[11px] text-slate-400 font-sans">
                  Total average comments + direct questions received across Instagram per month.
                </p>
              </div>

              {/* Slider 2: Average Order Value */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-sans font-bold text-slate-700 text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" /> Average Ticket / Booking Price
                  </label>
                  <span className="text-primary font-sans font-extrabold bg-primary/10 px-3 py-1 rounded-lg text-sm">
                    ${avgTicketPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="5"
                  value={avgTicketPrice}
                  onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-[11px] text-slate-400 font-sans">
                  Your average service rate, product sale ticket, booking fee, or program fee.
                </p>
              </div>

              {/* Slider 3: Current Fast Reply Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-sans font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Current "Fast Reply" Rate (%)
                  </label>
                  <span className="text-rose-500 font-sans font-extrabold bg-rose-100 px-3 py-1 rounded-lg text-sm">
                    {currentResponseRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  step="5"
                  value={currentResponseRate}
                  onChange={(e) => setCurrentResponseRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-[11px] text-slate-400 font-sans">
                  The percent of messages you successfully answer in under 5 minutes manually (including weekends/nights).
                </p>
              </div>

            </div>

            {/* Calculations Result Dashboard (Lg: 5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/25 rounded-full blur-2xl"></div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-400 uppercase tracking-wider mb-2">
                    Potential Savings Calculator
                  </h3>
                  <div className="border-b border-white/10 pb-4">
                    <p className="text-xs text-slate-400 font-sans">Monthly Missed DMs (Night/Busy hours)</p>
                    <p className="font-sans font-extrabold text-xl text-rose-400">
                      {missedDMs} Leads Dropped
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 font-sans block">Estimated New Sales Saved / mo</span>
                    <span className="font-sans font-extrabold text-2xl text-emerald-400 flex items-center gap-1.5">
                      +{recoveredSalesCount} Checkouts Saved
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 font-sans block">New Monthly Revenue Gained</span>
                    <span className="font-display font-black text-3xl text-white">
                      ${recoveredMonthlyValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-xs text-slate-400 font-sans">
                  <span>Additional Annual Yield</span>
                  <span className="font-bold text-white">+${recoveredAnnualValue.toLocaleString()}/yr</span>
                </div>
                <button
                  onClick={onGetStarted}
                  className="w-full py-3.5 bg-primary hover:bg-primary-container text-white rounded-xl font-sans font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                >
                  <span>Reclaim My Sales Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white px-4 border-b border-slate-100" id="how-it-works-landing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-on-surface mb-4">
              How It Works
            </h2>
            <p className="font-sans text-on-surface-variant text-base">
              From setup to full hands-off automation in under 10 minutes. No complex coding, developer tokens, or platforms required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, index) => (
              <div 
                key={index} 
                className="p-8 rounded-2xl bg-white shadow-sm border border-outline-variant/30 hover:shadow-lg transition-all duration-300 group text-left flex flex-col justify-between min-h-[250px]"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-all duration-300 ${s.hoverClass} group-hover:text-white shadow-inner`}>
                    {s.icon}
                  </div>
                  <div className="font-sans font-bold text-xs text-primary tracking-widest uppercase mb-2">
                    {s.step}
                  </div>
                  <h3 className="font-display font-bold text-xl text-on-surface mb-3">
                    {s.title}
                  </h3>
                  <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion Banner Call To Action */}
      <section className="py-8 px-4" id="cta-banner-landing">
        <div className="max-w-7xl mx-auto">
          <div className="instagram-bg rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">
                Ready to reclaim your valuable time?
              </h2>
              <p className="font-sans text-base md:text-lg opacity-90 leading-relaxed">
                Join over 2,000+ creators, villas, realtors and small businesses automating their sales funnels on Instagram. Try it risk-free today.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={onGetStarted}
                  className="bg-white text-on-surface font-sans font-bold text-sm px-8 py-4 rounded-xl hover:bg-surface-bright hover:shadow-2xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
                >
                  Create Free Account
                </button>
                <span className="text-xs text-white/85 font-sans">
                  No credit card required. Cancel anytime.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

