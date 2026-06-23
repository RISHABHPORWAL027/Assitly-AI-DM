import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  X, 
  Edit, 
  Check, 
  Smile, 
  Image, 
  Heart, 
  Zap, 
  Sparkles,
  Lock,
  Smartphone,
  Eye,
  Settings,
  Bot
} from 'lucide-react';
import { AutomationSettings, BusinessProfile } from '../types';

interface AutomationBuilderViewProps {
  automation: AutomationSettings;
  businessProfile: BusinessProfile;
  onUpdateAutomation: (updated: AutomationSettings) => void;
  onSave: () => void;
  onBack: () => void;
}

export default function AutomationBuilderView({
  automation,
  businessProfile,
  onUpdateAutomation,
  onSave,
  onBack
}: AutomationBuilderViewProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [messageDraft, setMessageDraft] = useState(automation.messageText);
  const [chatInputs, setChatInputs] = useState('');
  const [chatLogs, setChatLogs] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'user', text: 'Hey there!', time: '11:42 AM' },
    { sender: 'bot', text: messageDraft.replace('{company_name}', businessProfile.name), time: '11:42 AM' }
  ]);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const cleanWord = newKeyword.trim().toLowerCase();
    if (!automation.triggerKeywords.includes(cleanWord)) {
      onUpdateAutomation({
        ...automation,
        triggerKeywords: [...automation.triggerKeywords, cleanWord]
      });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (word: string) => {
    onUpdateAutomation({
      ...automation,
      triggerKeywords: automation.triggerKeywords.filter(k => k !== word)
    });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessageDraft(text);
    onUpdateAutomation({
      ...automation,
      messageText: text
    });
  };

  const handleToggleLive = () => {
    onUpdateAutomation({
      ...automation,
      isLive: !automation.isLive
    });
  };

  // Simulating user chatting inside the preview phone
  const handleSendMockMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputs.trim()) return;

    const userText = chatInputs.trim();
    const cleanUserText = userText.toLowerCase();
    
    // Add User Message to logs
    const newLogs = [...chatLogs, { sender: 'user' as const, text: userText, time: 'Just now' }];
    setChatLogs(newLogs);
    setChatInputs('');

    // Check Trigger Matches
    const isKeywordMatched = automation.triggerKeywords.some(keyword => 
      cleanUserText.includes(keyword)
    );

    setTimeout(() => {
      if (isKeywordMatched) {
        setChatLogs(prev => [
          ...prev,
          { 
            sender: 'bot' as const, 
            text: messageDraft.replace('{company_name}', businessProfile.name), 
            time: 'Just now' 
          }
        ]);
      } else {
        // AI model health simulation / fallback response using business Profile info
        setChatLogs(prev => [
          ...prev,
          { 
            sender: 'bot' as const, 
            text: `Hi there! I am AssistlyDM bot for ${businessProfile.name || "Gourmet Delights Cafe"}. For queries outside our automated keywords, our team will get back to you soon! ☕`, 
            time: 'Just now' 
          }
        ]);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col flex-1" id="automation-builder-container">
      {/* Visual Subtitle Canvas Layout */}
      <div className="flex-1 p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column Panel: Automation Configuration Flow */}
        <div className="lg:col-span-2 space-y-6 text-left max-w-[800px] mx-auto w-full">
          {/* Welcome Dashboard Description */}
          <div className="space-y-1 mb-6 text-left">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-on-surface">
              Set up your first automation
            </h2>
            <p className="font-sans text-sm text-on-surface-variant max-w-lg">
              We've setup a default greeting based on your business profile. Fill in trigger keywords and custom responses to match your store's style.
            </p>
          </div>

          {/* Trigger Node card represent Screen 3 */}
          <section className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5 fill-amber-600 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-sans text-[11px] text-outline uppercase tracking-wider font-bold">Select a Trigger</p>
                  <h3 className="font-display font-bold text-base text-on-surface">When to run automation</h3>
                </div>
              </div>
              <button className="text-outline hover:text-on-surface cursor-pointer">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-left">
              {/* Connected Platform display */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full instagram-bg flex items-center justify-center text-white font-sans font-black text-xs">
                    ig
                  </span>
                  <span className="font-sans font-bold text-sm text-on-surface">Instagram Direct Message (DM)</span>
                </div>
                <button className="text-outline hover:text-error transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Keyword Configuration Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-sans font-bold text-sm text-on-surface">
                    What keywords in DMs will trigger this auto-reply?
                  </label>
                  <span className="text-xs text-primary font-sans flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Trigger-Match Mode
                  </span>
                </div>

                {/* Tags Layout List */}
                <div className="flex flex-wrap gap-2 p-3 bg-surface-container-lowest border border-outline-variant border-dashed rounded-xl min-h-[64px] items-center">
                  <AnimatePresence>
                    {automation.triggerKeywords.map((word) => (
                      <motion.span
                        key={word}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5"
                      >
                        {word}
                        <button 
                          onClick={() => handleRemoveKeyword(word)}
                          className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer text-primary"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>

                  <form onSubmit={handleAddKeyword} className="flex-1 min-w-[120px]">
                    <input 
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add trigger word... (press Enter)"
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-sans p-1 placeholder:text-outline/40"
                    />
                  </form>
                </div>
                <p className="text-[11px] text-outline font-sans">
                  Tip: Multiple single-words are supported. If followers send a DM containing any of these keywords, the automation responds instantly.
                </p>
              </div>
            </div>
          </section>

          {/* Response Flow Section Node */}
          <section className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-on-surface">Response Actions</h3>
              <span className="text-xs font-sans text-outline font-medium">1 Automation Node</span>
            </div>

            <div className="relative pl-6">
              {/* Visual Vertical Node Connector line */}
              <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-outline-variant/30 -z-10"></div>

              {/* Step Card */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm relative">
                <div className="p-4 border-b border-outline-variant/30 bg-surface-alt flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-on-surface text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="font-sans font-bold text-xs text-outline uppercase tracking-wider">Response Node</span>
                      <span className="font-display font-bold text-sm text-on-surface">Text Message Response</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-left">
                  <div className="relative">
                    <textarea 
                      value={messageDraft}
                      onChange={handleMessageChange}
                      rows={4}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 font-sans text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none placeholder:text-outline/40"
                      placeholder="Type your automated response here..."
                    />
                    <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
                      <span className="text-[11px] text-outline font-sans">
                        {messageDraft.length}/1000 chars
                      </span>
                    </div>
                  </div>

                  {/* Add action button suggestion */}
                  <button className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/60 text-outline hover:text-primary hover:border-primary hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 font-sans font-semibold text-xs cursor-pointer">
                    <Plus className="w-4 h-4" /> Add Interactive Reply Button (e.g. Menu, Booking)
                  </button>
                </div>
              </div>

              {/* Big response action trigger */}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={onSave}
                  className="w-full py-4 bg-primary text-white font-sans font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Automation Configuration
                </button>
              </div>
            </div>
          </section>

          {/* Follow-up Pro panel represent Screen 3 */}
          <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-bold text-sm text-on-surface">Auto Follow-up Sequence</h4>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] font-bold rounded uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Send a nudge message after DM completes (delay: 1 minute up to 24 hours)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                <input type="checkbox" disabled className="sr-only peer" />
                <div className="w-11 h-6 bg-outline-variant rounded-full peer"></div>
              </label>
            </div>
            <p className="text-[11px] text-orange-600 font-semibold font-sans">
              * Available only for Unlimited Growth plan subscribers.
            </p>
          </section>
        </div>

        {/* Right Column: Live Chat Simulated Mobile Screen */}
        <aside className="sticky top-6 h-fit" id="live-chat-simulation-sidebar">
          <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-lg shadow-on-surface/5">
            <div className="p-4 border-b border-outline-variant/30 bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-primary" />
                <h3 className="font-sans font-bold text-sm text-on-surface">Interactive Simulator</h3>
              </div>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-error" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-success-whatsapp" />
              </div>
            </div>

            <div className="p-4 bg-surface-container-low">
              {/* Instagram Phone frame mockup */}
              <div className="border border-outline-variant/40 rounded-[2.2rem] overflow-hidden shadow-lg bg-white max-w-[320px] mx-auto">
                
                {/* Simulated App Header */}
                <div className="p-4 border-b border-outline-variant/30 flex items-center gap-2 bg-white">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success-whatsapp border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold leading-none text-on-surface">{businessProfile.name || "Gourmet Delights Cafe"}</p>
                    <p className="text-[10px] text-outline mt-0.5 font-sans">Active Sandbox Client</p>
                  </div>
                  <span className="w-2.5 h-2.5 bg-success-whatsapp rounded-full animate-bounce"></span>
                </div>

                {/* Simulated Conversation Feed */}
                <div className="p-4 space-y-4 min-h-[380px] bg-surface-alt flex flex-col justify-end overflow-y-auto max-h-[380px] custom-scrollbar">
                  <div className="text-[10px] text-outline text-center font-sans tracking-wide py-2">
                    REACTIVE PREVIEW INBOX
                  </div>
                  
                  {chatLogs.map((log, index) => (
                    <div 
                      key={index}
                      className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`px-3 py-2 rounded-2xl text-[12px] max-w-[80%] text-left font-sans ${
                        log.sender === 'user' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'instagram-bg text-white rounded-tl-none font-medium'
                      }`}>
                        {log.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated Keypad Send message bar */}
                <form onSubmit={handleSendMockMessage} className="p-3 bg-white border-t border-outline-variant/30 flex items-center gap-2">
                  <input 
                    type="text"
                    value={chatInputs}
                    onChange={(e) => setChatInputs(e.target.value)}
                    placeholder="Type message relative to trigger words..."
                    className="flex-1 bg-surface-container-low rounded-full px-4 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border-none"
                  />
                  <button 
                    type="submit" 
                    className="w-8 h-8 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </form>
              </div>
              <p className="text-center text-[10px] text-outline mt-4 font-sans px-4">
                Tip: Click trigger chips to copy words, type them in input above, and watch the auto-reply execute.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
