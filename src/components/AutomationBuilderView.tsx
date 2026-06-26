import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  X, 
  Smartphone,
  Sparkles,
  Zap,
  ArrowLeft,
  ChevronRight,
  Search,
  Instagram,
  Lock,
  Eye,
  Check,
  Film,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Automation, BusinessProfile, InstagramMedia, ResponseBlock, ResponseType, LeadCaptureType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  LEAD_CAPTURE_OPTIONS,
  getDefaultLeadPrompt,
  getDefaultLeadInvalidMessage,
  validateLeadCapture,
} from '../lib/leadCapture';

const SUGGESTED_KEYWORDS: Record<string, string[]> = {
  "Pricing": ["price", "pricing", "cost", "charge", "charges", "rate", "rates", "amount", "fee", "fees", "package", "packages", "quotation", "quote", "budget", "kitna", "kitne ka", "kitne ki", "price kya hai", "cost kya hai", "charge kya hai", "kitna charge hai", "per day charge", "monthly charge", "yearly charge", "fees kitni hai"],
  "Timing": ["time", "timing", "timings", "opening", "closing", "open", "close", "hours", "working hours", "office hours", "kab khulta hai", "kab band hota hai", "timing kya hai", "today open", "today closed"],
  "Location": ["location", "address", "map", "directions", "nearby", "near me", "kaha hai", "kahan ho", "office address", "shop address", "branch", "nearest branch"],
  "Contact": ["contact", "call", "phone", "mobile", "number", "whatsapp", "support number", "customer care", "helpline", "connect", "reach us"],
  "Booking": ["book", "booking", "appointment", "reserve", "reservation", "slot", "schedule", "consultation", "demo booking", "trial booking"],
  "Demo / Trial": ["demo", "free demo", "trial", "free trial", "sample", "test", "walkthrough", "live demo"],
  "Services": ["service", "services", "offer", "offerings", "solutions", "facility", "facilities", "kya kya milta hai", "features"],
  "Product Details": ["product", "products", "details", "specification", "specs", "information", "catalog", "brochure", "list"],
  "Availability": ["available", "availability", "stock", "in stock", "out of stock", "ready stock", "available hai", "mil jayega"],
  "Delivery": ["delivery", "shipping", "dispatch", "courier", "home delivery", "delivery charge", "shipping cost", "delivery time"],
  "Payment": ["payment", "pay", "online payment", "upi", "card", "cash", "emi", "installment", "finance option", "payment mode"],
  "Discount": ["discount", "offer", "coupon", "promo", "deal", "sale", "cashback", "festival offer", "special offer", "best price"],
  "Refund & Cancellation": ["refund", "cancellation", "return", "exchange", "money back", "cancel order", "return policy"],
  "Support": ["help", "support", "assistance", "issue", "problem", "complaint", "customer care", "service request"],
  "Franchise": ["franchise", "dealership", "distributorship", "partner", "business opportunity", "reseller", "agency"],
  "Career / Job": ["job", "jobs", "hiring", "vacancy", "openings", "career", "work with us", "recruitment", "internship"],
  "Course / Training": ["course", "training", "class", "classes", "batch", "batches", "syllabus", "duration", "certification"],
  "Result / Marks (Schools)": ["result", "marks", "score", "report card", "exam result", "progress report"],
  "School Information": ["fees", "admission", "admissions", "holiday", "vacation", "leave", "attendance", "timetable", "bus route"],
  "Real Estate": ["flat", "apartment", "villa", "plot", "property", "possession", "site visit", "brochure", "floor plan"],
  "Gym / Fitness": ["membership", "joining fee", "trainer", "personal trainer", "workout plan", "batch timing"],
  "Salon / Beauty": ["haircut", "facial", "makeup", "grooming", "bridal package", "appointment"],
  "Restaurant": ["menu", "food menu", "order", "dine in", "takeaway", "reservation", "table booking"],
  "Clinic / Hospital": ["doctor", "appointment", "consultation", "clinic timing", "emergency", "specialist"],
  "Coaching Institute": ["admission", "batch timing", "fees structure", "demo class", "course details"],
  "E-commerce": ["buy", "order", "purchase", "cart", "checkout", "tracking", "order status"],
  "Follow-Up Intent": ["interested", "interested yes", "tell me more", "details please", "send details", "dm me", "info", "information", "more details"],
  "Human Support": ["agent", "executive", "representative", "human", "talk to human", "connect agent", "customer executive"]
};

interface AutomationBuilderViewProps {
  automation: Automation;
  businessProfile: BusinessProfile;
  onSave: (updated: Automation) => void;
  onBack: () => void;
  user?: any;
  instagramAccountName?: string;
}

export default function AutomationBuilderView({
  automation,
  businessProfile,
  onSave,
  onBack,
  user,
  instagramAccountName
}: AutomationBuilderViewProps) {
  const { getAuthHeaders } = useAuth();
  
  // Local draft state initialized from props (converting legacy fields if responses are missing)
  const [draft, setDraft] = useState<Automation>(() => {
    const copy = { ...automation };
    if (!copy.responses || copy.responses.length === 0) {
      const initialResponses: ResponseBlock[] = [];
      if (copy.enableFollowGate) {
        initialResponses.push({
          id: 'resp_follow_gate',
          type: 'follow',
          followGateText: copy.notFollowingMessage || "Thanks! I noticed you aren't following yet. Follow us and reply 'done' here to get the link! 📲",
          followGateButtonText: "I followed you! ✅"
        });
      }
      if (copy.replyText) {
        initialResponses.push({
          id: 'resp_initial_reply',
          type: 'text',
          text: copy.replyText
        });
      }
      copy.responses = initialResponses;
    }
    if (!copy.matchType) {
      copy.matchType = 'contains';
    }
    return copy;
  });
  
  // Setup Keywords Modal states
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [modalMatchType, setModalMatchType] = useState<'exact' | 'contains'>('exact');
  const [modalKeywords, setModalKeywords] = useState<string[]>([]);
  const [modalAnyKeyword, setModalAnyKeyword] = useState(false);
  const [modalKeywordInput, setModalKeywordInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsSearch, setSuggestionsSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Find which categories match the search query
  const searchLower = suggestionsSearch.toLowerCase().trim();
  const filteredSuggestions = Object.entries(SUGGESTED_KEYWORDS).reduce((acc, [category, words]) => {
    const categoryMatches = category.toLowerCase().includes(searchLower);
    const matchingWords = words.filter(w => w.toLowerCase().includes(searchLower));
    if (categoryMatches || matchingWords.length > 0) {
      acc[category] = categoryMatches ? words : matchingWords;
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Add Response dropdown state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Media selector states
  const [mediaList, setMediaList] = useState<InstagramMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Comment replies states
  const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false);
  const [modalReplies, setModalReplies] = useState<string[]>([]);

  useEffect(() => {
    if (isRepliesModalOpen) {
      setModalReplies(draft.commentReplies && draft.commentReplies.length > 0 ? [...draft.commentReplies] : ['']);
    }
  }, [isRepliesModalOpen, draft.commentReplies]);

  const testerUsername = user?.displayName 
    ? user.displayName.toLowerCase().replace(/\s+/g, '_') 
    : 'ig_tester';

  const botUsername = instagramAccountName 
    ? instagramAccountName.toLowerCase().replace(/\s+/g, '_') 
    : 'assistly_bot';

  // Simulator States
  const [simActiveTab, setSimActiveTab] = useState<'post' | 'dm'>('post');
  const [simCommentInput, setSimCommentInput] = useState('');
  const [simDmInput, setSimDmInput] = useState('');
  const accountLabel = instagramAccountName || businessProfile.name || 'your business';
  const [simComments, setSimComments] = useState<Array<{ username: string; text: string }>>(() => [
    { username: user?.displayName ? user.displayName.toLowerCase().replace(/\s+/g, '_') : 'sample_user', text: 'Love this! How can I get more info?' },
    { username: 'visitor_01', text: 'Great post 👏' }
  ]);
  const [simDmLoyalFollower, setSimDmLoyalFollower] = useState(false); // simulates follow state
  const [simLeadGateState, setSimLeadGateState] = useState<{
    block: ResponseBlock;
    remainingBlocks: ResponseBlock[];
  } | null>(null);
  const [simDmLogs, setSimDmLogs] = useState<Array<{ sender: 'user' | 'bot'; text?: string; type?: ResponseType | 'system'; block?: ResponseBlock }>>(() => [
    { sender: 'bot', text: `Hi! Welcome to ${accountLabel}. Send a DM matching any rule to trigger! 📬` }
  ]);
  const [simNotification, setSimNotification] = useState<{ title: string; body: string } | null>(null);

  // Sync draft trigger type specific simulator settings
  useEffect(() => {
    setSimActiveTab(draft.triggerType === 'comment' ? 'post' : 'dm');
  }, [draft.triggerType]);

  // Fetch posts/reels for grid selector modal
  useEffect(() => {
    const fetchMedia = async () => {
      setLoadingMedia(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/instagram/media', { headers });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || 'Failed to fetch Instagram media');
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setMediaList(data);
        }
      } catch (err) {
        console.error('Error fetching media:', err);
        toast.error('Error fetching Instagram media');
      } finally {
        setLoadingMedia(false);
      }
    };

    if (isMediaModalOpen) {
      fetchMedia();
    }
  }, [isMediaModalOpen]);

  // Open Keyword Modal and initialize local modal state
  const openKeywordsModal = () => {
    setModalMatchType(draft.matchType || 'contains');
    setModalKeywords(draft.keywords.filter(k => k !== '*'));
    setModalAnyKeyword(draft.keywords.includes('*'));
    setModalKeywordInput('');
    setShowSuggestions(false);
    setSuggestionsSearch('');
    setExpandedCategories({});
    setIsKeywordsModalOpen(true);
  };

  // Add keyword inside modal
  const handleAddModalKeyword = () => {
    const val = modalKeywordInput.trim();
    if (val && !modalKeywords.some(k => k.toLowerCase() === val.toLowerCase())) {
      setModalKeywords(prev => [...prev, val]);
    }
    setModalKeywordInput('');
  };

  // Remove keyword inside modal
  const handleRemoveModalKeyword = (word: string) => {
    setModalKeywords(prev => prev.filter(k => k !== word));
  };

  // Save modal edits back to draft automation
  const handleConfirmKeywords = () => {
    let finalKeywords = [...modalKeywords];
    if (modalAnyKeyword) {
      finalKeywords = ['*'];
    } else if (finalKeywords.length === 0) {
      alert('Please add at least one keyword or turn on "Any keyword".');
      return;
    }
    setDraft(prev => ({
      ...prev,
      matchType: modalMatchType,
      keywords: finalKeywords
    }));
    setIsKeywordsModalOpen(false);
  };

  // Add a new response block
  const addResponseBlock = (type: ResponseType) => {
    const newBlock: ResponseBlock = {
      id: 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
    };
    if (type === 'text') {
      newBlock.text = '';
      newBlock.buttonText = '';
      newBlock.buttonType = 'link';
      newBlock.buttonValue = '';
    } else if (type === 'card') {
      newBlock.cardHeader = '';
      newBlock.cardDescription = '';
      newBlock.cardImage = '';
      newBlock.cardButtonText = '';
      newBlock.cardButtonType = 'link';
      newBlock.cardButtonValue = '';
    } else if (type === 'image') {
      newBlock.imageUrl = '';
    } else if (type === 'follow') {
      newBlock.followGateText = "Wait! I noticed you are not following yet. Please follow our page first, and click below to continue! 📲";
      newBlock.followGateButtonText = "I followed you! ✅";
    } else if (type === 'lead_form') {
      newBlock.leadCaptureType = 'either';
      newBlock.leadPrompt = getDefaultLeadPrompt('either');
      newBlock.leadSuccessMessage = 'Thank you! Our team will reach out to you shortly. ✅';
      newBlock.leadInvalidMessage = getDefaultLeadInvalidMessage('either');
    }

    setDraft(prev => ({
      ...prev,
      responses: [...(prev.responses || []), newBlock]
    }));
  };

  // Remove response block
  const removeResponse = (id: string) => {
    setDraft(prev => ({
      ...prev,
      responses: (prev.responses || []).filter(r => r.id !== id)
    }));
  };

  // Update specific field inside response block
  const updateResponseField = (id: string, field: keyof ResponseBlock, value: any) => {
    setDraft(prev => ({
      ...prev,
      responses: (prev.responses || []).map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  // Move response block up/down
  const moveResponse = (index: number, direction: 'up' | 'down') => {
    const list = draft.responses ? [...draft.responses] : [];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setDraft(prev => ({ ...prev, responses: list }));
  };

  // Save changes and publish
  const handlePublish = () => {
    if (!draft.name.trim()) {
      alert('Please enter a name for this automation.');
      return;
    }
    if (draft.keywords.length === 0) {
      alert('Please configure at least one keyword trigger.');
      return;
    }
    if (!draft.responses || draft.responses.length === 0) {
      alert('Please add at least one response block.');
      return;
    }

    // Validate responses
    for (let i = 0; i < draft.responses.length; i++) {
      const resp = draft.responses[i];
      if (resp.type === 'text' && !resp.text?.trim()) {
        alert(`Response #${i + 1} (Text): Please enter the message text.`);
        return;
      }
      if (resp.type === 'image' && !resp.imageUrl?.trim()) {
        alert(`Response #${i + 1} (Image): Please upload an image or paste a URL.`);
        return;
      }
      if (resp.type === 'card' && (!resp.cardHeader?.trim() || !resp.cardDescription?.trim())) {
        alert(`Response #${i + 1} (Card): Please enter both header title and description.`);
        return;
      }
      if (resp.type === 'follow' && !resp.followGateText?.trim()) {
        alert(`Response #${i + 1} (Follow Gate): Please write the follow gate prompt.`);
        return;
      }
      if (resp.type === 'lead_form' && !resp.leadPrompt?.trim()) {
        alert(`Response #${i + 1} (Lead Form): Please write the question/prompt.`);
        return;
      }
    }

    const finalDraft = { ...draft };
    // Sync flat fields for backward compatibility
    const firstTextBlock = finalDraft.responses.find(r => r.type === 'text');
    finalDraft.replyText = firstTextBlock?.text || finalDraft.responses[0]?.text || '';
    const followBlock = finalDraft.responses.find(r => r.type === 'follow');
    finalDraft.enableFollowGate = !!followBlock;
    finalDraft.notFollowingMessage = followBlock?.followGateText || '';

    onSave({
      ...finalDraft,
      lastModified: new Date().toLocaleDateString('en-GB')
    });
  };

  const updateLeadCaptureType = (id: string, captureType: LeadCaptureType) => {
    setDraft(prev => ({
      ...prev,
      responses: (prev.responses || []).map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          leadCaptureType: captureType,
          leadPrompt: getDefaultLeadPrompt(captureType),
          leadInvalidMessage: getDefaultLeadInvalidMessage(captureType),
        };
      }),
    }));
  };

  const sendSimulatorBlocks = (
    blocks: ResponseBlock[],
    startDelayMs = 600,
    onComplete?: () => void
  ) => {
    if (blocks.length === 0) {
      onComplete?.();
      return;
    }

    let pauseIndex = blocks.findIndex(b => b.type === 'lead_form');
    const endIndex = pauseIndex >= 0 ? pauseIndex : blocks.length - 1;
    const batch = blocks.slice(0, endIndex + 1);
    const remainingAfterPause = pauseIndex >= 0 ? blocks.slice(pauseIndex + 1) : [];

    batch.forEach((block, index) => {
      setTimeout(() => {
        setSimDmLogs(prev => [...prev, { sender: 'bot', block }]);
        if (block.type === 'lead_form') {
          setSimLeadGateState({ block, remainingBlocks: remainingAfterPause });
        } else if (index === batch.length - 1 && remainingAfterPause.length === 0) {
          onComplete?.();
        }
      }, startDelayMs + index * 600);
    });
  };

  // Trigger automation responses sequentially in the simulator
  const triggerAutomationSimulator = (source: 'comment' | 'dm') => {
    const hasFollowGate = draft.responses?.some(r => r.type === 'follow');
    
    if (hasFollowGate && !simDmLoyalFollower) {
      const followBlock = draft.responses?.find(r => r.type === 'follow');
      if (followBlock) {
        if (source === 'comment') {
          setSimNotification({
            title: `Direct Message from ${businessProfile.name || ""}`,
            body: followBlock.followGateText || "Please follow our account first! 📲"
          });
          setSimDmLogs(prev => [
            ...prev,
            { sender: 'user', type: 'system', text: `[Comment on Post: "${simCommentInput}"]` },
            { sender: 'bot', block: followBlock }
          ]);
        } else {
          setSimDmLogs(prev => [
            ...prev,
            { sender: 'bot', block: followBlock }
          ]);
        }
      }
      return;
    }

    const activeBlocks = draft.responses?.filter(r => r.type !== 'follow') || [];
    
    if (activeBlocks.length > 0) {
      if (source === 'comment') {
        const firstBlock = activeBlocks[0];
        const previewText = firstBlock.text || firstBlock.leadPrompt || (firstBlock.type === 'card' ? firstBlock.cardHeader : 'Media Attachment');
        setSimNotification({
          title: `Direct Message from ${businessProfile.name || ""}`,
          body: previewText || ''
        });

        setSimDmLogs(prev => [
          ...prev,
          { sender: 'user', type: 'system', text: `[Comment on Post: "${simCommentInput}"]` }
        ]);
      }

      sendSimulatorBlocks(activeBlocks, 600);
    } else {
      const text = draft.replyText || "Reply sent!";
      if (source === 'comment') {
        setSimNotification({
          title: `Direct Message from ${businessProfile.name || ""}`,
          body: text
        });
      }
      setSimDmLogs(prev => [...prev, { sender: 'bot', text }]);
    }
  };

  const triggerRemainingBlocksSimulator = () => {
    const activeBlocks = draft.responses?.filter(r => r.type !== 'follow') || [];
    sendSimulatorBlocks(activeBlocks, 600);
  };

  const continueAfterLeadCapture = (remainingBlocks: ResponseBlock[]) => {
    if (remainingBlocks.length === 0) return;
    sendSimulatorBlocks(remainingBlocks, 600);
  };

  const processSimulatedMessage = (userText: string) => {
    const cleanUserText = userText.toLowerCase().trim();
    
    setTimeout(() => {
      if (cleanUserText === 'done') {
        if (simDmLoyalFollower) {
          setSimDmLogs(prev => [
            ...prev,
            { sender: 'bot', type: 'system', text: `[Simulator State: Follow Status Verified]` }
          ]);
          setTimeout(() => {
            triggerRemainingBlocksSimulator();
          }, 600);
        } else {
          setSimDmLogs(prev => [
            ...prev,
            { sender: 'bot', text: `I checked but you're not following yet! 🛑 Please follow our page and reply 'done' to verify.` }
          ]);
        }
        return;
      }

      if (simLeadGateState) {
        const captureType = simLeadGateState.block.leadCaptureType || 'either';
        const validation = validateLeadCapture(userText, captureType);

        if (!validation.valid) {
          const matchesKeywords = draft.keywords.includes('*') || draft.keywords.some(k => {
            const cleanKey = k.toLowerCase().trim();
            if (draft.matchType === 'exact') return cleanUserText === cleanKey;
            return cleanUserText.includes(cleanKey);
          });
          if (matchesKeywords && draft.triggerType === 'dm') {
            setSimLeadGateState(null);
            triggerAutomationSimulator('dm');
            return;
          }
          const invalidMsg = simLeadGateState.block.leadInvalidMessage || getDefaultLeadInvalidMessage(captureType);
          setSimDmLogs(prev => [...prev, { sender: 'bot', text: invalidMsg }]);
          return;
        }

        const successMsg = simLeadGateState.block.leadSuccessMessage || 'Thank you! Our team will reach out to you shortly. ✅';
        const remaining = simLeadGateState.remainingBlocks;
        setSimLeadGateState(null);
        setSimDmLogs(prev => [...prev, { sender: 'bot', text: successMsg }]);
        continueAfterLeadCapture(remaining);
        return;
      }

      // Check keyword triggers
      const matchesKeywords = draft.keywords.includes('*') || draft.keywords.some(k => {
        const cleanKey = k.toLowerCase().trim();
        if (draft.matchType === 'exact') {
          return cleanUserText === cleanKey;
        } else {
          return cleanUserText.includes(cleanKey);
        }
      });

      if (matchesKeywords) {
        if (draft.triggerType === 'comment') {
          setSimDmLogs(prev => [
            ...prev,
            { sender: 'bot', text: `This automation triggers when you comment on our Post. Let's try commenting there first! 💬` }
          ]);
        } else {
          triggerAutomationSimulator('dm');
        }
      } else {
        const keywordsTip = draft.keywords.length > 0 ? ` Type one of: "${draft.keywords.join(', ')}"` : '';
        setSimDmLogs(prev => [
          ...prev,
          { sender: 'bot', text: `Sorry, I didn't recognize that keyword.${keywordsTip}` }
        ]);
      }
    }, 800);
  };

  const handleSimulatorButtonClick = (btnType?: 'link' | 'trigger', val?: string) => {
    if (!val) return;
    if (btnType === 'link') {
      window.open(val, '_blank');
    } else {
      setSimDmLogs(prev => [...prev, { sender: 'user', text: val }]);
      processSimulatedMessage(val);
    }
  };

  // Mock post comment simulation
  const handlePostMockComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCommentInput.trim()) return;

    setSimComments(prev => [...prev, { username: testerUsername, text: simCommentInput.trim() }]);
    const typedText = simCommentInput.trim().toLowerCase();
    
    // Check keyword triggers
    const matchesKeywords = draft.keywords.includes('*') || draft.keywords.some(k => {
      const cleanKey = k.toLowerCase().trim();
      if (draft.matchType === 'exact') {
        return typedText === cleanKey;
      } else {
        return typedText.includes(cleanKey);
      }
    });

    if (matchesKeywords) {
      setTimeout(() => {
        triggerAutomationSimulator('comment');
      }, 1000);
    }
    
    setSimCommentInput('');
  };

  // Mock DM chat simulation
  const handleSendMockDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simDmInput.trim()) return;

    const userText = simDmInput.trim();
    setSimDmLogs(prev => [...prev, { sender: 'user', text: userText }]);
    setSimDmInput('');
    processSimulatedMessage(userText);
  };

  // Tapping the notification slides down & shifts viewport to DM preview
  const handleTapNotification = () => {
    setSimNotification(null);
    setSimActiveTab('dm');
  };

  return (
  <>
    <Toaster position="top-right" reverseOrder={false} />
    <div className="flex flex-col flex-1" id="automation-builder-wrapper">
      {/* Top Apple Sticky Nav Bar */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/30 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-surface-alt rounded-full transition-colors cursor-pointer text-on-surface-variant"
            title="Back to automations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-left">
            <span className="text-[9px] uppercase font-mono tracking-widest text-outline font-extrabold block">Automation Composer</span>
            <h1 className="text-lg font-display font-black text-on-surface tracking-tight">
              {draft.id ? 'Edit Automation Settings' : 'Create New Automation'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePublish}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-sans text-xs font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
          >
            Save & Publish
          </button>
        </div>
      </header>

      {/* Primary Builder Content Layout */}
      <div className="flex-1 p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-surface-alt">
        
        {/* Left Side settings console: 7 Columns */}
        <div className="lg:col-span-7 space-y-6 text-left max-w-3xl w-full">
          
          {/* Section 1: Core Automation Details */}
          <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-mono font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 fill-primary/10" /> Step 1: Basic Information
            </h2>
            
            <div className="space-y-2">
              <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block">
                Automation Campaign Name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sourdough Freebie Recipe Campaign"
                className="w-full bg-surface-alt border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans font-medium"
              />
              <p className="text-[11px] text-outline font-sans">
                Give your automation an internal name to track its conversion goal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block">
                  Status State
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDraft(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                    className="cursor-pointer"
                  >
                    {draft.status === 'active' ? (
                      <ToggleRight className="w-12 h-7 text-green-600 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-12 h-7 text-on-surface-variant/40 stroke-[1.5]" />
                    )}
                  </button>
                  <span className={`text-xs font-bold font-sans ${draft.status === 'active' ? 'text-green-600' : 'text-on-surface-variant/60'}`}>
                    {draft.status === 'active' ? 'Active & Live' : 'Inactive (Draft)'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block">
                  Trigger Channel
                </label>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {draft.triggerType === 'comment' ? (
                    <span className="px-3 py-1 bg-gradient-to-tr from-amber-500/10 to-rose-500/10 text-rose-600 border border-rose-500/25 rounded-full text-xs font-bold flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5" /> Comments
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-primary" /> Direct DMs
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Trigger Condition Setup */}
          <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 space-y-6 shadow-sm">
            <h2 className="text-sm font-mono font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Step 2: Trigger Source Config
            </h2>

            {/* Comment trigger media selection */}
            {draft.triggerType === 'comment' && (
              <div className="space-y-3">
                <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block">
                  Target Reel or Post
                </label>

                {draft.mediaId ? (
                  <div className="flex items-center justify-between bg-surface-alt p-4 rounded-2xl border border-outline-variant/20 group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {draft.mediaUrl ? (
                        <img 
                          src={draft.mediaUrl} 
                          alt="Instagram post thumbnail" 
                          className="w-12 h-12 object-cover rounded-xl border border-outline-variant/30 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white shrink-0">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 text-left">
                        <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded uppercase">Connected Media</span>
                        <p className="text-xs text-on-surface font-semibold truncate mt-1">
                          {draft.caption || 'Active Reel Item'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMediaModalOpen(true)}
                      className="text-xs font-sans font-bold text-primary hover:underline px-3 py-1 cursor-pointer shrink-0"
                    >
                      Change Post
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsMediaModalOpen(true)}
                    className="w-full border-2 border-dashed border-outline-variant/40 hover:border-rose-500/50 rounded-2xl p-6 text-center hover:bg-rose-500/[0.02] transition-colors flex flex-col items-center gap-2 cursor-pointer text-on-surface-variant"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow shadow-rose-500/10">
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-sans font-bold text-on-surface">Select Reel or Post</span>
                    <span className="text-[10px] text-outline font-sans">Connect automation to comments on a specific post</span>
                  </button>
                )}
              </div>
            )}

            {/* Comment Replies setup section */}
            {draft.triggerType === 'comment' && (
              <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block text-left">
                      Public Comment Replies
                    </label>
                    <span className="text-[10px] text-outline font-sans block mt-0.5 text-left">
                      {draft.commentReplies && draft.commentReplies.filter((r: string) => r.trim()).length > 0
                        ? `Configured ${draft.commentReplies.filter((r: string) => r.trim()).length} random replies`
                        : 'Replies randomly from: "Got it, check your DM! 📩" (Default)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRepliesModalOpen(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-sans text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-100/50 shadow-sm"
                  >
                    Setup Comment Replies
                  </button>
                </div>
              </div>
            )}

            {/* Keyword configuration dashboard info block */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block">
                  Trigger Keyword Rules
                </label>
                <button
                  type="button"
                  onClick={openKeywordsModal}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-sans text-xs font-bold rounded-xl transition-all cursor-pointer border border-indigo-100/50 shadow-sm"
                >
                  Configure Keywords
                </button>
              </div>

              <div className="bg-surface-alt rounded-2xl border border-outline-variant/30 p-4.5 space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-outline-variant/20 pb-3">
                  <div>
                    <span className="text-[10px] text-outline uppercase font-mono block">Trigger Condition</span>
                    <span className="text-xs font-bold text-on-surface font-sans">
                      {draft.keywords.includes('*') 
                        ? 'Trigger on Any Comment/DM (Wildcard)' 
                        : `Trigger on Match: ${draft.matchType === 'exact' ? 'Exact Match' : 'Contains Keyword'}`}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-outline uppercase font-mono block">Active Keywords</span>
                    <span className="text-xs font-bold text-neutral-900 font-sans">
                      {draft.keywords.includes('*')
                      ? 'Any keyword (all comments)'
                      : `${draft.keywords.length} active`}
                    </span>
                  </div>
                </div>

                {!draft.keywords.includes('*') ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    {draft.keywords.map(kw => (
                      <span key={kw} className="bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-sans font-bold shadow-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-outline font-sans leading-relaxed">
                    🌟 Universal wildcard matching enabled. No keyword filtering will be applied.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Multi-Format Responses Sequence Builder */}
          <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 space-y-6 shadow-sm">
            <h2 className="text-sm font-mono font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/25 pb-3">
              <MessageCircle className="w-4.5 h-4.5 text-primary" /> Step 3: Responses Flow Sequence
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-wider block">
                  Responses Sequence
                </label>
                <span className="text-[10px] text-outline font-mono">
                  {draft.responses?.length || 0} response{(draft.responses?.length || 0) !== 1 ? 's' : ''} configured
                </span>
              </div>

              {draft.responses && draft.responses.length > 0 ? (
                <div className="space-y-4">
                  {draft.responses.map((resp, idx) => (
                    <div key={resp.id} className="bg-surface-alt rounded-2xl border border-outline-variant/30 p-5 space-y-4 relative group">
                      {/* Header block with title, type icon, and control buttons */}
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                            #{idx + 1} {resp.type.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveResponse(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-white rounded text-on-surface-variant disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveResponse(idx, 'down')}
                            disabled={idx === (draft.responses?.length || 1) - 1}
                            className="p-1 hover:bg-white rounded text-on-surface-variant disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeResponse(resp.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                            title="Delete Response"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Fields for each type */}
                      {resp.type === 'text' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Message Text</label>
                            <textarea
                              value={resp.text || ''}
                              onChange={(e) => updateResponseField(resp.id, 'text', e.target.value)}
                              rows={3}
                              placeholder="Write a message..."
                              className="w-full bg-white border border-outline-variant/30 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none font-sans font-medium"
                            />
                          </div>

                          {/* Button builder */}
                          <div className="p-3.5 bg-white rounded-xl border border-outline-variant/20 space-y-3">
                            <label className="text-[10px] font-sans font-bold text-primary uppercase tracking-wider block">Optional Action Button</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-on-surface-variant block">Button Text</label>
                                <input
                                  type="text"
                                  value={resp.buttonText || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'buttonText', e.target.value)}
                                  placeholder="e.g. Visit Shop"
                                  className="w-full bg-surface-alt border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none font-medium"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-on-surface-variant block">Action Type</label>
                                <select
                                  value={resp.buttonType || 'link'}
                                  onChange={(e) => updateResponseField(resp.id, 'buttonType', e.target.value)}
                                  className="w-full bg-surface-alt border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none font-medium"
                                >
                                  <option value="link">Open URL Link</option>
                                  <option value="trigger">Send Message Trigger</option>
                                </select>
                              </div>
                            </div>
                            {resp.buttonText && resp.buttonText.trim() !== '' && (
                              <div className="space-y-1 pt-1">
                                <label className="text-[9px] font-bold text-on-surface-variant block">
                                  {resp.buttonType === 'link' ? 'URL Web Link (https://...)' : 'Message Payload (triggers auto-response on click)'}
                                </label>
                                <input
                                  type="text"
                                  value={resp.buttonValue || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'buttonValue', e.target.value)}
                                  placeholder={resp.buttonType === 'link' ? "https://my-shop.com" : "e.g. hello, pricing"}
                                  className="w-full bg-surface-alt border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none font-medium"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {resp.type === 'image' && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Upload Image or Paste URL</label>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={resp.imageUrl || ''}
                                onChange={(e) => updateResponseField(resp.id, 'imageUrl', e.target.value)}
                                placeholder="Paste image URL (https://...)"
                                className="flex-1 bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                              />
                              <label className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center shrink-0">
                                Upload File
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        if (ev.target?.result) {
                                          updateResponseField(resp.id, 'imageUrl', ev.target.result as string);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {resp.imageUrl && (
                              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-outline-variant/30 mt-2">
                                <img src={resp.imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => updateResponseField(resp.id, 'imageUrl', '')}
                                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {resp.type === 'card' && (
                        <div className="space-y-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Card Image</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={resp.cardImage || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'cardImage', e.target.value)}
                                  placeholder="Paste card image URL..."
                                  className="flex-1 bg-white border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-xs font-sans outline-none min-w-0 font-medium"
                                />
                                <label className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center shrink-0">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          if (ev.target?.result) {
                                            updateResponseField(resp.id, 'cardImage', ev.target.result as string);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              {resp.cardImage && (
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/30 mt-1">
                                  <img src={resp.cardImage} alt="Card preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Card Header Title</label>
                                <input
                                  type="text"
                                  value={resp.cardHeader || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'cardHeader', e.target.value)}
                                  placeholder="Card Title"
                                  className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Card Description</label>
                                <input
                                  type="text"
                                  value={resp.cardDescription || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'cardDescription', e.target.value)}
                                  placeholder="Short description..."
                                  className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Card Button builder */}
                          <div className="p-3 bg-white rounded-xl border border-outline-variant/20 space-y-3">
                            <label className="text-[10px] font-sans font-bold text-primary uppercase tracking-wider block">Card Button Action</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-on-surface-variant block">Button Text</label>
                                <input
                                  type="text"
                                  value={resp.cardButtonText || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'cardButtonText', e.target.value)}
                                  placeholder="e.g. Learn More"
                                  className="w-full bg-surface-alt border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none font-medium"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-on-surface-variant block">Action Type</label>
                                <select
                                  value={resp.cardButtonType || 'link'}
                                  onChange={(e) => updateResponseField(resp.id, 'cardButtonType', e.target.value)}
                                  className="w-full bg-surface-alt border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none font-medium"
                                >
                                  <option value="link">Open URL Link</option>
                                  <option value="trigger">Send Message Trigger</option>
                                </select>
                              </div>
                            </div>
                            {resp.cardButtonText && resp.cardButtonText.trim() !== '' && (
                              <div className="space-y-1 pt-1">
                                <label className="text-[9px] font-bold text-on-surface-variant block">
                                  {resp.cardButtonType === 'link' ? 'URL Web Link (https://...)' : 'Message Payload (triggers auto-response on click)'}
                                </label>
                                <input
                                  type="text"
                                  value={resp.cardButtonValue || ''}
                                  onChange={(e) => updateResponseField(resp.id, 'cardButtonValue', e.target.value)}
                                  placeholder={resp.cardButtonType === 'link' ? "https://..." : "e.g. info, register"}
                                  className="w-full bg-surface-alt border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs font-sans outline-none font-medium"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {resp.type === 'follow' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Follow-Gate Prompt Message</label>
                            <textarea
                              value={resp.followGateText || ''}
                              onChange={(e) => updateResponseField(resp.id, 'followGateText', e.target.value)}
                              rows={3}
                              placeholder="Wait! I noticed you are not following yet. Please follow our page first, and click below to continue! 📲"
                              className="w-full bg-white border border-outline-variant/30 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none font-sans font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Verification Button Title</label>
                            <input
                              type="text"
                              value={resp.followGateButtonText || ''}
                              onChange={(e) => updateResponseField(resp.id, 'followGateButtonText', e.target.value)}
                              placeholder="I followed you! ✅"
                              className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                            />
                          </div>
                        </div>
                      )}

                      {resp.type === 'lead_form' && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">
                              Lead type to capture
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {LEAD_CAPTURE_OPTIONS.map((option) => {
                                const selected = (resp.leadCaptureType || 'either') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateLeadCaptureType(resp.id, option.value)}
                                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                                      selected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                        : 'border-outline-variant/30 bg-white hover:bg-surface-alt'
                                    }`}
                                  >
                                    <span className="text-[11px] font-sans font-bold text-on-surface block">
                                      {option.label}
                                    </span>
                                    <span className="text-[9px] font-sans text-outline leading-tight mt-0.5 block">
                                      {option.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Lead Capture Question Prompt</label>
                            <input
                              type="text"
                              value={resp.leadPrompt || ''}
                              onChange={(e) => updateResponseField(resp.id, 'leadPrompt', e.target.value)}
                              placeholder={getDefaultLeadPrompt(resp.leadCaptureType || 'either')}
                              className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Thank You Message (after valid reply)</label>
                            <input
                              type="text"
                              value={resp.leadSuccessMessage || ''}
                              onChange={(e) => updateResponseField(resp.id, 'leadSuccessMessage', e.target.value)}
                              placeholder="Thank you! Our team will reach out to you shortly. ✅"
                              className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Invalid Reply Message (retry prompt)</label>
                            <input
                              type="text"
                              value={resp.leadInvalidMessage || ''}
                              onChange={(e) => updateResponseField(resp.id, 'leadInvalidMessage', e.target.value)}
                              placeholder={getDefaultLeadInvalidMessage(resp.leadCaptureType || 'either')}
                              className="w-full bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-6 text-center text-outline font-sans text-xs">
                  No responses configured. Click below to add your first response.
                </div>
              )}

              {/* Add Response Button and Dropdown Menu */}
              <div className="relative inline-block text-left pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-sans text-xs font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Response
                </button>
                
                {isAddMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsAddMenuOpen(false)} />
                    <div className="origin-bottom-left absolute left-0 bottom-full mb-2 w-56 rounded-2xl shadow-lg bg-white border border-outline-variant/30 ring-1 ring-black ring-opacity-5 focus:outline-none z-20 overflow-hidden divide-y divide-outline-variant/10 text-left">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => { addResponseBlock('text'); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-alt font-sans font-semibold flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span>Text Message</span>
                          <span className="text-[10px] text-outline font-normal">Send a simple Text or Button Response</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { addResponseBlock('card'); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-alt font-sans font-semibold flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span>Card Message</span>
                          <span className="text-[10px] text-outline font-normal">Send a rich card with Image, Texts and Button</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { addResponseBlock('image'); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-alt font-sans font-semibold flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span>Image Message</span>
                          <span className="text-[10px] text-outline font-normal">Send an uploaded image response</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { addResponseBlock('follow'); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-alt font-sans font-semibold flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span>Ask For Follow</span>
                          <span className="text-[10px] text-outline font-normal">Request users to follow your account</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { addResponseBlock('lead_form'); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-alt font-sans font-semibold flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span>Lead Forms</span>
                          <span className="text-[10px] text-outline font-normal">Request users to input email or phone</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Side iPhone Simulator panel: 5 Columns */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div className="sticky top-20 space-y-4 max-w-[340px] mx-auto w-full">
            
            {/* Simulation Header */}
            <div className="flex items-center justify-between text-on-surface-variant text-xs font-semibold px-1">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>Simulated Sandbox</span>
              </div>
              
              {draft.triggerType === 'comment' && (
                <div className="flex bg-white rounded-lg p-0.5 border border-outline-variant/30">
                  <button 
                    onClick={() => setSimActiveTab('post')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${simActiveTab === 'post' ? 'bg-neutral-900 text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Feed Post
                  </button>
                  <button 
                    onClick={() => setSimActiveTab('dm')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${simActiveTab === 'dm' ? 'bg-neutral-900 text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Private DM
                  </button>
                </div>
              )}
            </div>

            {/* Apple iPhone Style Frame */}
            <div className="border-[8px] border-neutral-900 rounded-[3rem] overflow-hidden shadow-2xl bg-white aspect-[9/18.5] relative">
              
              {/* iPhone Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-full z-40 flex items-center justify-between px-2">
                <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></div>
                <div className="w-1 h-1 bg-neutral-800 rounded-full"></div>
              </div>

              {/* iPhone Notch Spacer */}
              <div className="h-7 bg-white"></div>

              {/* Simulated iOS Push Notification Banner */}
              <AnimatePresence>
                {simNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -80, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -80, scale: 0.9 }}
                    onClick={handleTapNotification}
                    className="absolute top-8 left-3 right-3 bg-white/95 backdrop-blur shadow-lg border border-outline-variant/30 p-3 rounded-2xl z-50 flex items-start gap-2.5 cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg instagram-bg flex items-center justify-center text-white shrink-0">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-on-surface tracking-tight">Instagram DM</span>
                        <span className="text-[8px] text-outline font-mono">now</span>
                      </div>
                      <p className="text-[10px] font-bold text-on-surface truncate mt-0.5">{simNotification.title}</p>
                      <p className="text-[9px] text-on-surface-variant line-clamp-1 leading-normal">{simNotification.body}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* App UI Frame Container */}
              <div className="flex flex-col h-[calc(100%-28px)] bg-neutral-50 relative">
                
                {/* Mode 1: Feed Post Layout */}
                {simActiveTab === 'post' ? (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                    {/* Header info */}
                    <div className="p-3 border-b border-outline-variant/20 bg-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-[8px] font-black shadow-inner uppercase overflow-hidden border border-outline-variant/10 shrink-0">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          (instagramAccountName || businessProfile.name || 'SC').slice(0, 2)
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-neutral-800 leading-tight truncate">
                          {instagramAccountName || businessProfile.name || ""}
                        </p>
                      </div>
                    </div>

                    {/* Feed Item Preview */}
                    <div className="flex-1 overflow-y-auto bg-white flex flex-col">
                      {draft.mediaUrl ? (
                        <img 
                          src={draft.mediaUrl} 
                          alt="Selected Post" 
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-900/10 via-rose-500/10 to-amber-500/10 flex flex-col items-center justify-center text-neutral-400 gap-2 border-b border-outline-variant/20">
                          <Film className="w-8 h-8 stroke-1 text-rose-500/40" />
                          <span className="text-[10px] font-bold text-on-surface-variant">Select media post on left</span>
                        </div>
                      )}

                      {/* Post Captions */}
                      <div className="p-3 text-left space-y-1.5 border-b border-outline-variant/20 bg-neutral-50/50">
                        <p className="text-[10px] font-bold text-on-surface">
                          {instagramAccountName ? instagramAccountName.toLowerCase().replace(/\s+/g, '_') : (businessProfile.name?.toLowerCase().replace(/\s+/g, '_') || 'your_business')}
                        </p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                          {draft.caption || draft.name || 'Double tap for crumbs! 🍞 Trigger keyword below...'}
                        </p>
                      </div>

                      {/* Comment Feed Thread */}
                      <div className="p-3 space-y-2.5 text-left flex-1 bg-white">
                        <span className="text-[9px] font-mono font-extrabold text-outline/80 uppercase tracking-wider block">Comments Thread</span>
                        
                        {simComments.map((comment, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-[10px] leading-tight">
                            <span className="font-bold text-on-surface shrink-0">{comment.username}</span>
                            <span className="text-on-surface-variant">{comment.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Comment Input Bar */}
                    <form onSubmit={handlePostMockComment} className="p-2 border-t border-outline-variant/25 bg-white flex items-center gap-2">
                      <input
                        type="text"
                        value={simCommentInput}
                        onChange={(e) => setSimCommentInput(e.target.value)}
                        placeholder={draft.keywords.length > 0 ? `Comment "${draft.keywords[0]}" to test...` : "Write a comment..."}
                        className="flex-1 bg-neutral-100 rounded-full px-3.5 py-1.5 text-[11px] text-neutral-800 outline-none border-none focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400"
                      />
                      <button
                        type="submit"
                        className="w-6.5 h-6.5 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  // Mode 2: DM Inbox Layout
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                    {/* Header info */}
                    <div className="p-3 border-b border-outline-variant/20 bg-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-[8px] font-black shadow-inner uppercase overflow-hidden border border-outline-variant/10 shrink-0">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          (instagramAccountName || businessProfile.name || 'SC').slice(0, 2)
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-neutral-800 leading-tight truncate">
                          {instagramAccountName || businessProfile.name || ""}
                        </p>
                        <p className="text-[8px] text-green-600 font-sans leading-none flex items-center gap-0.5 mt-0.5">
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                          Direct Message active
                        </p>
                      </div>
                      
                      {/* Follow state simulator toggle */}
                      {draft.triggerType === 'comment' && draft.enableFollowGate && (
                        <button
                          onClick={() => {
                            setSimDmLoyalFollower(prev => !prev);
                            setSimDmLogs(prev => [
                              ...prev,
                              { sender: 'bot', text: `[Simulator State Change: User is now ${!simDmLoyalFollower ? 'Following' : 'Not Following'}]` }
                            ]);
                          }}
                          className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer ${simDmLoyalFollower ? 'bg-green-600 text-white' : 'bg-rose-100 text-rose-600 border border-rose-200'}`}
                          title="Simulate Follow state for gated flow test"
                        >
                          {simDmLoyalFollower ? 'Following' : 'Unfollowed'}
                        </button>
                      )}
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto flex flex-col justify-end bg-neutral-50/50">
                      {simDmLogs.map((log, idx) => {
                        const isSystem = log.type === 'system' || (log.text && (log.text.startsWith('[Simulator') || log.text.startsWith('[Comment')));
                        if (isSystem) {
                          return (
                            <div key={idx} className="text-[8px] text-outline font-mono text-center bg-neutral-200/40 py-1 px-2 rounded-lg">
                              {log.text}
                            </div>
                          );
                        }

                        const isUser = log.sender === 'user';
                        
                        // If it's a rich block from a bot response
                        if (log.block) {
                          const block = log.block;
                          return (
                            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                              <div className="max-w-[85%] text-left font-sans space-y-1.5">
                                {block.type === 'text' && (
                                  <div className="bg-white text-neutral-800 border border-outline-variant/20 px-3 py-1.5 rounded-2xl rounded-tl-sm shadow-sm font-medium text-[11px]">
                                    <p className="whitespace-pre-wrap">{block.text}</p>
                                    {block.buttonText && block.buttonText.trim() !== '' && (
                                      <button
                                        type="button"
                                        onClick={() => handleSimulatorButtonClick(block.buttonType, block.buttonValue)}
                                        className="mt-2 w-full text-center bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100/50 text-indigo-600 rounded-xl py-1.5 text-[10px] font-sans font-bold cursor-pointer transition-colors"
                                      >
                                        {block.buttonText}
                                      </button>
                                    )}
                                  </div>
                                )}

                                {block.type === 'image' && (
                                  <div className="bg-white border border-outline-variant/20 p-1 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                                    <img src={block.imageUrl || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80'} alt="Simulated attachment" className="w-full max-h-40 object-cover rounded-xl" />
                                  </div>
                                )}

                                {block.type === 'card' && (
                                  <div className="bg-white border border-outline-variant/20 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden flex flex-col">
                                    {block.cardImage && (
                                      <img src={block.cardImage} alt="Card preview" className="w-full h-32 object-cover" />
                                    )}
                                    <div className="p-3 text-left space-y-1">
                                      <h4 className="text-[11px] font-black text-neutral-800 leading-tight">{block.cardHeader || 'Card Title'}</h4>
                                      <p className="text-[10px] text-on-surface-variant font-medium leading-normal">{block.cardDescription || 'Description...'}</p>
                                      {block.cardButtonText && block.cardButtonText.trim() !== '' && (
                                        <button
                                          type="button"
                                          onClick={() => handleSimulatorButtonClick(block.cardButtonType, block.cardButtonValue)}
                                          className="mt-2.5 w-full text-center bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100/50 text-indigo-600 rounded-xl py-1.5 text-[10px] font-sans font-bold cursor-pointer transition-colors"
                                        >
                                          {block.cardButtonText}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {block.type === 'follow' && (
                                  <div className="bg-white text-neutral-800 border border-outline-variant/20 px-3 py-1.5 rounded-2xl rounded-tl-sm shadow-sm font-medium text-[11px] flex flex-col items-center">
                                    <p className="whitespace-pre-wrap text-left w-full">{block.followGateText || "Please follow our account first! 📲"}</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const userText = block.followGateButtonText || "Started following";
                                        setSimDmLogs(prev => [...prev, { sender: 'user', text: userText }]);
                                        
                                        setTimeout(() => {
                                          setSimDmLogs(prev => {
                                            if (simDmLoyalFollower) {
                                              setTimeout(() => {
                                                triggerRemainingBlocksSimulator();
                                              }, 600);
                                              return [
                                                ...prev,
                                                { sender: 'bot', type: 'system', text: `[Simulator State: Follow Status Verified]` }
                                              ];
                                            } else {
                                              return [
                                                ...prev,
                                                { sender: 'bot', text: `I checked but you're not following yet! 🛑 Please follow our page and click below once you have followed.` },
                                                { sender: 'bot', block }
                                              ];
                                            }
                                          });
                                        }, 800);
                                      }}
                                      className="mt-2.5 w-full text-center bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100/50 text-indigo-600 rounded-xl py-1.5 text-[10px] font-sans font-bold cursor-pointer transition-colors animate-pulse"
                                    >
                                      {block.followGateButtonText || "Started following"}
                                    </button>
                                  </div>
                                )}

                                {block.type === 'lead_form' && (
                                  <div className="bg-white text-neutral-800 border border-outline-variant/20 px-3 py-1.5 rounded-2xl rounded-tl-sm shadow-sm font-medium text-[11px]">
                                    <p className="whitespace-pre-wrap">{block.leadPrompt || "Please reply with your email: 📧"}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`px-3 py-1.5 rounded-2xl text-[11px] max-w-[85%] text-left font-sans whitespace-pre-wrap ${
                              isUser
                                ? 'bg-neutral-900 text-white rounded-tr-sm'
                                : 'bg-white text-neutral-800 border border-outline-variant/20 rounded-tl-sm shadow-sm font-medium'
                            }`}>
                              {log.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Text DMs Form */}
                    <form onSubmit={handleSendMockDm} className="p-2 border-t border-outline-variant/25 bg-white flex items-center gap-2">
                      <input
                        type="text"
                        value={simDmInput}
                        onChange={(e) => setSimDmInput(e.target.value)}
                        placeholder={
                          simLeadGateState
                            ? 'Reply with lead info...'
                            : draft.responses?.some(r => r.type === 'follow') && !simDmLoyalFollower
                              ? "Type 'done' to verify follow..."
                              : "Type keywords..."
                        }
                        className="flex-1 bg-neutral-100 rounded-full px-3.5 py-1.5 text-[11px] text-neutral-800 outline-none border-none focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400"
                      />
                      <button
                        type="submit"
                        className="w-6.5 h-6.5 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>
            
            {/* Simulator guide tips */}
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 text-[10px] text-on-surface-variant font-sans leading-relaxed text-left flex gap-2">
              <Lock className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
              <div>
                <strong>Sandbox Testing:</strong>
                {draft.triggerType === 'comment' ? (
                  <p className="mt-1">
                    1. Try typing a comment containing <em>"{draft.keywords[0] || 'sourdough'}"</em> in the Comment feed.
                    <br />
                    2. Tap the push notification DM that slides down to check Follow-gate responses.
                  </p>
                ) : (
                  <p className="mt-1">
                    Send a DM containing one of your keywords to trigger your automated answers in real-time.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Media Selector Modal (Square Grid Overlay) */}
      <AnimatePresence>
        {isMediaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-outline-variant/30 max-w-xl w-full max-h-[85vh] p-6 shadow-2xl relative z-10 flex flex-col text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="font-display font-black text-lg text-on-surface flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-rose-500" /> Choose Feed Reel or Post
                  </h3>
                  <p className="text-on-surface-variant font-sans text-xs mt-0.5">
                    Select a post to monitor comments and trigger automation replies.
                  </p>
                </div>
                <button
                  onClick={() => setIsMediaModalOpen(false)}
                  className="p-1.5 hover:bg-surface-alt rounded-full text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid content scroll container */}
              <div className="flex-1 overflow-y-auto py-6 min-h-[300px]">
                {loadingMedia ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 py-12 text-outline">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-sans">Connecting to Meta Graph API...</span>
                  </div>
                ) : mediaList.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* Trigger on ALL Posts/Reels choice */}
                    <button
                      onClick={() => {
                        setDraft(prev => ({
                          ...prev,
                          mediaId: 'all',
                          mediaUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
                          caption: 'Trigger comments matching keywords on ALL my posts and reels!'
                        }));
                        setIsMediaModalOpen(false);
                      }}
                      className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer select-none leading-tight ${draft.mediaId === 'all' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/30 hover:border-neutral-500 hover:bg-neutral-50 text-on-surface-variant'}`}
                    >
                      <Sparkles className="w-6 h-6 mb-1.5 stroke-[1.5] text-purple-500 animate-pulse fill-purple-500/10" />
                      <span className="text-xs font-bold text-on-surface block">ALL Posts</span>
                      <span className="text-[9px] text-outline font-sans mt-0.5">Universal Catch-All</span>
                    </button>

                    {/* Media Items */}
                    {mediaList.map((media) => {
                      const isSelected = draft.mediaId === media.id;
                      const thumb = media.thumbnail_url || media.media_url;
                      return (
                        <button
                          key={media.id}
                          onClick={() => {
                            setDraft(prev => ({
                              ...prev,
                              mediaId: media.id,
                              mediaUrl: thumb,
                              caption: media.caption || 'Active Instagram Post'
                            }));
                            setIsMediaModalOpen(false);
                          }}
                          className={`group aspect-square rounded-2xl border-2 overflow-hidden relative transition-all cursor-pointer ${isSelected ? 'border-rose-500' : 'border-transparent hover:scale-[1.02]'}`}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt="Reel thumbnail"
                              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                              <Film className="w-5 h-5 text-neutral-400" />
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute inset-0 bg-rose-500/15 flex items-center justify-center">
                              <div className="bg-rose-500 text-white rounded-full p-1 shadow-lg">
                                <Check className="w-4 h-4" />
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] text-white truncate font-sans">
                              {media.caption || 'Grid Post'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 py-12 text-outline text-center">
                    <AlertCircle className="w-8 h-8 text-neutral-300 stroke-1" />
                    <p className="text-xs font-sans">No Instagram posts found for this connected account.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {/* Setup Comment Replies Modal */}
        {isRepliesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRepliesModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-outline-variant/30 max-w-lg w-full max-h-[85vh] p-6 shadow-2xl relative z-10 flex flex-col text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="font-display font-black text-lg text-on-surface flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-rose-500" /> Setup Comment Replies
                  </h3>
                  <p className="text-on-surface-variant font-sans text-xs mt-0.5">
                    Add Random Comment Replies
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRepliesModalOpen(false)}
                  className="p-1.5 hover:bg-surface-alt rounded-full text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable list of replies */}
              <div className="flex-1 overflow-y-auto py-6 space-y-3">
                {modalReplies.map((reply, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-4 text-xs font-mono text-outline shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => {
                        const newReplies = [...modalReplies];
                        newReplies[idx] = e.target.value;
                        setModalReplies(newReplies);
                      }}
                      placeholder="e.g. Got it, check your inbox! 📬"
                      className="flex-1 bg-white border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium focus:border-rose-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newReplies = modalReplies.filter((_, i) => i !== idx);
                        setModalReplies(newReplies.length > 0 ? newReplies : ['']);
                      }}
                      className="p-2 text-outline-variant hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setModalReplies([...modalReplies, ''])}
                  className="w-full py-2.5 border border-dashed border-outline-variant/40 hover:border-rose-500/50 hover:text-rose-600 rounded-xl text-center text-xs font-bold text-on-surface-variant transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" /> Add New Reply
                </button>
              </div>

              {/* Footer */}
              <div className="border-t border-outline-variant/20 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepliesModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanReplies = modalReplies.filter(r => r.trim() !== '');
                    setDraft(prev => ({
                      ...prev,
                      commentReplies: cleanReplies
                    }));
                    setIsRepliesModalOpen(false);
                  }}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Setup Keywords Modal */}
        {isKeywordsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsKeywordsModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className={`bg-white rounded-3xl border border-outline-variant/30 w-full p-6 shadow-2xl relative z-10 flex flex-col md:flex-row text-left gap-6 transition-all duration-300 ${
                showSuggestions ? 'max-w-4xl' : 'max-w-md'
              }`}
            >
              {/* Left Column: Suggestions Dictionary */}
              {showSuggestions && (
                <div className="flex-1 md:w-1/2 flex flex-col space-y-4 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0 md:pr-6 max-h-[70vh] md:max-h-[500px] overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-display font-black text-base text-on-surface">
                      Suggestions Dictionary
                    </h4>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={suggestionsSearch}
                      onChange={(e) => setSuggestionsSearch(e.target.value)}
                      placeholder="Search categories or keywords..."
                      className="w-full bg-surface-alt border border-outline-variant/30 rounded-xl pl-9 pr-8 py-2 text-xs font-sans outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-on-surface"
                    />
                    {suggestionsSearch && (
                      <button
                        type="button"
                        onClick={() => setSuggestionsSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-on-surface cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Accordion Categories List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                    {Object.entries(filteredSuggestions).length > 0 ? (
                      Object.entries(filteredSuggestions).map(([category, words]) => {
                        const isExpanded = expandedCategories[category] || !!suggestionsSearch;
                        const addedCount = words.filter(w => 
                          modalKeywords.some(mk => mk.toLowerCase() === w.toLowerCase())
                        ).length;
                        
                        return (
                          <div 
                            key={category} 
                            className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-surface-alt/30"
                          >
                            {/* Accordion Header */}
                            <div 
                              onClick={() => {
                                if (!suggestionsSearch) {
                                  setExpandedCategories(prev => ({
                                    ...prev,
                                    [category]: !prev[category]
                                  }));
                                }
                              }}
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-alt/60 transition-colors select-none"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight 
                                  className={`w-4 h-4 text-on-surface-variant transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`} 
                                />
                                <span className="font-sans font-bold text-xs text-on-surface">
                                  {category}
                                </span>
                                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                                  {addedCount}/{words.length}
                                </span>
                              </div>
                              
                              {/* Add All Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const toAdd = words.filter(w => 
                                    !modalKeywords.some(mk => mk.toLowerCase() === w.toLowerCase())
                                  );
                                  if (toAdd.length > 0) {
                                    setModalKeywords(prev => [...prev, ...toAdd]);
                                  }
                                }}
                                disabled={addedCount === words.length || modalAnyKeyword}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                Add All
                              </button>
                            </div>

                            {/* Collapsible Chips Grid */}
                            {isExpanded && (
                              <div className="p-3 bg-white border-t border-outline-variant/10 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                                {words.map(w => {
                                  const isAdded = modalKeywords.some(mk => mk.toLowerCase() === w.toLowerCase());
                                  return (
                                    <button
                                      key={w}
                                      type="button"
                                      onClick={() => {
                                        if (!isAdded && !modalAnyKeyword) {
                                          setModalKeywords(prev => [...prev, w]);
                                        }
                                      }}
                                      disabled={modalAnyKeyword}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-sans font-medium flex items-center gap-1 transition-all ${
                                        isAdded 
                                          ? 'bg-neutral-100 text-neutral-400 border border-neutral-200/50 cursor-default font-bold'
                                          : 'bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100/50 hover:border-indigo-200 cursor-pointer font-bold'
                                      }`}
                                    >
                                      {w}
                                      {isAdded && <Check className="w-3 h-3 text-neutral-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-outline text-xs">
                        No categories or keywords match "{suggestionsSearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right Column: Original Active Config Pane */}
              <div className={`flex-1 flex flex-col space-y-4 ${showSuggestions ? 'md:w-1/2 max-h-[70vh] md:max-h-[500px] overflow-y-auto pr-1' : 'w-full'}`}>
                {/* Header */}
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-lg text-on-surface">
                      Setup Keywords
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                        showSuggestions
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white hover:bg-surface-alt text-indigo-600 border-indigo-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      {showSuggestions ? 'Hide Suggestions' : '💡 Suggestions Dictionary'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKeywordsModalOpen(false)}
                    className="p-1.5 hover:bg-surface-alt rounded-full text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-on-surface-variant font-sans text-xs leading-relaxed">
                  Keywords are not case-sensitive, e.g., "Link" and "link" are recognized as the same.
                </p>

                {/* Match type dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Match type</label>
                  <select
                    value={modalMatchType}
                    onChange={(e) => setModalMatchType(e.target.value as 'exact' | 'contains')}
                    disabled={modalAnyKeyword}
                    className="w-full bg-surface-alt border border-outline-variant/30 rounded-xl px-3 py-2 text-sm font-sans outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 font-semibold text-on-surface"
                  >
                    <option value="exact">Exact match</option>
                    <option value="contains">Contains in chat</option>
                  </select>
                </div>

                {/* Keyword chips and Input field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider block">Keywords</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modalKeywordInput}
                      onChange={(e) => setModalKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddModalKeyword();
                        }
                      }}
                      disabled={modalAnyKeyword}
                      placeholder="Type & Hit ↵ Enter to add Keyword"
                      className="flex-1 bg-surface-alt border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 font-semibold text-on-surface"
                    />
                    <button
                      type="button"
                      onClick={handleAddModalKeyword}
                      disabled={modalAnyKeyword}
                      className="px-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chips list */}
                  {!modalAnyKeyword && modalKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 max-h-36 overflow-y-auto">
                      {modalKeywords.map(kw => (
                        <span key={kw} className="bg-indigo-50 text-indigo-600 border border-indigo-100/30 px-2.5 py-1 rounded-lg text-xs font-sans font-bold flex items-center gap-1 shadow-sm">
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveModalKeyword(kw)}
                            className="hover:bg-indigo-100 rounded-full p-0.5 text-indigo-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Any keyword toggle */}
                <div className="flex justify-between items-center pt-2">
                  <div className="space-y-0.5">
                    <label className="font-sans font-bold text-xs text-on-surface uppercase tracking-wider block">
                      Any keyword
                    </label>
                    <p className="text-[10px] text-outline font-sans">
                      Trigger on any customer message / comment
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAnyKeyword(!modalAnyKeyword)}
                    className="cursor-pointer"
                  >
                    {modalAnyKeyword ? (
                      <ToggleRight className="w-10 h-6 text-primary stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-on-surface-variant/40 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20 mt-auto">
                  <button
                    type="button"
                    onClick={() => setIsKeywordsModalOpen(false)}
                    className="px-4 py-2 border border-outline-variant/30 text-on-surface-variant font-sans text-xs font-bold rounded-xl hover:bg-surface-alt transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmKeywords}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer shadow shadow-indigo-600/10"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
