import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Instagram, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle,
  ArrowLeft,
  Bolt,
  Bot,
  Shield,
  Loader2,
  Lock
} from 'lucide-react';

interface OnboardingStep1Props {
  initialConnected: boolean;
  onConnectedStatusChange: (connected: boolean) => void;
  onNextStep: () => void;
  onBackToDashboard: () => void;
}

export default function OnboardingStep1({ 
  initialConnected, 
  onConnectedStatusChange, 
  onNextStep, 
  onBackToDashboard 
}: OnboardingStep1Props) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(initialConnected);

  const handleConnect = () => {
    if (connected) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      onConnectedStatusChange(true);
    }, 2000);
  };

  const syncStats = [
    {
      title: 'Instant Sync',
      description: 'Connect once and your direct messages, stories, and comments sync in real-time across the dashboard.',
      icon: <Bolt className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10'
    },
    {
      title: 'AI Auto-Reply',
      description: 'Set up intelligent flows that handle 80% of common customer queries without you lifting a finger.',
      icon: <Bot className="w-6 h-6 text-secondary" />,
      bg: 'bg-secondary/10'
    },
    {
      title: 'Enterprise Grade',
      description: 'Your data is encrypted and managed according to the highest industry standards for privacy and safety.',
      icon: <Shield className="w-6 h-6 text-tertiary-container text-white" />,
      bg: 'bg-primary-container'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Onboarding progress bar */}
      <div className="mb-8 flex flex-col gap-2 max-w-[640px] mx-auto text-left" id="onboarding-progress-indicator">
        <div className="flex justify-between items-end">
          <span className="font-display text-primary font-extrabold text-sm uppercase tracking-wider">Onboarding Wizard</span>
          <span className="text-sm font-sans text-on-surface-variant font-medium">Step 1 of 4</span>
        </div>
        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: '25%' }}
          ></div>
        </div>
      </div>

      {/* Main Connection Card Container */}
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center flex flex-col items-center border border-outline-variant/30 hover:shadow-2xl transition-all max-w-[640px] mx-auto">
        {/* Visual Instagram Connection Nodes */}
        <div className="flex items-center gap-4 justify-center mb-8" id="inst-visual-nodes">
          <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center shadow-inner relative">
            <Instagram className="w-9 h-9 text-on-surface-variant" />
            {connected && (
              <span className="absolute -bottom-1 -right-1 bg-success-whatsapp text-white rounded-full p-0.5">
                <CheckCircle className="w-4 h-4 fill-success-whatsapp text-white" />
              </span>
            )}
          </div>
          <div className="flex items-center justify-center">
            <span className={`w-12 h-0.5 transition-all duration-500 ${connected ? 'bg-success-whatsapp' : 'bg-outline-variant/50 border-dashed border-t'}`}></span>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md relative ${connected ? 'bg-success-whatsapp text-white' : 'bg-surface-container-low text-primary'}`}>
            <Bot className="w-9 h-9" />
          </div>
        </div>

        <h1 className="font-display font-extrabold text-2xl md:text-3xl mb-3 text-on-surface">
          Connect Instagram
        </h1>
        <p className="font-sans text-base text-on-surface-variant mb-6 max-w-md">
          To start automating your customer interactions, we need to securely link your Instagram Professional account.
        </p>

        {/* Dynamic Status Indicator */}
        <div className="w-full bg-surface-container-low rounded-xl p-4 mb-8 flex items-center justify-between border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {connected ? (
                <>
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-success-whatsapp opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success-whatsapp"></span>
                </>
              ) : (
                <>
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-error opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </>
              )}
            </div>
            <span className="font-sans font-semibold text-sm text-on-surface">Instagram Link Status</span>
          </div>
          <div className="text-right">
            {connected ? (
              <span className="bg-success-whatsapp text-white px-3 py-1 rounded-full font-sans font-bold text-xs uppercase">
                Connected
              </span>
            ) : (
              <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-sans font-bold text-xs uppercase">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Action Button cluster */}
        <div className="flex flex-col gap-4 w-full">
          {/* Primary connect button */}
          <button
            onClick={handleConnect}
            disabled={connecting || connected}
            className={`w-full py-4 px-6 rounded-xl font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              connected 
                ? 'bg-success-whatsapp text-white shadow-success-whatsapp/10' 
                : 'instagram-bg text-white hover:opacity-95 active:scale-[0.98]'
            }`}
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting Securely...
              </>
            ) : connected ? (
              <>
                <CheckCircle className="w-5 h-5 text-white" />
                Successfully Connected!
              </>
            ) : (
              <>
                <Instagram className="w-5 h-5 text-white" />
                Connect Instagram
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Secondary continue button */}
          <button
            onClick={onNextStep}
            disabled={!connected}
            className={`w-full py-4 px-6 rounded-xl font-sans font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center ${
              connected 
                ? 'bg-primary text-white hover:bg-primary-container shadow-primary/20 active:scale-95 cursor-pointer' 
                : 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-50'
            }`}
          >
            Continue to Step 2
          </button>
        </div>

        {/* Lock indicator */}
        <div className="mt-8 flex items-center gap-1.5 text-on-surface-variant/70">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-sans">Secure handshakes via official Meta Graph API</span>
        </div>
      </div>

      {/* Helpful Nav Links */}
      <div className="mt-6 flex justify-between items-center max-w-[645px] mx-auto px-2">
        <button 
          onClick={onBackToDashboard}
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-sans font-semibold text-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
        <button 
          onClick={onNextStep}
          className="text-on-surface-variant hover:text-primary transition-colors font-sans text-xs underline cursor-pointer"
        >
          Skip for now
        </button>
      </div>

      {/* Bottom informational modules */}
      <section className="max-w-4xl mx-auto mt-16 pt-8 border-t border-outline-variant/30" id="onboarding-features-pane">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {syncStats.map((stat, i) => (
            <div 
              key={i} 
              className="bg-white p-6 rounded-2xl border border-outline-variant/30 hover:border-primary/20 transition-all text-left group"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4 text-primary`}>
                {stat.icon}
              </div>
              <h3 className="font-display font-bold text-base text-on-surface mb-2 tracking-tight">
                {stat.title}
              </h3>
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
