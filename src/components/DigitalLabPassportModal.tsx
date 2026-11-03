import React from 'react';
import {
  X,
  FileCheck,
  Calendar,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Tag,
  ArrowRightLeft
} from 'lucide-react';
import { EquipmentAsset } from '../types';

interface DigitalLabPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: EquipmentAsset | null;
}

export const DigitalLabPassportModal: React.FC<DigitalLabPassportModalProps> = ({
  isOpen,
  onClose,
  asset
}) => {
  if (!isOpen || !asset) return null;

  const timelineEvents = [
    {
      date: asset.purchaseDate || '2023-01-15',
      title: 'Acquisition & Commissioning',
      type: 'acquisition',
      description: `Asset purchased for $${asset.purchaseCost || '4,500'} and assigned to laboratory storage location ${asset.location}. Initial calibration verified.`,
      icon: Tag,
      color: 'bg-blue-500'
    },
    {
      date: asset.lastMaintenanceDate || '2024-03-10',
      title: 'Periodic Maintenance & Safety Inspection',
      type: 'maintenance',
      description: `Completed comprehensive technical inspection. Operating tolerance verified within safety margins. Condition marked as optimal.`,
      icon: Wrench,
      color: 'bg-purple-500'
    },
    {
      date: '2024-05-18',
      title: 'Active Research Booking Completed',
      type: 'booking',
      description: 'Reserved for experimental trial sessions by Department Faculty. Returned on schedule without defects.',
      icon: Calendar,
      color: 'bg-emerald-500'
    },
    {
      date: asset.nextMaintenanceDate || '2024-11-20',
      title: 'Next Scheduled Calibration Due',
      type: 'scheduled',
      description: 'Scheduled preventive maintenance and sensor recalibration cycle.',
      icon: Clock,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Passport Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px] uppercase tracking-wider font-bold">
                Digital Lab Passport
              </span>
              <span className="text-white/80 text-xs">Asset ID: {asset.id}</span>
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-2">
              {asset.name}
            </h3>
            <p className="text-white/80 text-xs mt-1">
              Model: {asset.model} • SN: {asset.serialNumber} • Category: {asset.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passport Details Bar */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-border dark:border-slate-800 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Status</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase ${
              asset.status === 'AVAILABLE'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
            }`}>
              {asset.status}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Asset Tag</span>
            <span className="text-xs font-bold text-foreground dark:text-white capitalize mt-0.5 block font-mono">
              {asset.assetTag}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Storage Room</span>
            <span className="text-xs font-bold text-foreground dark:text-white mt-0.5 block truncate">
              {asset.location}
            </span>
          </div>
        </div>

        {/* Timeline Events */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Asset Lifecycle History & Audit Trail
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timelineEvents.map((evt, idx) => {
              const Icon = evt.icon;
              return (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${evt.color} text-white flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-slate-900`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="pl-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {evt.date}
                      </span>
                      <span className="font-heading font-bold text-sm text-foreground dark:text-white">
                        {evt.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Passport securely generated from immutable system transaction logs.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
