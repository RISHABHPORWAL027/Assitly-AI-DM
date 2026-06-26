import React from 'react';
import {
  Bot,
  Users,
  Settings,
  Plus,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  Link2,
  Lock,
} from 'lucide-react';
import { ScreenType } from '../types';
import Header from './Header';

type NavItem = {
  name: string;
  id: ScreenType;
  tab?: 'general' | 'instagram' | 'billing';
};

interface WorkspaceShellProps {
  screen: ScreenType;
  setScreen: (s: ScreenType) => void;
  settingsTab: 'general' | 'instagram' | 'billing';
  setSettingsTab: (t: 'general' | 'instagram' | 'billing') => void;
  navItems: NavItem[];
  isInstagramConnected: boolean;
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  instagramProfilePic?: string;
  onLogout?: () => void;
  onDisconnectInstagram?: () => void;
  onCreateNew?: () => void;
  onConnectInstagram?: () => void;
  connectingInstagram?: boolean;
  breadcrumbLeaf: string;
  children: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  automations: <Bot className="w-5 h-5" />,
  contacts: <Users className="w-5 h-5" />,
  settings: <Settings className="w-5 h-5" />,
};

export default function WorkspaceShell({
  screen,
  setScreen,
  settingsTab,
  setSettingsTab,
  navItems,
  isInstagramConnected,
  user,
  instagramProfilePic,
  onLogout,
  onDisconnectInstagram,
  onCreateNew,
  onConnectInstagram,
  connectingInstagram = false,
  breadcrumbLeaf,
  children,
}: WorkspaceShellProps) {
  const displayName = user?.displayName || 'Your account';
  const avatarSrc = instagramProfilePic || user?.photoURL;

  return (
    <div className="flex flex-1 min-h-0 w-full bg-background">
      {/* Sidebar — matches reference HTML */}
      <aside
        className="h-full w-[240px] hidden md:flex flex-col fixed left-0 top-0 bg-surface-container-lowest shadow-sm z-50"
        id="workspace-sidebar"
      >
        <div className="flex flex-col h-full py-6 gap-4">
          <div className="px-6 flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="AssistlyDM logo"
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="font-display text-lg font-bold text-primary leading-tight">AssistlyDM</h1>
              <p className="text-[10px] uppercase tracking-widest text-outline font-semibold leading-none mt-0.5">
                Automation Hub
              </p>
            </div>
          </div>

          {!isInstagramConnected && (
            <button
              type="button"
              onClick={onConnectInstagram}
              disabled={connectingInstagram}
              className="mx-6 btn-instagram py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Link2 className="w-4 h-4" />
              {connectingInstagram ? 'Connecting…' : 'Connect Instagram'}
            </button>
          )}

          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = item.tab
                ? screen === item.id && settingsTab === item.tab
                : screen === item.id;
              const isDisabled = !isInstagramConnected && item.id !== 'automations';

              return (
                <button
                  key={item.name}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      setScreen(item.id);
                      if (item.tab) setSettingsTab(item.tab);
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-low'
                      : isDisabled
                      ? 'text-on-surface-variant/40 cursor-not-allowed'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {iconMap[item.id] || item.name}
                  <span className="text-base flex-1 text-left">{item.name}</span>
                  {isDisabled && <Lock className="w-3.5 h-3.5 opacity-50" />}
                </button>
              );
            })}
          </nav>

          {onCreateNew && (
            <div className="px-4 mt-auto">
              <button
                type="button"
                onClick={onCreateNew}
                className="w-full bg-primary text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                Create New
              </button>
            </div>
          )}

          {isInstagramConnected && (
            <div className="mx-4 flex items-center gap-3 px-3 py-2.5 bg-surface-container rounded-xl">
              <img
                src={instagramProfilePic || '/default-instagram-avatar.png'}
                alt="Instagram avatar"
                className="w-9 h-9 shrink-0 rounded-full object-cover border border-outline-variant/30"
              />
              <span className="text-sm text-on-surface-variant truncate">Instagram Account</span>
            </div>
          )}
        </div>
        
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-[240px] min-h-0 flex flex-col w-full">
        <header className="w-full h-16 flex items-center sticky top-0 z-40 bg-surface px-6 shrink-0 border-b border-surface-container">
          <div className="flex justify-between items-center w-full">
            <div className="md:hidden flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-display text-lg font-bold text-primary">AssistlyDM</span>
            </div>

            <div className="hidden md:flex items-center">
              <span className="text-sm font-semibold text-on-surface">{breadcrumbLeaf}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-surface-container rounded-full px-4 py-2 gap-2 text-outline focus-within:text-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="w-4 h-4" />
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm w-36 outline-none placeholder:text-outline"
                  placeholder="Search..."
                  type="text"
                  readOnly
                  aria-label="Global search"
                />
              </div>
              <button
                type="button"
                className="hover:bg-surface-container-high rounded-full p-2 transition-all text-on-surface-variant"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="hover:bg-surface-container-high rounded-full p-2 transition-all text-on-surface-variant"
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="h-8 w-px bg-outline-variant mx-1" />
              <div className="flex items-center gap-3 group relative">
                <button
                  type="button"
                  className="flex items-center gap-3 cursor-pointer hover:bg-surface-container px-2 py-1 rounded-lg transition-all"
                >
                  <Header />
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-outline hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
