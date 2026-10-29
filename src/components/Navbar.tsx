import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Download,
  Wifi,
  WifiOff,
  UserCheck,
  Building2,
  QrCode,
  LogOut,
  ChevronDown,
  Sparkles,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';
import { InAppNotification, UserProfile } from '../types';
import { DataService } from '../services/dataService';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenQRScanner: () => void;
  notifications: InAppNotification[];
  onRefreshNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenQRScanner,
  notifications,
  onRefreshNotifications,
}) => {
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await DataService.markNotificationRead(id);
    onRefreshNotifications();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 no-print">
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center shadow-md shadow-sky-600/30">
              <span className="font-extrabold text-sm tracking-wider text-white">ILMS</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                ILMS
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {isFirebaseActive ? 'Firebase Live' : 'Demo Local Engine'}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 leading-none">Multi-Lab Operating System</p>
            </div>
          </div>
        </div>

        {/* Center: Laboratory Selector */}
        <div className="relative">
          <button
            onClick={() => { setShowLabMenu(!showLabMenu); setShowUserMenu(false); setShowNotifMenu(false); }}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition text-xs font-medium text-slate-200"
          >
            <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-left hidden md:block max-w-[180px] truncate">
              <span className="text-slate-400 text-[10px] block leading-none">ACTIVE LABORATORY</span>
              <span className="font-semibold text-slate-100 text-xs truncate">
                {activeLab ? activeLab.name : 'Select Lab'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showLabMenu && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Authorized Laboratories ({laboratories.length})
              </div>
              <div className="max-h-72 overflow-y-auto">
                {laboratories.map((lab) => {
                  const isCurrent = activeLab?.id === lab.id;
                  return (
                    <button
                      key={lab.id}
                      onClick={() => { switchLaboratory(lab.id); setShowLabMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col space-y-0.5 transition ${
                        isCurrent
                          ? 'bg-sky-500/15 border-l-2 border-sky-400 text-sky-200'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">{lab.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded font-mono text-slate-300 border border-slate-700">
                          {lab.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{lab.building} ({lab.roomNumber})</span>
                        <span>•</span>
                        <span className="capitalize">{lab.type.replace('_', ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick QR Scanner, Network status, Notifications, Role Switcher */}
        <div className="flex items-center space-x-2">
          {/* Quick QR Scan Button */}
          <button
            onClick={onOpenQRScanner}
            title="Scan QR Code / Barcode"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-300 hover:bg-sky-600/30 text-xs font-medium transition"
          >
            <QrCode className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          {/* Network Connection Badge */}
          <div
            title={isOnline ? 'Online: System synced' : 'Offline: Operating on local cached assets'}
            className="flex items-center p-1.5 rounded-lg text-slate-400"
          >
            {isOnline ? (
              <span className="flex items-center space-x-1 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="hidden xl:inline">Online</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[11px] text-amber-400">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Offline</span>
              </span>
            )}
          </div>

          {/* PWA Install Button */}
          <button
            onClick={promptInstall}
            title="Install ILMS Mobile / Desktop App"
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 text-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Install App</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); setShowLabMenu(false); }}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>In-App Notifications</span>
                  <span className="text-[10px] text-sky-400">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No recent notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3 text-xs cursor-pointer transition ${
                          n.read ? 'bg-transparent text-slate-400' : 'bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-100">{n.title}</span>
                          <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowLabMenu(false); setShowNotifMenu(false); }}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition text-xs"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 flex items-center justify-center text-slate-900 font-bold text-xs">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-slate-100 font-medium block leading-none">{currentUser.displayName.split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-sky-400 uppercase leading-none">{currentUser.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-100">{currentUser.displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1 flex items-center space-x-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-semibold uppercase border border-sky-500/30">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-slate-500">ID: {currentUser.id}</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (Demo Mode)
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { switchUser(u.id); setShowUserMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition ${
                        u.id === currentUser.id ? 'bg-sky-500/15 text-sky-200 font-medium' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate font-medium">{u.displayName}</span>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300 uppercase shrink-0 ml-2">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 mt-2 pt-1">
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset / Switch to Student View</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
