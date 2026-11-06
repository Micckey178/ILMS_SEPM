import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Download,
  WifiOff,
  Building2,
  QrCode,
  LogOut,
  ChevronDown,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  User,
  Settings,
  Shield,
  Sliders,
  Cloud,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';
import { InAppNotification, Laboratory } from '../types';
import { DataService, CloudSyncStatus } from '../services/dataService';
import { FirebaseSyncModal } from './FirebaseSyncModal';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenQRScanner: () => void;
  onOpenCommandPalette: () => void;
  onOpenOnboarding?: () => void;
  notifications: InAppNotification[];
  onRefreshNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenQRScanner,
  onOpenCommandPalette,
  onOpenOnboarding,
  notifications,
  onRefreshNotifications,
}) => {
  const navigate = useNavigate();
  const {
    currentUser,
    activeLab,
    laboratories,
    allUsers,
    switchUser,
    switchLaboratory,
    logout,
    isFirebaseActive
  } = useAuth();

  const { isOnline, isInstallable, promptInstall } = usePWA();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLabMenu, setShowLabMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(DataService.getCloudSyncStatus());

  useEffect(() => {
    const unsub = DataService.subscribeCloudSync(setSyncStatus);
    DataService.checkCloudSync();
    return () => unsub();
  }, []);

  // Mobile touch scrolling handlers so touching/swiping title bar scrolls smoothly
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY.current - currentY;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop += diffY;
      touchStartY.current = currentY;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await DataService.markNotificationRead(id);
    onRefreshNotifications();
  };

  // All 11 CSE Department Laboratories
  const authorizedLabs = laboratories.filter(lab => lab.id !== 'lab-chem-01');

  const searchedLabs = authorizedLabs.filter(lab =>
    lab.name.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    lab.code.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    lab.type.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
    lab.building.toLowerCase().includes(labSearchQuery.toLowerCase())
  );

  return (
    <header
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E9DDF1] text-[#332B40] shadow-sm transition-colors no-print w-full"
    >
      <div className="px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        {/* LEFT: Mobile hamburger & ILMS Academic Branding */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-[#FFF8F2] lg:hidden transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo with Lavender-Peach Gradient */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/app-logo-v2.png"
              alt="ILMS Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain shadow-xs hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-black text-base text-[#332B40] tracking-tight">
                  ILMS
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/40">
                  Lab OS
                </span>
              </div>
              <p className="text-[10px] font-semibold text-[#71667D] leading-none">
                Intelligent University Management
              </p>
            </div>
          </div>
        </div>

        {/* MIDDLE: GLOBAL SEARCH BAR (Responsive on Phones) */}
        <div className="flex-1 max-w-2xl mx-1 sm:mx-6 min-w-0">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] hover:border-[#BCA0F5] text-[#71667D] text-xs sm:text-sm transition group shadow-inner min-w-0"
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2 truncate min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8961D8] shrink-0 group-hover:scale-110 transition" />
              <span className="truncate text-left hidden md:inline">Search laboratories, equipment, inventory, faculty...</span>
              <span className="truncate text-left inline md:hidden text-xs">Search...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-white border border-[#E9DDF1] rounded-lg text-[#71667D] shadow-sm shrink-0">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* RIGHT: Top-Right Lab Selector, QR Scan, Notifications, User Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            title={
              syncStatus.state === 'permission_denied'
                ? 'Firebase Firestore writes blocked by security rules. Click to fix.'
                : syncStatus.state === 'synced'
                ? 'Firebase Cloud Firestore Connected'
                : 'Firebase Cloud Sync Status'
            }
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
              syncStatus.state === 'permission_denied'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
                : syncStatus.state === 'synced'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-[#FFF8F2] border border-[#E9DDF1] text-[#71667D] hover:bg-[#F0E9FF]'
            }`}
          >
            <Cloud className={`w-3.5 h-3.5 ${syncStatus.state === 'permission_denied' ? 'text-amber-600' : syncStatus.state === 'synced' ? 'text-emerald-600' : 'text-[#8961D8]'}`} />
            <span className="hidden sm:inline">
              {syncStatus.state === 'permission_denied'
                ? 'Firebase Blocked'
                : syncStatus.state === 'synced'
                ? 'Cloud Synced'
                : 'Cloud Sync'}
            </span>
            {syncStatus.state === 'permission_denied' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping sm:hidden" />
            )}
          </button>

          {/* Quick QR Scanner Shortcut */}
          <button
            onClick={onOpenQRScanner}
            title="Scan QR Code / Barcode"
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5]/50 text-[#8961D8] hover:bg-[#BCA0F5] hover:text-white text-xs font-semibold transition shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden lg:inline">Scan QR</span>
          </button>

          {/* PWA Install Button (if eligible) */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              title="Install ILMS as PWA App"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] text-[#332B40] hover:bg-[#F0E9FF] text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5 text-[#8961D8]" />
              <span className="hidden lg:inline">Install App</span>
            </button>
          )}

          {/* TOP-RIGHT LABORATORY SELECTOR */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLabMenu(!showLabMenu);
                setShowUserMenu(false);
                setShowNotifMenu(false);
              }}
              className="flex items-center space-x-1.5 sm:space-x-2.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-[#FFF8F2] hover:bg-[#F0E9FF] border border-[#E9DDF1] hover:border-[#BCA0F5] transition text-xs sm:text-sm font-semibold text-[#332B40] shadow-sm shrink-0"
            >
              <div className="w-6 h-6 rounded-lg bg-[#8961D8] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left max-w-[60px] xs:max-w-[80px] sm:max-w-[180px] truncate">
                <span className="text-[8px] sm:text-[10px] text-[#71667D] block uppercase font-bold tracking-wider leading-none">
                  Lab
                </span>
                <span className="font-heading font-bold text-xs sm:text-sm text-[#332B40] truncate block">
                  {activeLab ? activeLab.name : 'Select Lab'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-[#8961D8] ml-0.5 shrink-0" />
            </button>

            {/* Rich Searchable Laboratory Cards Popover — Responsive on Phones */}
            {showLabMenu && (
              <div className="fixed sm:absolute right-2 sm:right-0 mt-2.5 w-[calc(100vw-16px)] sm:w-96 max-w-md bg-white dark:bg-slate-900 border border-[#E9DDF1] dark:border-slate-800 rounded-3xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-border dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Authorized Laboratories ({authorizedLabs.length})
                    </span>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Role: {currentUser.role}
                    </span>
                  </div>
                  {/* Search Filter Inside Dropdown */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={labSearchQuery}
                      onChange={e => setLabSearchQuery(e.target.value)}
                      placeholder="Search facility name or code..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto px-2 py-2 space-y-1.5">
                  {searchedLabs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No matching laboratories found.
                    </div>
                  ) : (
                    searchedLabs.map((lab: Laboratory) => {
                      const isCurrent = activeLab?.id === lab.id;
                      return (
                        <button
                          key={lab.id}
                          onClick={() => {
                            switchLaboratory(lab.id);
                            setShowLabMenu(false);
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition border ${
                            isCurrent
                              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-600 text-purple-950 dark:text-purple-100 shadow-sm'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent text-foreground dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground dark:text-white flex items-center gap-1.5">
                              {lab.name}
                              {isCurrent && (
                                <CheckCircle2 className="w-4 h-4 text-purple-600 inline" />
                              )}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-muted-foreground border border-border dark:border-slate-700">
                              {lab.code}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span>{lab.building} ({lab.roomNumber})</span>
                            <span>•</span>
                            <span className="capitalize">{lab.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-medium">Active</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
                setShowLabMenu(false);
              }}
              className="p-1.5 sm:p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 relative transition shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-500 text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="fixed sm:absolute right-2 sm:right-0 mt-2.5 w-[calc(100vw-16px)] sm:w-96 max-w-md bg-white dark:bg-slate-900 border border-[#E9DDF1] dark:border-slate-800 rounded-3xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-border dark:border-slate-800 flex items-center justify-between text-xs font-bold text-foreground dark:text-slate-200">
                  <span className="uppercase tracking-wider text-muted-foreground">Notifications</span>
                  <span className="text-purple-600 font-semibold">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border/50 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No new notifications for your assigned role.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3.5 text-xs cursor-pointer transition ${
                          n.read ? 'bg-transparent text-muted-foreground' : 'bg-purple-50/40 dark:bg-purple-950/20 text-foreground dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-sm font-bold text-foreground dark:text-white">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Role Switcher */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowLabMenu(false);
                setShowNotifMenu(false);
              }}
              className="flex items-center space-x-1.5 sm:space-x-2.5 p-1 sm:px-3 sm:py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800 border border-border dark:border-slate-700 hover:border-purple-400 transition"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm">
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-sm font-bold text-[#172033] block leading-none">
                  {currentUser.displayName.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block mt-0.5">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="fixed sm:absolute right-2 sm:right-0 mt-2.5 w-[calc(100vw-16px)] sm:w-84 max-w-sm bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-[#E4E7F0]">
                  <p className="text-sm font-bold text-[#172033]">{currentUser.displayName}</p>
                  <p className="text-xs text-[#5B6478] truncate">{currentUser.email}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                    <span className="text-[11px] text-[#5B6478]">ID: {currentUser.id}</span>
                  </div>
                </div>

                <div className="py-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141E34] flex items-center space-x-2.5 transition"
                  >
                    <User className="w-4 h-4 text-cyan" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141E34] flex items-center space-x-2.5 transition"
                  >
                    <Settings className="w-4 h-4 text-cyan" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141E34] flex items-center space-x-2.5 transition"
                  >
                    <Bell className="w-4 h-4 text-cyan" />
                    <span>Notification Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141E34] flex items-center space-x-2.5 transition"
                  >
                    <Shield className="w-4 h-4 text-cyan" />
                    <span>Security and Password</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/laboratories');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141E34] flex items-center space-x-2.5 transition"
                  >
                    <Building2 className="w-4 h-4 text-cyan" />
                    <span>Assigned Laboratories</span>
                  </button>

                  {onOpenOnboarding && (
                    <button
                      onClick={() => {
                        onOpenOnboarding();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center space-x-2.5 transition"
                    >
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      <span>Help and Support (Tour)</span>
                    </button>
                  )}
                </div>

                {/* Quick Profile Switcher */}
                <div className="border-t border-border dark:border-slate-800 mt-1 pt-2 px-3 pb-1">
                  <p className="text-[10px] font-bold text-[#71667D] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Quick Switch Account:</span>
                    <span className="text-[9px] text-[#8961D8]">Instant Preview</span>
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        switchUser('usr-admin-01');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        currentUser.role === 'admin'
                          ? 'bg-purple-100 text-purple-900 font-black'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">🏛️ Mehekha C (Admin)</span>
                      <span className="text-[10px] font-mono text-purple-700 shrink-0 font-black">All Labs</span>
                    </button>

                    <button
                      onClick={() => {
                        switchUser('usr-hod-01');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        currentUser.displayName?.includes('Roopa')
                          ? 'bg-purple-100 text-purple-900 font-black'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">👩‍🏫 Dr. Roopa M J (HOD)</span>
                      <span className="text-[10px] font-mono text-purple-700 shrink-0">HOD</span>
                    </button>

                    <button
                      onClick={() => {
                        switchUser('usr-fac-01');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        currentUser.role === 'faculty' && !currentUser.displayName?.includes('Roopa')
                          ? 'bg-purple-100 text-purple-900 font-black'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">👨‍🏫 Prof. Rajesh Kumar (Faculty)</span>
                      <span className="text-[10px] font-mono text-cyan-700 shrink-0">Faculty</span>
                    </button>

                    <button
                      onClick={() => {
                        switchUser('usr-tech-01');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        currentUser.role === 'technician' || currentUser.role === 'labManager'
                          ? 'bg-purple-100 text-purple-900 font-black'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">🔧 Elena Alvarez (Lab Manager & Tech)</span>
                      <span className="text-[10px] font-mono text-amber-700 shrink-0">Tech / Mgr</span>
                    </button>

                    <button
                      onClick={() => {
                        switchUser('usr-stud-01');
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        currentUser.role === 'student'
                          ? 'bg-purple-100 text-purple-900 font-black'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">🎓 Kavya N (Student)</span>
                      <span className="text-[10px] font-mono text-emerald-700 shrink-0">Student</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-border dark:border-slate-800 mt-1 pt-1.5 px-2">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold flex items-center space-x-2.5 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Firebase Permission Denied Warning Banner */}
      {syncStatus.state === 'permission_denied' && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-3 py-1.5 text-[11px] sm:text-xs flex items-center justify-between font-medium shadow-inner animate-in fade-in">
          <div className="flex items-center space-x-2 truncate">
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 font-bold uppercase tracking-wider text-[9px] shrink-0">
              Firebase Notice
            </span>
            <span className="truncate">
              New uploads are staying in browser memory because Firestore rules in Firebase Console are blocking writes.
            </span>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="shrink-0 underline hover:no-underline font-bold text-[11px] ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition cursor-pointer"
          >
            Fix in 1 Minute →
          </button>
        </div>
      )}

      {/* Cloud Sync Diagnostic & Recovery Modal */}
      <FirebaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </header>
  );
};
