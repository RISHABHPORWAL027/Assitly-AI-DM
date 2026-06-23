import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Lock, 
  HelpCircle,
  X,
  CreditCard,
  Building
} from 'lucide-react';

interface PricingViewProps {
  currentPlan: 'Free' | 'Starter' | 'Growth';
  onUpgradePlan: (plan: 'Starter' | 'Growth') => void;
}

export default function PricingView({ currentPlan, onUpgradePlan }: PricingViewProps) {
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<'Starter' | 'Growth' | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Starter Plan',
      price: isYearly ? 24 : 29,
      description: 'Ideal for local creators, villas, and small boutique shops getting started with automation.',
      slug: 'Starter' as const,
      features: [
        '1 Linked Instagram Professional Account',
        'Up to 500 automated replies / month',
        'Standard trigger keyword tags',
        'Business Profile FAQ library (Up to 10 FAQs)',
        'Standard Email support (24hr response)',
        'Basic local Leads CRM list'
      ],
      ctaText: 'Activate Starter License',
      popular: false,
      badgeColor: 'bg-outline-variant/30 text-on-surface-variant'
    },
    {
      name: 'Unlimited Growth Plan',
      price: isYearly ? 65 : 79,
      description: 'The master workflow suite for expanding brands and busy businesses requiring infinite scale.',
      slug: 'Growth' as const,
      features: [
        '3 Linked Instagram Professional Accounts',
        'Unlimited automated replies / month',
        'AI-driven custom FAQ suggestions',
        'Unlimited trigger keyword configurations',
        'Priority 24/7 chat & video setup assistance',
        'Pro Follow-up sequences (1m to 24hrs Delay)',
        'Unlimited lead CSV report exports',
        'Custom CRM external sync integrations'
      ],
      ctaText: 'Get Unlimited Growth Access',
      popular: true,
      badgeColor: 'instagram-bg text-white'
    }
  ];

  const handleTriggerCheckout = (planSlug: 'Starter' | 'Growth') => {
    setSelectedPlanForUpgrade(planSlug);
  };

  const handleConfirmCheckout = () => {
    if (selectedPlanForUpgrade) {
      onUpgradePlan(selectedPlanForUpgrade);
      setSelectedPlanForUpgrade(null);
      alert(`Fantastic choice! You have successfully upgraded to the ${selectedPlanForUpgrade} Plan. Enjoy the automated flow! 🚀`);
    }
  };

  return (
    <div className="space-y-8 text-left pb-16" id="pricing-screen-panel">
      {/* Pricing Header */}
      <header className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-on-surface mb-3">
          Simple, Transparent Plans
        </h2>
        <p className="font-sans text-sm text-on-surface-variant">
          No hidden implementation fees or setup overheads. Choose the speed that matches your business growth. Cancel anytime.
        </p>

        {/* Toggle Billing Period Option */}
        <div className="mt-6 inline-flex items-center gap-2.5 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/30">
          <button 
            onClick={() => setIsYearly(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-sans font-bold cursor-pointer ${!isYearly ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsYearly(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer ${isYearly ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Yearly Save 20%
          </button>
        </div>
      </header>

      {/* Plans Card comparison Row (Screen 4 Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {plans.map((p, index) => {
          const isCurrent = currentPlan === p.slug;
          return (
            <div 
              key={index}
              className={`bg-white rounded-3xl p-8 md:p-10 flex flex-col justify-between border relative transition-all duration-300 ${
                p.popular 
                  ? 'border-primary ring-2 ring-primary/20 shadow-xl shadow-primary/5 hover:shadow-primary/10' 
                  : 'border-outline-variant/40 shadow-md hover:shadow-lg'
              }`}
              id={`pricing-card-${p.slug.toLowerCase()}`}
            >
              {/* Highlight badge for Recommended/Popular unlimited plan */}
              {p.popular && (
                <span className="absolute -top-3.5 right-6 instagram-bg text-white px-4 py-1 rounded-full font-sans font-extrabold text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-white" /> Recommended / Popular
                </span>
              )}

              <div className="space-y-6">
                <div className="text-left">
                  <span className={`px-2.5 py-1 rounded-md font-sans font-extrabold text-[10px] uppercase tracking-wider ${p.badgeColor}`}>
                    {p.name}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <span className="font-display font-black text-4xl text-on-surface">${p.price}</span>
                    <span className="font-sans text-xs text-on-surface-variant">/ month</span>
                  </div>
                  <p className="font-sans text-xs text-on-surface-variant mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Horizontal divider */}
                <div className="h-[1px] bg-gradient-to-r from-outline-variant/10 via-outline-variant/40 to-outline-variant/10" />

                {/* Features Checklist */}
                <ul className="space-y-3.5 text-left">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${p.popular ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                        <Check className="w-3.5 h-3.5 font-black" />
                      </div>
                      <span className="font-sans text-xs text-on-surface-variant leading-tight">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Purchase Button */}
              <div className="mt-8 pt-4">
                <button
                  onClick={() => handleTriggerCheckout(p.slug)}
                  disabled={isCurrent}
                  className={`w-full py-4 rounded-xl font-sans font-bold text-xs tracking-wider transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-success-whatsapp/15 text-success-whatsapp border border-success-whatsapp/30 cursor-default' 
                      : p.popular 
                      ? 'bg-primary text-white hover:bg-primary-container shadow-md shadow-primary/10 active:scale-95' 
                      : 'border border-outline hover:bg-surface-container-low active:scale-95 text-on-surface'
                  }`}
                >
                  {isCurrent ? 'Your Active Plan License' : p.ctaText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise / Customize Quote banner */}
      <section className="bg-surface-alt p-8 rounded-2xl border border-outline-variant/30 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-12 text-left">
        <div className="space-y-1">
          <h4 className="font-canvas font-bold text-sm text-on-surface flex items-center gap-1.5">
            <Building className="w-4 h-4 text-primary" /> Multi-Brand Agency & Franchise Licenses
          </h4>
          <p className="font-sans text-xs text-on-surface-variant max-w-xl">
            Need more than 3 connected channels, customized SLA guarantees, and dedicated webhook integration support? Talk directly to our product architect.
          </p>
        </div>
        <button 
          onClick={() => alert("Please email team@assistlydm.co for dedicated developer agency quotes!")}
          className="bg-on-surface text-white hover:bg-on-surface-variant hover:shadow px-5 py-3 rounded-xl font-sans font-bold text-xs shrink-0 cursor-pointer"
        >
          Contact Support Architect
        </button>
      </section>

      {/* Simulated Checkout Drawer / Modal */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-2xl p-6 md:p-8 max-w-md w-full relative text-left">
            <button 
              onClick={() => setSelectedPlanForUpgrade(null)}
              className="absolute right-4 top-4 text-outline hover:text-on-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-primary">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-sans text-[10px] text-outline uppercase font-bold leading-none">Sandbox Payment Gateway</p>
                <h3 className="font-display font-bold text-base text-on-surface">Activate {selectedPlanForUpgrade} Plan</h3>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant font-sans leading-relaxed mb-6">
              You are upgrading Chef Sarah's Cafe to the custom subscription model. This sandbox setup allows unlimited mock responses and full leads capture for testing.
            </p>

            {/* Payment simulation stats box */}
            <div className="bg-surface-container-low rounded-xl p-4 space-y-2 mb-6 text-xs font-sans text-on-surface-variant">
              <div className="flex justify-between font-medium">
                <span>Selected Plan:</span>
                <span className="font-bold text-on-surface">{selectedPlanForUpgrade}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Billing Cycle:</span>
                <span>{isYearly ? 'Yearly Access' : 'Monthly Access'}</span>
              </div>
              <div className="h-[1px] bg-outline-variant/30 my-1" />
              <div className="flex justify-between font-bold text-on-surface">
                <span>Grand Total Due:</span>
                <span>${selectedPlanForUpgrade === 'Starter' ? (isYearly ? 24 : 29) : (isYearly ? 65 : 79)} USD</span>
              </div>
            </div>

            {/* Simulated credit card fields */}
            <div className="space-y-3 mb-6">
              <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-[10px] text-outline uppercase">Simulated Credit Card Number</label>
                <input 
                  type="text" 
                  disabled
                  value="4111 •••• •••• 1111 (Sandbox Active)"
                  className="w-full bg-surface-container bg-opacity-50 border border-outline-variant rounded-xl p-3 font-mono text-xs cursor-not-allowed text-on-surface-variant"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedPlanForUpgrade(null)}
                className="px-4 py-2 bg-surface-alt hover:bg-surface-container text-on-surface-variant font-sans font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="px-5 py-2 bg-primary text-white hover:bg-primary-container font-sans font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Approve & Pay Sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
