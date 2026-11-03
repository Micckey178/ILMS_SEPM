import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Building2,
  Calendar,
  Boxes,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GuidedOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedOnboardingModal: React.FC<GuidedOnboardingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, activeLab } = useAuth();
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const roleNameMap: Record<string, string> = {
    admin: 'Institutional Administrator',
    lab_manager: 'Laboratory Manager',
    faculty: 'Faculty & Lead Researcher',
    technician: 'Laboratory Technician',
    student: 'Student / Scholar'
  };

  const steps = [
    {
      title: `Welcome to ILMS, ${currentUser.displayName.split(' ')[0]}!`,
      subtitle: `Configured for your authorized role as ${roleNameMap[currentUser.role] || currentUser.role}`,
      icon: Sparkles,
      gradient: 'from-[#9333EA] to-[#4F7DFF]',
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            ILMS is your multi-facility laboratory operating platform. All your inventory, asset maintenance, student session logs, and safety records are synchronized live with Firebase.
          </p>
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-medium">
            Active Workspace: <strong>{activeLab ? activeLab.name : 'Universal Multi-Lab Engine'}</strong>
          </div>
        </div>
      )
    },
    {
      title: 'Top-Right Laboratory Selector',
      subtitle: 'Seamless facility switching with granular role-based authorization',
      icon: Building2,
      gradient: 'from-blue-600 to-indigo-600',
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Notice the <strong>Active Laboratory Selector</strong> located at the top-right of the navigation bar next to your notifications and profile.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Switch between chemistry, physics, electronics, and AI computing laboratories.</li>
            <li>All dashboards, booking schedules, and inventory levels automatically update to match your active facility.</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Quick Actions & QR Scanner',
      subtitle: 'Scan physical equipment barcodes or press Ctrl+K anywhere',
      icon: QrCode,
      gradient: 'from-purple-600 to-pink-600',
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Use the <strong>Scan QR</strong> button or mobile floating scanner to instantly identify equipment, check asset passports, record loans, or file maintenance fault tickets.
          </p>
          <p className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-foreground dark:text-slate-200">
            Pro-tip: Press <strong>Ctrl + K</strong> at any time to open the global command palette.
          </p>
        </div>
      )
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Banner with vibrant gradient */}
        <div className={`p-6 bg-gradient-to-r ${current.gradient} text-white flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Step {step + 1} of {steps.length}
              </span>
              <h3 className="font-heading font-extrabold text-xl text-white">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            {current.subtitle}
          </p>
          {current.content}
        </div>

        {/* Progress Dots & Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-border dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#4F7DFF] hover:opacity-90 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-purple-500/25"
            >
              <span>{step === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
