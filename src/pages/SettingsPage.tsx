import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Bell,
  Palette,
  Eye,
  Clock,
  Save,
  CheckCircle2,
  Lock,
  Building,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, isFirebaseConfigured } from '../lib/firebase/firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { applyTheme, getSavedTheme, ThemeMode } from '../utils/themeManager';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');

  // Profile form state
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [phone, setPhone] = useState(currentUser.phoneNumber || '+91 98765 43210');
  const [department, setDepartment] = useState(currentUser.departmentId || 'Computer Science');
  const [photoUrl, setPhotoUrl] = useState(currentUser.avatarUrl || '');

  // Password / Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification preferences
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyMaintenance, setNotifyMaintenance] = useState(true);
  const [notifyIncidents, setNotifyIncidents] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(false);

  // Display & Accessibility preferences
  const [themeMode, setThemeMode] = useState<ThemeMode>(getSavedTheme());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');

  useEffect(() => {
    const handleThemeChangeEvt = (e: any) => {
      setThemeMode(e.detail || getSavedTheme());
    };
    window.addEventListener('ilms:theme-change', handleThemeChangeEvt);
    return () => window.removeEventListener('ilms:theme-change', handleThemeChangeEvt);
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    applyTheme(newTheme);
    setStatusMessage(`Application theme switched to "${newTheme.toUpperCase()}".`);
  };

  // Feedback state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isFirebaseConfigured() && auth && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL: photoUrl || undefined
        });
      }

      // Update local storage representation
      currentUser.displayName = displayName;
      currentUser.avatarUrl = photoUrl;
      currentUser.phoneNumber = phone;

      setStatusMessage('Profile information saved and synchronized with your Firebase identity.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isFirebaseConfigured() && auth && auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      setStatusMessage('Password updated successfully. Please use your new password next time you sign in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Security update failed. You may need to sign out and back in before changing password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    applyTheme(themeMode);
    localStorage.setItem('ilms_pref_reduced_motion', String(reducedMotion));
    localStorage.setItem('ilms_pref_time_format', timeFormat);
    localStorage.setItem('ilms_pref_date_format', dateFormat);
    setStatusMessage(`Preferences saved. Application theme set to "${themeMode.toUpperCase()}".`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-surface-textDark dark:text-white">
          Account Settings & Preferences
        </h1>
        <p className="text-sm text-surface-textMuted mt-1">
          Manage your personal university profile, credentials, notification channels, and accessibility options.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E4E7F0] pb-2">
        <button
          onClick={() => { setActiveTab('profile'); setStatusMessage(null); setErrorMessage(null); }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'profile'
              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm font-extrabold'
              : 'text-[#5B6478] hover:text-[#172033] hover:bg-[#F5F6FC]'
          }`}
        >
          <User className="w-4 h-4 text-cyan-700" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => { setActiveTab('security'); setStatusMessage(null); setErrorMessage(null); }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'security'
              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm font-extrabold'
              : 'text-[#5B6478] hover:text-[#172033] hover:bg-[#F5F6FC]'
          }`}
        >
          <Shield className="w-4 h-4 text-cyan-700" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => { setActiveTab('notifications'); setStatusMessage(null); setErrorMessage(null); }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'notifications'
              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm font-extrabold'
              : 'text-[#5B6478] hover:text-[#172033] hover:bg-[#F5F6FC]'
          }`}
        >
          <Bell className="w-4 h-4 text-cyan-700" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => { setActiveTab('preferences'); setStatusMessage(null); setErrorMessage(null); }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'preferences'
              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm font-extrabold'
              : 'text-[#5B6478] hover:text-[#172033] hover:bg-[#F5F6FC]'
          }`}
        >
          <Palette className="w-4 h-4 text-cyan-700" />
          <span>Themes & Appearance</span>
        </button>
      </div>

      {/* Messages */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-navy-card border border-border dark:border-navy-border rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center space-x-4 border-b border-border dark:border-navy-border pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-navy to-cyan text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-surface-textDark dark:text-white">
                {currentUser.displayName}
              </h2>
              <p className="text-xs text-surface-textMuted">{currentUser.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
                  {currentUser.role}
                </span>
                <span className="text-[11px] text-surface-textMuted font-mono">
                  ID: {currentUser.institutionId || currentUser.id}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-textDark dark:text-surface-textMuted mb-1.5">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border rounded-2xl px-4 py-2.5 text-sm text-surface-textDark dark:text-white outline-none focus:border-cyan transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-textDark dark:text-surface-textMuted mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border rounded-2xl px-4 py-2.5 text-sm text-surface-textDark dark:text-white outline-none focus:border-cyan transition font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-textDark dark:text-surface-textMuted mb-1.5">
                  Institutional Email (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-border dark:border-navy-border rounded-2xl px-4 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-surface-textMuted mt-1 block">
                  Email identity is protected by Firebase Authentication and cannot be changed arbitrarily.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-textDark dark:text-surface-textMuted mb-1.5">
                  Academic Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border rounded-2xl px-4 py-2.5 text-sm text-surface-textDark dark:text-white outline-none focus:border-cyan transition font-medium"
                />
              </div>
            </div>

            {/* Read-Only Protected Institutional Scope */}
            <div className="p-4 rounded-2xl bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-surface-textDark dark:text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan" />
                Protected Institutional Permissions & Scopes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-surface-textMuted">
                <div>Institution: <strong className="text-surface-textDark dark:text-white">{currentUser.institution || 'Main University Campus'}</strong></div>
                <div>Approved Role: <strong className="text-surface-textDark dark:text-white capitalize">{currentUser.role}</strong></div>
                <div>Status: <strong className="text-emerald-600 capitalize">{currentUser.status || 'Active'}</strong></div>
              </div>
              <p className="text-[10px] text-surface-textMuted">
                Note: Institutional roles and lab authorization scopes are locked by administrator policy and cannot be altered from this panel.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition flex items-center space-x-2"
              >
                <Save className="w-4 h-4 text-[#172033]" />
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white border border-[#E4E7F0] rounded-3xl p-6 sm:p-8 shadow-card space-y-6 text-[#172033]">
          <div>
            <h3 className="font-heading font-black text-lg text-[#172033]">
              Password & Authentication Security
            </h3>
            <p className="text-xs text-[#5B6478]">
              Ensure your university account is protected with a strong passphrase.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-4 py-2.5 text-sm text-[#172033] outline-none focus:border-[#18BDF5] transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-4 py-2.5 text-sm text-[#172033] outline-none focus:border-[#18BDF5] transition font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition flex items-center space-x-2"
              >
                <Lock className="w-4 h-4 text-[#172033]" />
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-navy-card border border-border dark:border-navy-border rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-surface-textDark dark:text-white">
              Notification Preferences
            </h3>
            <p className="text-xs text-surface-textMuted">
              Select which laboratory notifications you wish to receive in-app and by summary email.
            </p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border cursor-pointer">
              <input
                type="checkbox"
                checked={notifyBookings}
                onChange={e => setNotifyBookings(e.target.checked)}
                className="mt-0.5 rounded text-cyan focus:ring-cyan"
              />
              <div>
                <span className="font-bold text-surface-textDark dark:text-white block">
                  Equipment Booking Confirmations & Rejections
                </span>
                <span className="text-[11px] text-surface-textMuted">
                  Alerts when your reserved slots are reviewed, approved, or rescheduled.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border cursor-pointer">
              <input
                type="checkbox"
                checked={notifyLowStock}
                onChange={e => setNotifyLowStock(e.target.checked)}
                className="mt-0.5 rounded text-cyan focus:ring-cyan"
              />
              <div>
                <span className="font-bold text-surface-textDark dark:text-white block">
                  Critical Low Stock & Reorder Triggers
                </span>
                <span className="text-[11px] text-surface-textMuted">
                  Real-time notification when chemical reagents or lab consumables drop below safety reserve.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border cursor-pointer">
              <input
                type="checkbox"
                checked={notifyMaintenance}
                onChange={e => setNotifyMaintenance(e.target.checked)}
                className="mt-0.5 rounded text-cyan focus:ring-cyan"
              />
              <div>
                <span className="font-bold text-surface-textDark dark:text-white block">
                  Maintenance & Calibration Overdues
                </span>
                <span className="text-[11px] text-surface-textMuted">
                  Reminders for equipment inspections, fume hood certifications, and instrument servicing.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#F5F6FC] dark:bg-navy border border-border dark:border-navy-border cursor-pointer">
              <input
                type="checkbox"
                checked={notifyIncidents}
                onChange={e => setNotifyIncidents(e.target.checked)}
                className="mt-0.5 rounded text-cyan focus:ring-cyan"
              />
              <div>
                <span className="font-bold text-surface-textDark dark:text-white block">
                  Safety Incident & EHS Hazard Alerts
                </span>
                <span className="text-[11px] text-surface-textMuted">
                  Immediate dispatches regarding spill containment, equipment failure, or evacuation drills.
                </span>
              </div>
            </label>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStatusMessage('Notification channel preferences saved.')}
                className="px-6 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition flex items-center space-x-2"
              >
                <Save className="w-4 h-4 text-[#172033]" />
                <span>Save Notification Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THEME & ACCESSIBILITY */}
      {activeTab === 'preferences' && (
        <div className="bg-white border border-[#E4E7F0] rounded-3xl p-6 sm:p-8 shadow-card space-y-6 text-[#172033]">
          <div>
            <h3 className="font-heading font-black text-lg text-[#172033]">
              Display, Accessibility & Regional Preferences
            </h3>
            <p className="text-xs text-[#5B6478]">
              Customize visual ergonomics and display formatting.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 max-w-md text-xs">
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1">
                Application Theme Mode (Click to Apply Instantly)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Luna Pastel (Default) */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('luna')}
                  className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                    themeMode === 'luna'
                      ? 'border-[#8961D8] bg-[#F0E9FF] shadow-md ring-2 ring-[#BCA0F5]'
                      : 'border-[#E9DDF1] bg-[#FFF8F2] hover:border-[#BCA0F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#332B40]">Luna Pastel</span>
                    <div className="flex space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FFF8F2] border border-[#E9DDF1]" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#BCA0F5]" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FFD2BF]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#71667D]">
                    Soft lavender, peach, warm cream, and deep purple text.
                  </p>
                  {themeMode === 'luna' && (
                    <span className="text-[10px] font-black uppercase text-[#8961D8] mt-2 block">
                      ✓ Active Theme
                    </span>
                  )}
                </button>

                {/* 2. Pure Dark Mode */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                    themeMode === 'dark'
                      ? 'border-[#BCA0F5] bg-[#2E253E] text-white shadow-md ring-2 ring-[#8961D8]'
                      : 'border-slate-800 bg-[#241D30] text-slate-200 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">Pure Dark Mode</span>
                    <div className="flex space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#241D30] border border-slate-700" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#8961D8]" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#3BAA83]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Deep purple-slate surfaces, high-contrast text, and reduced glare.
                  </p>
                  {themeMode === 'dark' && (
                    <span className="text-[10px] font-black uppercase text-[#BCA0F5] mt-2 block">
                      ✓ Active Theme
                    </span>
                  )}
                </button>

                {/* 3. High-Contrast Light */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                    themeMode === 'light'
                      ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-300'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">High-Contrast Light</span>
                    <div className="flex space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600" />
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-800" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Crisp white background with dark typography and standard borders.
                  </p>
                  {themeMode === 'light' && (
                    <span className="text-[10px] font-black uppercase text-blue-700 mt-2 block">
                      ✓ Active Theme
                    </span>
                  )}
                </button>

                {/* 4. System Default */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                    themeMode === 'system'
                      ? 'border-[#8961D8] bg-[#F0E9FF] shadow-md ring-2 ring-[#BCA0F5]'
                      : 'border-slate-200 bg-white hover:border-[#BCA0F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#332B40]">System Default</span>
                    <div className="flex space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-300" />
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-700" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#71667D]">
                    Automatically switches according to your device's operating system mode.
                  </p>
                  {themeMode === 'system' && (
                    <span className="text-[10px] font-black uppercase text-[#8961D8] mt-2 block">
                      ✓ Active Theme
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                Time Display Format
              </label>
              <select
                value={timeFormat}
                onChange={e => setTimeFormat(e.target.value as any)}
                className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-4 py-2.5 text-sm text-[#172033] outline-none focus:border-[#18BDF5] transition font-medium"
              >
                <option value="12h">12-Hour Clock (e.g. 02:30 PM)</option>
                <option value="24h">24-Hour International (e.g. 14:30)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                Default Currency
              </label>
              <input
                type="text"
                disabled
                value="Indian Rupee (₹) — ISO INR [Mandatory Standard]"
                className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-4 py-2.5 text-sm text-[#5B6478] font-medium cursor-not-allowed"
              />
            </div>

            <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-[#F5F6FC] border border-[#E4E7F0] cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={e => setReducedMotion(e.target.checked)}
                className="rounded text-[#18BDF5] focus:ring-[#18BDF5]"
              />
              <div>
                <span className="font-bold text-[#172033] block">
                  Reduced Motion & Minimal Animations
                </span>
                <span className="text-[11px] text-[#5B6478]">
                  Disable floating micro-animations for improved performance or accessibility.
                </span>
              </div>
            </label>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition flex items-center space-x-2"
              >
                <Save className="w-4 h-4 text-[#172033]" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
