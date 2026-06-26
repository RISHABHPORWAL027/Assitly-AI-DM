import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Zap,
  Instagram,
  Sliders,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  X,
  MessageCircle,
  MessagesSquare,
  BadgeCheck,
  ShieldCheck,
  PlayCircle,
  SlidersHorizontal,
  Camera,
  Film,
  Inbox,
} from 'lucide-react';
import { Automation } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchAutomationStats, type AutomationStats } from '../lib/automationsApi';
import TablePagination from './TablePagination';
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from '../lib/pagination';

interface AutomationsListViewProps {
  listRefreshKey?: number;
  openCreateSignal?: number;
  onEdit: (automation: Automation) => void;
  onCreate: (triggerType: 'comment' | 'dm') => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isInstagramConnected: boolean;
  onConnectInstagram: () => void;
  connectingInstagram?: boolean;
  instagramAccountId?: string;
}

function AutomationRowIcon({ auto }: { auto: Automation }) {
  if (auto.triggerType === 'dm') {
    return (
      <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center text-white shrink-0">
        <Inbox className="w-4 h-4" />
      </div>
    );
  }
  if (auto.mediaUrl) {
    return (
      <img
        src={auto.mediaUrl}
        alt=""
        className="w-10 h-10 rounded-xl object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl instagram-bg flex items-center justify-center text-white shrink-0">
      <Film className="w-4 h-4" />
    </div>
  );
}

function automationSubtitle(auto: Automation): string {
  if (auto.triggerType === 'dm') return 'Global DM Listener';
  if (auto.caption) return `Post: "${auto.caption}"`;
  if (auto.mediaUrl) return 'Post: Active Post';
  return 'All Reels / Posts';
}

export default function AutomationsListView({
  listRefreshKey = 0,
  openCreateSignal = 0,
  onEdit,
  onCreate,
  onDelete,
  onToggleStatus,
  isInstagramConnected,
  onConnectInstagram,
  connectingInstagram = false,
  instagramAccountId,
}: AutomationsListViewProps) {
  const { getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'comment' | 'dm'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AutomationStats>({ total: 0, active: 0, comment: 0, dm: 0 });

  useEffect(() => {
    if (openCreateSignal > 0) setIsTriggerModalOpen(true);
  }, [openCreateSignal]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType, filterStatus, pageSize]);

  useEffect(() => {
    if (!isInstagramConnected || !instagramAccountId) {
      setStats({ total: 0, active: 0, comment: 0, dm: 0 });
      return;
    }
    const loadStats = async () => {
      try {
        const headers = await getAuthHeaders(instagramAccountId);
        const data = await fetchAutomationStats(headers);
        if (data) setStats(data);
      } catch (err) {
        console.error('Error fetching automation stats:', err);
      }
    };
    loadStats();
  }, [isInstagramConnected, instagramAccountId, listRefreshKey, getAuthHeaders]);

  useEffect(() => {
    if (!isInstagramConnected || !instagramAccountId) {
      setPageData([]);
      setTotalCount(0);
      return;
    }
    const fetchPageData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
          search: debouncedSearch,
          type: filterType,
          status: filterStatus,
        });
        const headers = await getAuthHeaders(instagramAccountId);
        const res = await fetch(`/api/automations?${queryParams.toString()}`, { headers });
        if (res.ok) {
          const result = await res.json();
          if (result && Array.isArray(result.automations)) {
            setPageData(result.automations);
            setTotalCount(result.total);
          }
        }
      } catch (err) {
        console.error('Error fetching paginated automations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageData();
  }, [page, pageSize, debouncedSearch, filterType, filterStatus, instagramAccountId, isInstagramConnected, listRefreshKey]);

  const activeCount = stats.active;
  const commentCount = stats.comment;
  const dmCount = stats.dm;

  const openCreate = () => setIsTriggerModalOpen(true);
  const handleCreateSelect = (type: 'comment' | 'dm') => {
    setIsTriggerModalOpen(false);
    onCreate(type);
  };

  return (
    <div className="workspace-page space-y-6" id="automations-list-container">
      {/* Hero */}
      <section className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container overflow-hidden relative group p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold uppercase tracking-wider">
                Meta Growth Engine
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
                <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Official Meta Partner
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-success-whatsapp" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Secure</span>
              </div>
            </div>

            <h2 className="font-display text-3xl lg:text-4xl font-bold text-on-surface leading-tight tracking-tight">
              AI-Powered Growth Engine
            </h2>
            <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
              Scale your Instagram engagement with verified automation. Build intelligent comment-to-DM triggers and
              smart responders that work while you sleep.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              {isInstagramConnected ? (
                <button
                  type="button"
                  onClick={openCreate}
                  id="btn-create-automation"
                  className="bg-primary text-white px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  Create New Automation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnectInstagram}
                  disabled={connectingInstagram}
                  className="bg-primary text-white px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60"
                >
                  <Instagram className="w-5 h-5" />
                  {connectingInstagram ? 'Connecting…' : 'Connect Instagram'}
                </button>
              )}
              <button
                type="button"
                className="bg-transparent border border-outline-variant text-on-surface px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-low transition-all"
              >
                <PlayCircle className="w-5 h-5" />
                View Tutorials
              </button>
            </div>
          </div>

          <div className="relative w-full lg:w-[440px] h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.01] shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-instagram-gradient-start to-instagram-gradient-end opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-36 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                <SlidersHorizontal className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3 rounded-xl flex items-center gap-4 shadow-xl">
              <div className="w-10 h-10 instagram-bg rounded-lg flex items-center justify-center text-white shadow-lg">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Live on Instagram</h4>
                <p className="text-[11px] text-on-surface-variant font-medium">DMs & comments synced</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
            <Zap className="w-24 h-24 text-primary" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
            <Zap className="w-5 h-5 fill-primary/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-on-surface">{activeCount} Active</h3>
              {activeCount > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-success-whatsapp animate-pulse" />
              )}
            </div>
            <p className="text-sm font-semibold text-on-surface-variant">Running in production</p>
            <p className="text-xs text-outline mt-2">Automations currently live</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
            <MessageCircle className="w-24 h-24 text-secondary" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-on-surface">{commentCount} Comment-to-DM</h3>
            <p className="text-sm font-semibold text-on-surface-variant">Reel & post triggers</p>
            <p className="text-xs text-outline mt-2">Comment keyword automations</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
            <MessagesSquare className="w-24 h-24 text-tertiary" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-on-surface">{dmCount} DM Responders</h3>
            <p className="text-sm font-semibold text-on-surface-variant">Inbox responders</p>
            <p className="text-xs text-outline mt-2">Keyword-triggered DM flows</p>
          </div>
        </div>
      </div>

      {!isInstagramConnected ? (
        <div className="bg-white rounded-3xl border border-surface-container p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl instagram-bg flex items-center justify-center text-white mb-4">
            <Instagram className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-on-surface">Connect Instagram to manage automations</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            Link your Instagram Business account via Meta to create and run automations.
          </p>
          <button
            type="button"
            onClick={onConnectInstagram}
            disabled={connectingInstagram}
            className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-60"
          >
            {connectingInstagram ? 'Connecting…' : 'Connect Instagram'}
            {!connectingInstagram && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm text-sm outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-surface-container-low p-1 rounded-xl flex items-center border border-outline-variant/30">
                {(['all', 'comment', 'dm'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filterType === t
                        ? 'bg-white shadow-sm text-on-surface'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'comment' ? 'Comments' : 'DMs'}
                  </button>
                ))}
              </div>
              <div className="bg-surface-container-low p-1 rounded-xl flex items-center border border-outline-variant/30">
                {(['all', 'active', 'inactive'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filterStatus === s
                        ? 'bg-white shadow-sm text-on-surface'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    {s === 'all' ? 'All States' : s === 'active' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-3xl border border-surface-container p-16 text-center text-outline text-sm">
              Loading automations…
            </div>
          ) : pageData.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-surface-container overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-lowest">
                      <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">Automation</th>
                      <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">Keywords</th>
                      <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">Performance</th>
                      <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">Status</th>
                      <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {pageData.map((auto) => {
                      const isActive = auto.status === 'active';
                      const keywordPillClass = isActive
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container text-outline';

                      return (
                        <tr
                          key={auto.id}
                          className={`table-row-hover transition-colors ${!isActive ? 'opacity-75' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <AutomationRowIcon auto={auto} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface truncate max-w-[220px]">
                                  {auto.name || 'Untitled Automation'}
                                </p>
                                <p className="text-xs text-outline truncate max-w-[220px]">
                                  {automationSubtitle(auto)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2 max-w-[200px]">
                              {auto.keywords.slice(0, 3).map((kw, i) => (
                                <span
                                  key={i}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${keywordPillClass}`}
                                >
                                  {kw === '*' ? 'All' : kw}
                                </span>
                              ))}
                              {auto.keywords.length > 3 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-outline">
                                  +{auto.keywords.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm font-semibold text-on-surface">—</p>
                                <p className="text-[11px] text-outline">Total Triggers</p>
                              </div>
                              <div className="h-8 w-px bg-outline-variant/30" />
                              <div>
                                <p className="text-sm font-semibold text-outline">—</p>
                                <p className="text-[11px] text-outline">Delivery Rate</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => onToggleStatus(auto.id)}
                                className="focus:outline-none cursor-pointer"
                                title={isActive ? 'Deactivate' : 'Activate'}
                              >
                                <div
                                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                                    isActive ? 'bg-primary' : 'bg-outline-variant'
                                  }`}
                                >
                                  <div
                                    className={`bg-white w-5 h-5 rounded-full shadow transition-transform ${
                                      isActive ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </div>
                              </button>
                              <span className="text-sm font-semibold text-on-surface-variant">
                                {isActive ? 'Active' : 'Paused'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onEdit(auto)}
                                className="p-2 hover:bg-surface-container-highest rounded-lg transition-all text-on-surface-variant"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(auto.id)}
                                className="p-2 hover:bg-error-container hover:text-on-error-container rounded-lg transition-all text-on-surface-variant"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="automations"
                variant="reference"
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-outline-variant p-16 text-center space-y-4">
              <Sliders className="w-10 h-10 mx-auto text-outline/40" />
              <p className="font-display font-bold text-on-surface">No automations found</p>
              <p className="text-xs text-on-surface-variant">Create your first automation to get started.</p>
              <button
                type="button"
                onClick={openCreate}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Set up Automation
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="py-8 text-center text-outline text-xs font-medium border-t border-surface-container mt-4">
        © {new Date().getFullYear()} AssistlyDM. Built for high-performance social business.
      </footer>

      {/* Mobile FAB */}
      {isInstagramConnected && (
        <button
          type="button"
          onClick={openCreate}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50"
          aria-label="Create automation"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Trigger modal */}
      <AnimatePresence>
        {isTriggerModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTriggerModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-surface-container max-w-2xl w-full p-8 relative z-10 text-left shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-surface-container pb-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-on-surface flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Select a Trigger Event
                  </h2>
                  <p className="text-on-surface-variant text-xs mt-1">Choose what action triggers this workflow.</p>
                </div>
                <button type="button" onClick={() => setIsTriggerModalOpen(false)} className="p-1.5 hover:bg-surface-container rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <button
                  type="button"
                  onClick={() => handleCreateSelect('comment')}
                  className="border border-outline-variant/30 rounded-2xl p-6 hover:border-primary/40 hover:shadow-md flex flex-col text-left transition-all hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl instagram-bg flex items-center justify-center text-white">
                    <Instagram className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-on-surface mt-4">Reels / Post Comments</h3>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                    Trigger auto-DMs when users comment keywords on your posts and reels.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateSelect('dm')}
                  className="border border-outline-variant/30 rounded-2xl p-6 hover:border-primary/40 hover:shadow-md flex flex-col text-left transition-all hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-on-surface mt-4">Direct Message Keywords</h3>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                    Respond when a customer sends a DM with matching keywords.
                  </p>
                </button>
              </div>
              <div className="mt-6 bg-surface-container-low rounded-2xl p-4 flex gap-2 items-start text-xs text-on-surface-variant">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong>Growth tip:</strong> Reel comment triggers with Follow Gate help grow your following organically.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
