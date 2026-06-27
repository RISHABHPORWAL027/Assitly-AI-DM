import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Settings, 
  Users, 
  LogOut, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Link2
} from 'lucide-react';

import { ScreenType, FAQ, Contact, BusinessProfile, Automation } from './types';
import HeroLandingView from './components/HeroLandingView';
import { ContactPage, FaqPage, PrivacyPolicyPage, TermsPage } from './components/StaticPages';
import { PUBLIC_SCREENS } from './lib/siteLinks';
import AutomationsListView from './components/AutomationsListView';
import AutomationBuilderView from './components/AutomationBuilderView';
import FAQSettingsView from './components/FAQSettingsView';
import ContactsView from './components/ContactsView';
import SettingsView from './components/SettingsView';
import ConnectCelebration from './components/ConnectCelebration';
import WorkspaceShell from './components/WorkspaceShell';
import { saveAutomation, deleteAutomation } from './lib/automationsApi';
import { saveFAQ, deleteFAQ } from './lib/faqsApi';
import { saveContact, deleteContact } from './lib/contactsApi';
import { saveBusinessProfile } from './lib/profileApi';
import { initMetaSdk, connectInstagramViaMeta } from './lib/connectInstagram';
import { fetchBillingStatus, createSubscriptionCheckout } from './lib/billingApi';
import { openRazorpaySubscriptionCheckout } from './lib/razorpayCheckout';
import { normalizeStoredPlan, type BillablePlan, type UserPlan } from './lib/plans';
import { useAuth } from './context/AuthContext';
import { auth } from './lib/firebase';

// Default initial payloads
const defaultBusinessProfile: BusinessProfile = {
  name: "",
  email: "",
  address: "",
  hoursWeekdays: "",
  hoursWeekends: "",
  statusOn: true
};

const defaultFAQs: FAQ[] = [];
const defaultContacts: Contact[] = [];

const WORKSPACE_SCREENS: ScreenType[] = ['automations', 'automation_builder', 'faq_settings', 'contacts', 'settings'];

/** Set when user explicitly disconnects — blocks dev sandbox auto-reconnect */
const IG_MANUAL_DISCONNECT_KEY = 'assistly_ig_manual_disconnect';

function normalizeScreenHash(hash: string): ScreenType {
  if (hash === 'dashboard' || hash === 'onboarding1') return 'automations';
  const validScreens: ScreenType[] = [...PUBLIC_SCREENS as unknown as ScreenType[], ...WORKSPACE_SCREENS];
  if (validScreens.includes(hash as ScreenType)) {
    return hash as ScreenType;
  }
  return 'landing';
}

export default function App() {
  const { user, loading, loginWithGoogle, logout, getAuthHeaders } = useAuth();
  
  // Navigation screen router
  const [screen, setScreen] = useState<ScreenType>(() => normalizeScreenHash(window.location.hash.replace('#', '')));

  // States with LocalPersistence initializer
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('assistly_profile');
    return saved ? JSON.parse(saved) : defaultBusinessProfile;
  });

  const [automations, setAutomations] = useState<Automation[]>(() => {
    const saved = localStorage.getItem('assistly_automations');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [automationListRefreshKey, setAutomationListRefreshKey] = useState(0);

  const bumpAutomationListRefresh = () => setAutomationListRefreshKey((k) => k + 1);

  const [faqs, setFaqs] = useState<FAQ[]>(() => {
    const saved = localStorage.getItem('assistly_faqs');
    return saved ? JSON.parse(saved) : defaultFAQs;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('assistly_contacts');
    return saved ? JSON.parse(saved) : defaultContacts;
  });

  const [isInstagramConnected, setIsInstagramConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem('assistly_ig_link');
    return saved ? JSON.parse(saved) : false; // default to false so users connect it
  });

  const [instagramAccountId, setInstagramAccountId] = useState<string>(() => {
    return localStorage.getItem('assistly_ig_account_id') || '';
  });

  const [instagramAccountName, setInstagramAccountName] = useState<string>(() => {
    return localStorage.getItem('assistly_ig_account_name') || '';
  });

  const [instagramUsername, setInstagramUsername] = useState<string>(() => {
    return localStorage.getItem('assistly_ig_username') || '';
  });

  const [instagramProfilePic, setInstagramProfilePic] = useState<string>(() => {
    return localStorage.getItem('assistly_ig_profile_pic') || '';
  });


  const [currentPlan, setCurrentPlan] = useState<UserPlan>(() => {
    const saved = localStorage.getItem('assistly_plan');
    if (!saved) return 'Free';
    try {
      return normalizeStoredPlan(JSON.parse(saved));
    } catch {
      return normalizeStoredPlan(saved);
    }
  });

  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    const saved = localStorage.getItem('assistly_sidebar_minimized');
    return saved ? JSON.parse(saved) : false;
  });

  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);

  const [settingsTab, setSettingsTab] = useState<'general' | 'instagram' | 'billing'>('general');
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [showConnectCelebration, setShowConnectCelebration] = useState(false);
  const [celebrationDisplayName, setCelebrationDisplayName] = useState('');
  const [createAutomationSignal, setCreateAutomationSignal] = useState(0);
  const [billingBusy, setBillingBusy] = useState<BillablePlan | null>(null);

  useEffect(() => {
    initMetaSdk();
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('assistly_sidebar_minimized', JSON.stringify(isSidebarMinimized));
  }, [isSidebarMinimized]);

  useEffect(() => {
    localStorage.setItem('assistly_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('assistly_automations', JSON.stringify(automations));
  }, [automations]);

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

  useEffect(() => {
    localStorage.setItem('assistly_ig_username', instagramUsername);
  }, [instagramUsername]);

  useEffect(() => {
    localStorage.setItem('assistly_ig_profile_pic', instagramProfilePic);
  }, [instagramProfilePic]);

  // Dev sandbox auto-connect — never in production builds
  useEffect(() => {
    if (import.meta.env.PROD) return;
    if (!instagramAccountId) {
      const manuallyDisconnected = localStorage.getItem(IG_MANUAL_DISCONNECT_KEY) === 'true';
      if (manuallyDisconnected) {
        return;
      }

      fetch('/api/auth/sandbox-config')
        .then(res => res.json())
        .then(data => {
          if (data.enabled && data.igAccountId) {
            console.log("Auto-connecting sandbox IG Account:", data.igAccountId);
            handleConnectedStatusChange(
              true,
              data.igAccountId,
              data.igAccountName,
              data.username,
              data.profilePictureUrl
            );
          }
        })
        .catch(err => console.error("Error checking sandbox config:", err));
    }
  }, [instagramAccountId]);

  // Fetch all user-specific data from server when Instagram is connected
  useEffect(() => {
    if (!instagramAccountId || loading || !user) return;

    const fetchAllData = async () => {
      try {
        const headers = await getAuthHeaders(instagramAccountId);

        // Automations list is loaded via AutomationsListView (paginated)

        // Fetch FAQs
        const faqsRes = await fetch('/api/faqs', { headers });
        if (faqsRes.ok) {
          const data = await faqsRes.json();
          if (Array.isArray(data)) setFaqs(data);
        }

        // Fetch Profile
        const profileRes = await fetch('/api/business/profile', { headers });
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data && typeof data === 'object') setProfile(data);
        }

        // Fetch Instagram Profile details
        try {
          const igProfileRes = await fetch('/api/instagram/profile', { headers });
          if (igProfileRes.ok) {
            const data = await igProfileRes.json();
            if (data) {
              if (data.username) setInstagramUsername(data.username);
              if (data.name) setInstagramAccountName(data.name);
              if (data.profile_picture_url) setInstagramProfilePic(data.profile_picture_url);
            }
          } else {
            const errBody = await igProfileRes.json().catch(() => ({}));
            console.error('Instagram profile fetch failed:', igProfileRes.status, errBody?.error || errBody);
          }
        } catch (e) {
          console.error('Failed to load Instagram profile details:', e);
        }

        // Fetch Contacts & Activities
        await fetchLiveFeed();
      } catch (err) {
        console.error('Failed to load user data from server:', err);
      }
    };

    const fetchLiveFeed = async () => {
      try {
        const headers = await getAuthHeaders(instagramAccountId);

        // Fetch Contacts
        const contactsRes = await fetch('/api/contacts', { headers });
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          if (Array.isArray(data)) setContacts(data);
        }
      } catch (e) {
        console.error('Failed to pull live contacts updates:', e);
      }
    };

    fetchAllData();

    // Poll contacts every 10s
    const interval = setInterval(fetchLiveFeed, 10000);
    return () => clearInterval(interval);
  }, [instagramAccountId, user, loading]);

  // Synchronize screen state with URL hash
  useEffect(() => {
    window.location.hash = screen;
  }, [screen]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      setScreen(normalizeScreenHash(window.location.hash.replace('#', '')));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Redirect to landing if not authenticated and trying to access workspace
  useEffect(() => {
    if (!loading && !user && !PUBLIC_SCREENS.includes(screen as (typeof PUBLIC_SCREENS)[number])) {
      setScreen('landing');
    }
  }, [user, loading, screen]);

  // Logged-in users go straight to the automations console (not the marketing landing page)
  useEffect(() => {
    if (!loading && user && screen === 'landing') {
      setScreen('automations');
    }
  }, [user, loading, screen]);

  // Sync subscription plan from server when authenticated
  useEffect(() => {
    if (!user || loading) return;

    let cancelled = false;
    getAuthHeaders(instagramAccountId || undefined)
      .then((headers) => fetchBillingStatus(headers))
      .then((data) => {
        if (!cancelled) setCurrentPlan(normalizeStoredPlan(data.plan));
      })
      .catch((err) => console.warn('Billing status load failed:', err));

    return () => {
      cancelled = true;
    };
  }, [user, loading, instagramAccountId]);

  // Safety redirect: if accessing automation builder directly without a selected automation, redirect to automations list
  useEffect(() => {
    if (screen === 'automation_builder' && !selectedAutomation) {
      setScreen('automations');
    }
  }, [screen, selectedAutomation]);

  const handleUpdateProfile = async (updated: BusinessProfile) => {
    setProfile(updated);
    if (!instagramAccountId) return;
    try {
      const headers = await getAuthHeaders(instagramAccountId);
      const res = await saveBusinessProfile(headers, updated);
      if (!res.ok) {
        console.error('Failed to sync profile to server:', await res.text());
      }
    } catch (e) {
      console.error('Failed to sync profile to server:', e);
    }
  };

  const handleSaveFAQ = async (faq: FAQ) => {
    setFaqs((prev) => {
      const index = prev.findIndex((f) => f.id === faq.id);
      if (index >= 0) {
        return prev.map((f) => (f.id === faq.id ? faq : f));
      }
      return [...prev, faq];
    });
    if (!instagramAccountId) return;
    try {
      const headers = await getAuthHeaders(instagramAccountId);
      const res = await saveFAQ(headers, faq);
      if (!res.ok) {
        console.error('Failed to save FAQ on server:', await res.text());
      }
    } catch (e) {
      console.error('Failed to sync FAQ to server:', e);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    if (!instagramAccountId) return;
    try {
      const headers = await getAuthHeaders(instagramAccountId);
      const res = await deleteFAQ(headers, id);
      if (!res.ok) {
        console.error('Failed to delete FAQ on server:', await res.text());
      }
    } catch (e) {
      console.error('Failed to delete FAQ on server:', e);
    }
  };

  const handleSaveContact = async (contact: Contact) => {
    setContacts((prev) => {
      const index = prev.findIndex((c) => c.id === contact.id);
      if (index >= 0) {
        return prev.map((c) => (c.id === contact.id ? contact : c));
      }
      return [contact, ...prev];
    });
    if (!instagramAccountId) return;
    try {
      const headers = await getAuthHeaders(instagramAccountId);
      const res = await saveContact(headers, contact);
      if (!res.ok) {
        console.error('Failed to save contact on server:', await res.text());
      }
    } catch (e) {
      console.error('Failed to sync contact to server:', e);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (!instagramAccountId) return;
    try {
      const headers = await getAuthHeaders(instagramAccountId);
      const res = await deleteContact(headers, id);
      if (!res.ok) {
        console.error('Failed to delete contact on server:', await res.text());
      }
    } catch (e) {
      console.error('Failed to delete contact on server:', e);
    }
  };

  const handleConnectedStatusChange = (
    status: boolean,
    igId?: string,
    igName?: string,
    username?: string,
    profilePic?: string
  ) => {
    setIsInstagramConnected(status);
    if (status) {
      localStorage.removeItem(IG_MANUAL_DISCONNECT_KEY);
      if (igId) {
        setInstagramAccountId(igId);
        localStorage.setItem('assistly_ig_account_id', igId);
      }
      if (igName) {
        setInstagramAccountName(igName);
        localStorage.setItem('assistly_ig_account_name', igName);
      }
      if (username) {
        setInstagramUsername(username);
        localStorage.setItem('assistly_ig_username', username);
      }
      if (profilePic) {
        setInstagramProfilePic(profilePic);
        localStorage.setItem('assistly_ig_profile_pic', profilePic);
      }
    } else {
      localStorage.setItem(IG_MANUAL_DISCONNECT_KEY, 'true');
      setInstagramAccountId('');
      localStorage.removeItem('assistly_ig_account_id');
      setInstagramAccountName('');
      localStorage.removeItem('assistly_ig_account_name');
      setInstagramUsername('');
      localStorage.removeItem('assistly_ig_username');
      setInstagramProfilePic('');
      localStorage.removeItem('assistly_ig_profile_pic');
    }
  };

  const runMetaInstagramOAuth = async (options?: { celebrate?: boolean }) => {
    if (connectingInstagram) return;

    try {
      if (!user) {
        await loginWithGoogle();
      }
      if (!auth.currentUser) {
        return;
      }

      setConnectingInstagram(true);
      const result = await connectInstagramViaMeta(getAuthHeaders, auth.currentUser.uid);
      if (result?.igId) {
        handleConnectedStatusChange(
          true,
          result.igId,
          result.igName,
          result.username,
          result.profilePic
        );
        if (options?.celebrate) {
          setCelebrationDisplayName(
            result.username ? `@${result.username}` : result.igName || 'Instagram'
          );
          setShowConnectCelebration(true);
          setScreen('automations');
        }
      }
    } catch (e) {
      console.error('Instagram connect failed:', e);
      alert(e instanceof Error ? e.message : 'Failed to connect Instagram account.');
    } finally {
      setConnectingInstagram(false);
    }
  };

  const handleConnectInstagram = () => {
    if (isInstagramConnected) return;
    return runMetaInstagramOAuth({ celebrate: true });
  };

  const handleReconnectInstagram = () => runMetaInstagramOAuth();

  const handleSyncWebhooks = async () => {
    if (!instagramAccountId) {
      alert('Connect Instagram first.');
      return;
    }
    try {
      const headers = await getAuthHeaders(instagramAccountId);
      const res = await fetch('/api/meta/sync-webhooks', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      const pageOk = data.pageHasFeed ? '✓ feed' : '✗ feed missing';
      const igOk = data.igHasComments ? '✓ comments' : '✗ comments missing';
      const appOk = data.appSubscriptions && !data.appSubscriptions.error ? '✓ app-level' : '✗ check server logs';
      alert(
        `Webhook sync complete.\n\nPage fields: ${(data.pageFields || []).join(', ') || 'none'} (${pageOk})\nIG fields: ${(data.igFields || []).join(', ') || 'none'} (${igOk})\nApp subscriptions: ${appOk}\nCallback: ${data.callbackUrl || 'set WEBHOOK_CALLBACK_URL in .env'}\n\nIf comments still fail, comment on a reel and look for [Webhook] lines in the backend terminal.`
      );
    } catch (e) {
      console.error('Webhook sync failed:', e);
      alert(e instanceof Error ? e.message : 'Failed to sync webhooks.');
    }
  };

  const handleUpgradePlan = async (plan: BillablePlan) => {
    if (!user) {
      await loginWithGoogle();
    }
    if (!auth.currentUser) return;

    setBillingBusy(plan);
    try {
      const headers = await getAuthHeaders(instagramAccountId || undefined);
      const checkout = await createSubscriptionCheckout(headers, plan);
      const verifiedPlan = await openRazorpaySubscriptionCheckout(checkout, headers, plan);
      setCurrentPlan(verifiedPlan);
    } catch (e) {
      if (e instanceof Error && e.message !== 'Checkout closed') {
        alert(e.message);
      }
    } finally {
      setBillingBusy(null);
    }
  };

  const handleCreateAutomation = (triggerType: 'comment' | 'dm') => {
    const newAuto: Automation = {
      id: 'auto_' + Date.now(),
      name: 'Automate Campaign',
      triggerType,
      status: 'active',
      createdAt: new Date().toLocaleDateString('en-GB'),
      lastModified: new Date().toLocaleDateString('en-GB'),
      keywords: [],
      replyText: '',
      enableFollowGate: false,
      notFollowingMessage: "Thanks! I noticed you aren't following yet. Follow us and reply 'done' to get the link! 📲"
    };
    setSelectedAutomation(newAuto);
    setScreen('automation_builder');
  };

  const handleEditAutomation = (auto: Automation) => {
    setSelectedAutomation(auto);
    setScreen('automation_builder');
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    if (instagramAccountId) {
      try {
        const headers = await getAuthHeaders(instagramAccountId);
        const res = await deleteAutomation(headers, id);
        if (!res.ok) {
          throw new Error('Server delete failed');
        }
        bumpAutomationListRefresh();
      } catch (e) {
        console.error('Failed to delete automation from server:', e);
        alert('Could not delete automation on server. Refresh and try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const target = automations.find((a) => a.id === id);
    if (!target) return;

    const updatedAuto: Automation = {
      ...target,
      status: target.status === 'active' ? 'inactive' : 'active',
      lastModified: new Date().toLocaleDateString('en-GB'),
    };

    setAutomations((prev) => prev.map((a) => (a.id === id ? updatedAuto : a)));

    if (instagramAccountId) {
      try {
        const headers = await getAuthHeaders(instagramAccountId);
        const res = await saveAutomation(headers, updatedAuto);
        if (!res.ok) {
          throw new Error('Server toggle failed');
        }
        bumpAutomationListRefresh();
      } catch (e) {
        console.error('Failed to toggle status on server:', e);
        setAutomations((prev) => prev.map((a) => (a.id === id ? target : a)));
        alert('Could not update status on server.');
      }
    }
  };

  const handleSaveAutomation = async (updatedAuto: Automation) => {
    setAutomations((prev) => {
      const index = prev.findIndex((a) => a.id === updatedAuto.id);
      if (index >= 0) {
        return prev.map((a) => (a.id === updatedAuto.id ? updatedAuto : a));
      }
      return [...prev, updatedAuto];
    });

    if (instagramAccountId) {
      try {
        const headers = await getAuthHeaders(instagramAccountId);
        const res = await saveAutomation(headers, updatedAuto);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const detail = body?.error || `HTTP ${res.status}`;
          console.error('Automation save failed:', res.status, detail);
          alert(`Saved locally, but server sync failed.\n\n${detail}`);
        } else {
          bumpAutomationListRefresh();
        }
      } catch (e) {
        console.error('Server sync error:', e);
        alert(
          `Saved locally, but server sync failed.\n\n${
            e instanceof Error ? e.message : 'Network error — check Railway is running.'
          }`
        );
      }
    } else {
      alert('Connect Instagram first — automations need a linked account to sync to the server.');
    }
    setScreen('automations');
  };

  // Nav actions
  const isWorkspace = WORKSPACE_SCREENS.includes(screen);

  const navItems = [
    { name: 'Automations', id: 'automations' as const, icon: <Zap className="w-5 h-5" /> },
    { name: 'Contacts', id: 'contacts' as const, icon: <Users className="w-5 h-5" /> },
    { name: 'Settings', id: 'settings' as const, icon: <Settings className="w-5 h-5" />, tab: 'general' as const },
  ];

  const workspaceBreadcrumbs: Record<string, string> = {
    automations: 'Automations Console',
    contacts: 'Collected Contacts',
    settings: 'Account Settings',
    automation_builder: 'Automation Builder',
    faq_settings: 'FAQ Settings',
  };

  const handleWorkspaceCreateNew = () => {
    if (screen !== 'automations') setScreen('automations');
    setCreateAutomationSignal((n) => n + 1);
  };

  const screenContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={screen === 'landing' ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={screen === 'landing' ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col"
      >
        {screen === 'landing' && (
          <HeroLandingView
            onGetStarted={async () => {
              if (!user) {
                await loginWithGoogle();
              }
              setScreen('automations');
            }}
            onLogin={loginWithGoogle}
            onGoToConsole={() => setScreen('automations')}
            isLoggedIn={!!user}
          />
        )}

        {screen === 'privacy' && <PrivacyPolicyPage />}
        {screen === 'terms' && <TermsPage />}
        {screen === 'faq' && <FaqPage />}
        {screen === 'contact' && <ContactPage />}

        {screen === 'automations' && (
          <AutomationsListView
            listRefreshKey={automationListRefreshKey}
            openCreateSignal={createAutomationSignal}
            onEdit={handleEditAutomation}
            onCreate={handleCreateAutomation}
            onDelete={handleDeleteAutomation}
            onToggleStatus={handleToggleStatus}
            isInstagramConnected={isInstagramConnected}
            onConnectInstagram={handleConnectInstagram}
            connectingInstagram={connectingInstagram}
            instagramAccountId={instagramAccountId}
          />
        )}

        {screen === 'automation_builder' && selectedAutomation && (
          <AutomationBuilderView
            automation={selectedAutomation}
            businessProfile={profile}
            onSave={handleSaveAutomation}
            onBack={() => setScreen('automations')}
            user={user}
            instagramAccountName={instagramAccountName}
          />
        )}

        {screen === 'faq_settings' && (
          <FAQSettingsView
            businessProfile={profile}
            faqs={faqs}
            onUpdateProfile={handleUpdateProfile}
            onSaveFAQ={handleSaveFAQ}
            onDeleteFAQ={handleDeleteFAQ}
          />
        )}

        {screen === 'settings' && (
          <SettingsView
            businessProfile={profile}
            instagramAccountName={instagramAccountName}
            instagramUsername={instagramUsername}
            instagramProfilePic={instagramProfilePic}
            isInstagramConnected={isInstagramConnected}
            currentPlan={currentPlan}
            onUpdateProfile={handleUpdateProfile}
            onUpgradePlan={handleUpgradePlan}
            billingBusy={billingBusy}
            onConnectInstagram={handleConnectInstagram}
            onReconnectInstagram={handleReconnectInstagram}
            onSyncWebhooks={handleSyncWebhooks}
            connectingInstagram={connectingInstagram}
            onDisconnectInstagram={() => handleConnectedStatusChange(false)}
            user={user}
            defaultTab={settingsTab}
          />
        )}

        {screen === 'contacts' && (
          <ContactsView
            contacts={contacts}
            onSaveContact={handleSaveContact}
            onDeleteContact={handleDeleteContact}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className={`bg-background text-on-surface flex flex-col font-sans selection:bg-primary/20 ${isWorkspace ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>

      {isWorkspace ? (
        <WorkspaceShell
          screen={screen}
          setScreen={setScreen}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          navItems={navItems}
          isInstagramConnected={isInstagramConnected}
          user={user}
          instagramProfilePic={instagramProfilePic}
          onLogout={async () => {
            await logout();
            setScreen('landing');
          }}
          onCreateNew={handleWorkspaceCreateNew}
          onConnectInstagram={handleConnectInstagram}
          connectingInstagram={connectingInstagram}
          breadcrumbLeaf={workspaceBreadcrumbs[screen] || 'Workspace'}
        >
          {screenContent}
        </WorkspaceShell>
      ) : (
        <main className="flex-1 flex flex-col w-full">{screenContent}</main>
      )}

      <ConnectCelebration
        show={showConnectCelebration}
        displayName={celebrationDisplayName}
        onComplete={() => setShowConnectCelebration(false)}
      />

    </div>
  );
}

