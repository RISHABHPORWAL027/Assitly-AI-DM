import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Instagram,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { WorkspacePageHero, WorkspaceSummaryCard, WorkspaceFooter } from './ui/WorkspacePageHero';
import {
  PLAN_CATALOG,
  formatPlanDescription,
  formatPlanPrice,
  type BillablePlan,
  type UserPlan,
} from '../lib/plans';

interface SettingsViewProps {
  businessProfile: BusinessProfile;
  instagramAccountName?: string;
  instagramUsername?: string;
  instagramProfilePic?: string;
  isInstagramConnected: boolean;
  currentPlan: UserPlan;
  onUpdateProfile: (updated: BusinessProfile) => void;
  onUpgradePlan: (plan: BillablePlan) => void | Promise<void>;
  onConnectInstagram: () => void;
  onReconnectInstagram?: () => void;
  onSyncWebhooks?: () => void;
  onDisconnectInstagram: () => void;
  connectingInstagram?: boolean;
  billingBusy?: BillablePlan | null;
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  defaultTab?: 'general' | 'instagram' | 'billing';
}

function splitDisplayName(displayName?: string | null) {
  if (!displayName?.trim()) return { first: '', last: '' };
  const parts = displayName.trim().split(/\s+/);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
}

export default function SettingsView({
  businessProfile,
  instagramAccountName,
  instagramUsername,
  instagramProfilePic,
  isInstagramConnected,
  currentPlan,
  onUpdateProfile,
  onUpgradePlan,
  onConnectInstagram,
  onReconnectInstagram,
  onSyncWebhooks,
  onDisconnectInstagram,
  connectingInstagram = false,
  billingBusy = null,
  user,
  defaultTab,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'instagram' | 'billing'>('general');
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  const nameParts = splitDisplayName(user?.displayName);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [firstName, setFirstName] = useState(
    () => localStorage.getItem('settings_first_name') || nameParts.first
  );
  const [lastName, setLastName] = useState(
    () => localStorage.getItem('settings_last_name') || nameParts.last
  );
  const [email, setEmail] = useState(
    () => localStorage.getItem('settings_email') || businessProfile.email || user?.email || ''
  );
  const [phone, setPhone] = useState(() => localStorage.getItem('settings_phone') || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    localStorage.setItem('settings_first_name', firstName);
    localStorage.setItem('settings_last_name', lastName);
    localStorage.setItem('settings_email', email);
    localStorage.setItem('settings_phone', phone);

    onUpdateProfile({
      ...businessProfile,
      name: `${firstName} ${lastName}`.trim(),
      email: email,
    });

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const planPrice = formatPlanPrice(currentPlan);
  const billingOptions: BillablePlan[] = ['Monthly', 'Yearly'];

  return (
    <div className="workspace-page space-y-6" id="settings-view">
      <WorkspacePageHero
        badge="Workspace"
        title="Account Settings"
        subtitle="Manage your profile, connected Instagram accounts, and billing — all in one control center."
        gradient="primary"
        chipTitle="Workspace secure"
        chipSubtitle="Profile & billing synced"
        visualIcon={<SlidersHorizontal className="w-16 h-16" strokeWidth={1.5} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WorkspaceSummaryCard
          title={currentPlan}
          label="Current plan"
          hint="Active subscription tier"
          accent="primary"
          icon={<CreditCard className="w-5 h-5" />}
          watermarkIcon={<CreditCard className="w-24 h-24 text-primary" />}
        />
        <WorkspaceSummaryCard
          title={isInstagramConnected ? 'Connected' : 'Not linked'}
          label="Instagram account"
          hint={
            isInstagramConnected
              ? `@${instagramUsername || instagramAccountName || 'account'}`
              : 'Connect to run automations'
          }
          accent="secondary"
          pulse={isInstagramConnected}
          icon={<Instagram className="w-5 h-5" />}
          watermarkIcon={<Instagram className="w-24 h-24 text-secondary" />}
        />
        <WorkspaceSummaryCard
          title={planPrice}
          label="Billing cycle"
          hint="Upgrade anytime from Billing tab"
          accent="tertiary"
          icon={<User className="w-5 h-5" />}
          watermarkIcon={<User className="w-24 h-24 text-tertiary" />}
        />
      </div>

      <div className="bg-surface-container-low p-1 rounded-xl flex flex-wrap items-center gap-1 border border-outline-variant/30">
        {(
          [
            { id: 'general' as const, label: 'General' },
            { id: 'instagram' as const, label: 'Instagram Accounts' },
            { id: 'billing' as const, label: 'Billing' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-primary'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-surface-container p-6 md:p-8">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="border-b border-surface-container pb-4">
              <h4 className="font-display font-bold text-lg text-on-surface">General Settings</h4>
              <p className="text-xs text-on-surface-variant mt-1">Manage your workspace preferences</p>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3.5 focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3.5 focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl p-3.5 focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl p-3.5 focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white"
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-surface-container">
                {saveSuccess ? (
                  <span className="text-xs font-semibold text-success-whatsapp flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Changes saved successfully!
                  </span>
                ) : (
                  <span />
                )}
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'instagram' && (
          <div className="space-y-6">
            <div className="border-b border-surface-container pb-4">
              <h4 className="font-display font-bold text-lg text-on-surface">Connected Social Accounts</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage linked Instagram channels for automations
              </p>
            </div>

            <div className="rounded-2xl p-6 bg-surface-container-low border border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-outline-variant/20 shadow-md shrink-0">
                  {isInstagramConnected && instagramProfilePic ? (
                    <img
                      src={instagramProfilePic}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full instagram-bg flex items-center justify-center text-white">
                      <Instagram className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-semibold text-sm text-on-surface">Instagram Professional</h5>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {isInstagramConnected
                      ? `Linked as @${instagramUsername || instagramAccountName || 'your_account'}`
                      : 'No account connected'}
                  </p>
                </div>
              </div>

              {isInstagramConnected ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-success-whatsapp/10 text-success-whatsapp border border-success-whatsapp/20 px-4 py-1.5 rounded-full font-bold text-xs uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-whatsapp animate-pulse" />
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() => onReconnectInstagram?.()}
                    disabled={connectingInstagram || !onReconnectInstagram}
                    className="border border-outline-variant hover:bg-surface-container-low px-4 py-2 rounded-xl font-semibold text-xs transition-all disabled:opacity-60"
                  >
                    {connectingInstagram ? 'Reconnecting…' : 'Reconnect'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-semibold text-xs transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onConnectInstagram}
                  disabled={connectingInstagram}
                  className="btn-instagram disabled:opacity-60"
                >
                  {connectingInstagram ? 'Connecting…' : 'Connect Instagram'}
                </button>
              )}
            </div>

            <div className="rounded-2xl p-5 bg-primary/5 border border-primary/15 space-y-3">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <span className="font-semibold text-on-surface">DM works but reel comments do not?</span>{' '}
                DMs use the <code className="text-[10px]">messages</code> webhook. Comment automations need Meta to send{' '}
                <code className="text-[10px]">comments</code> / Page <code className="text-[10px]">feed</code> events — requires{' '}
                <span className="font-semibold">Advanced Access</span> for{' '}
                <code className="text-[10px]">instagram_manage_comments</code> (App Review). If Railway shows no logs when you comment, Meta is not sending those events yet.
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <span className="font-semibold text-on-surface">Meta Dashboard:</span> Webhooks → Instagram → subscribe{' '}
                <code className="text-[10px]">comments</code> → click <span className="font-semibold">Test</span> — you should see a webhook hit in Railway logs.
              </p>
              {onSyncWebhooks && isInstagramConnected && (
                <button
                  type="button"
                  onClick={() => onSyncWebhooks()}
                  className="border border-primary/30 text-primary hover:bg-primary/10 px-4 py-2 rounded-xl font-semibold text-xs transition-all"
                >
                  Sync webhooks (verify Page feed + IG comments)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-on-surface-variant text-xs">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Authorization verified under Meta Developer API policy.</span>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="border-b border-surface-container pb-4">
              <h4 className="font-display font-bold text-lg text-on-surface">Billing Information</h4>
              <p className="text-xs text-on-surface-variant mt-1">Manage your subscription and upgrades</p>
            </div>

            <div className="rounded-2xl p-6 bg-surface-container-low border border-surface-container">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <span className="px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-md font-bold text-[10px] uppercase tracking-wider">
                    Current plan
                  </span>
                  <h4 className="font-display font-bold text-2xl text-on-surface">
                    {currentPlan === 'Free' ? 'Free' : `${currentPlan} Plan`}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-md">
                    {formatPlanDescription(currentPlan)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {currentPlan === 'Yearly' ? 'Yearly' : currentPlan === 'Monthly' ? 'Monthly' : 'No active billing'}
                  </p>
                  <p className="font-display font-bold text-2xl text-on-surface mt-1">{planPrice}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-sm text-on-surface">Choose a plan</h5>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Full Instagram automation — pick monthly flexibility or save with yearly billing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {billingOptions.map((planKey) => {
                const plan = PLAN_CATALOG[planKey];
                const isCurrent = currentPlan === planKey;
                const isBusy = billingBusy === planKey;

                return (
                  <div
                    key={planKey}
                    className={`rounded-2xl overflow-hidden border flex flex-col ${
                      plan.highlighted
                        ? 'border-primary shadow-md shadow-primary/10'
                        : 'border-surface-container'
                    }`}
                  >
                    {plan.badge && (
                      <div
                        className={`text-center py-2.5 font-bold text-[10px] uppercase tracking-widest ${
                          plan.highlighted
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        {plan.badge}
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1 gap-4">
                      <div>
                        <h4 className="font-display font-bold text-xl text-on-surface">{plan.label}</h4>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{plan.description}</p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display font-bold text-3xl text-primary">{plan.priceLabel}</span>
                        <span className="text-sm text-on-surface-variant font-medium">{plan.cycleLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpgradePlan(planKey)}
                        disabled={isCurrent || billingBusy !== null}
                        className={`w-full py-3 rounded-xl font-semibold text-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                          plan.highlighted
                            ? 'bg-primary text-white shadow-md hover:shadow-lg'
                            : 'border border-outline-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…
                          </>
                        ) : isCurrent ? (
                          'Current plan'
                        ) : planKey === 'Yearly' ? (
                          'Get Yearly Plan'
                        ) : (
                          'Start Monthly Plan'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Secure billing powered by Razorpay. UPI, cards, and net banking accepted.
            </p>
          </div>
        )}
      </div>

      <WorkspaceFooter />

      <AnimatePresence>
        {isDisconnectModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDisconnectModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-surface-container max-w-md w-full p-8 shadow-2xl relative z-10"
            >
              <button
                type="button"
                onClick={() => setIsDisconnectModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-outline hover:bg-surface-container-low rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg text-on-surface">
                    Disconnect Instagram?
                  </h3>
                  <p className="text-on-surface-variant text-xs leading-relaxed">
                    This will deactivate automations for this account until you reconnect via Meta.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDisconnectModalOpen(false)}
                    className="flex-1 border border-outline-variant py-3 rounded-xl font-semibold text-xs hover:bg-surface-container-low"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDisconnectModalOpen(false);
                      onDisconnectInstagram();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-3 rounded-xl"
                  >
                    Yes, Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
