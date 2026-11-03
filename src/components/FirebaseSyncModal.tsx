import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Database,
  ArrowRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import { DataService, CloudSyncStatus } from '../services/dataService';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIRESTORE_DEVELOPMENT_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(DataService.getCloudSyncStatus());
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = DataService.subscribeCloudSync(status => {
      setSyncStatus(status);
    });
    // Trigger initial check when opened
    if (isOpen) {
      DataService.checkCloudSync();
    }
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_DEVELOPMENT_RULES);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestAndSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await DataService.syncAllLocalDataToFirebase();
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: `🎉 Success! Pushed ${res.count} records (inventory, equipment, attendance, users, bookings) directly into Firebase Cloud Firestore!`
        });
      } else {
        if (res.error === 'permission_denied') {
          setSyncFeedback({
            type: 'error',
            message: 'Firebase still rejected write permissions. Make sure you clicked "Publish" in Firebase Console and wait 5 seconds before retrying.'
          });
        } else {
          setSyncFeedback({
            type: 'error',
            message: `Sync failed: ${res.error || 'Connection error'}`
          });
        }
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Unexpected error during sync'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const isBlocked = syncStatus.state === 'permission_denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-[#E9DDF1] dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-rose-50/60 dark:from-purple-950/20 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isBlocked ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  Firebase Cloud Firestore Sync
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Project: ilms-se
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live database connectivity and Firestore security rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Status Alert Banner */}
          {isBlocked ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  Writes Blocked by Firestore Rules (Permission Denied)
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  When you upload or create items in the app, Google Cloud Firestore rejects them because the database security rules in your Firebase Console are locked or require authentication. Follow the 30-second fix below to allow uploads.
                </p>
              </div>
            </div>
          ) : syncStatus.state === 'synced' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  Firebase Cloud Firestore Connected
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  New uploads, inventory changes, and attendance records are successfully written to Google Cloud Firestore in project <span className="font-mono font-bold">ilms-se</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Testing connection to Cloud Firestore...
              </span>
            </div>
          )}

          {/* Feedback banner if test / sync was run */}
          {syncFeedback && (
            <div className={`p-3.5 rounded-2xl border text-xs font-medium leading-relaxed ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
            }`}>
              {syncFeedback.message}
            </div>
          )}

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              30-Second Fix to Enable Firebase Uploads:
            </h4>

            {/* Step 1 */}
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  Open your Firebase Console Rules tab
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click the button below to navigate directly to Firestore Rules for project <span className="font-mono font-bold">ilms-se</span>.
                </p>
                <a
                  href="https://console.firebase.google.com/project/ilms-se/firestore/databases/-default-/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <span>Open Firebase Console Rules</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    Paste these Security Rules
                  </p>
                  <button
                    onClick={handleCopyRules}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 text-xs font-semibold transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Rule'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] sm:text-xs overflow-x-auto border border-slate-800">
                  {FIRESTORE_DEVELOPMENT_RULES}
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  Click the blue &ldquo;Publish&rdquo; button in Firebase Console
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Once published, Cloud Firestore will immediately accept all uploads and live updates from your app.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <span>Last checked: {syncStatus.lastChecked ? new Date(syncStatus.lastChecked).toLocaleTimeString() : 'Just now'}</span>
          </div>
          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition"
            >
              Close
            </button>
            <button
              onClick={handleTestAndSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing to Firebase...' : 'Verify & Push All Data to Cloud'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
