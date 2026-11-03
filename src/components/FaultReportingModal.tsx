import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { FaultTicket } from '../types';

interface FaultReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssetId?: string;
  preselectedAssetName?: string;
  onTicketCreated?: () => void;
}

export const FaultReportingModal: React.FC<FaultReportingModalProps> = ({
  isOpen,
  onClose,
  preselectedAssetId = '',
  preselectedAssetName = '',
  onTicketCreated
}) => {
  const { currentUser, activeLab } = useAuth();
  const [assetName, setAssetName] = useState(preselectedAssetName);
  const [category, setCategory] = useState<string>('Hardware Breakdown');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<FaultTicket | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const ticket = await DataService.reportFault(
        {
          laboratoryId: activeLab?.id || 'lab-cs-ai',
          equipmentId: preselectedAssetId || 'asset-custom',
          equipmentName: assetName.trim() || 'Laboratory Equipment / Workstation',
          reportedBy: currentUser.id,
          reportedByName: currentUser.displayName,
          problemCategory: category,
          priority,
          description: description.trim()
        },
        currentUser
      );

      setSubmittedTicket(ticket);
      if (onTicketCreated) onTicketCreated();
    } catch (err) {
      console.error('Failed to submit fault report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-foreground dark:text-white">
                Report Fault / Malfunction
              </h3>
              <p className="text-xs text-muted-foreground">
                Notify technicians and schedule urgent maintenance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedTicket ? (
          /* Success Screen */
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-heading font-black text-2xl text-foreground dark:text-white">
                Ticket Created #{submittedTicket.id}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Your fault ticket has been logged and assigned to on-duty lab technicians.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-left border border-border dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">Target Asset:</span>
                <span className="font-bold text-foreground dark:text-white">{submittedTicket.equipmentName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">Priority Level:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                  {submittedTicket.priority}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">Initial Status:</span>
                <span className="text-amber-600 font-semibold">Triage & Investigation Queued</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmittedTicket(null);
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md"
            >
              Close
            </button>
          </div>
        ) : (
          /* Report Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Equipment or Workstation Name / ID
              </label>
              <input
                type="text"
                required
                value={assetName}
                onChange={e => setAssetName(e.target.value)}
                placeholder="e.g. Workstation WS-04 or UV-Vis Spectrophotometer"
                className="w-full px-4 py-2.5 rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Problem Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Hardware Breakdown">Hardware Breakdown</option>
                  <option value="Electrical / Power">Electrical / Power</option>
                  <option value="Software Crash">Software / OS Crash</option>
                  <option value="Calibration Drift">Calibration Drift</option>
                  <option value="Other Incident">Other Incident</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="LOW">Low - Routine</option>
                  <option value="MEDIUM">Medium - Functional Limit</option>
                  <option value="HIGH">High - Blocking Practical</option>
                  <option value="CRITICAL">Critical - Safety Hazard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Fault Description & Symptoms
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what happened, any error codes displayed, or unusual sounds/odors..."
                className="w-full px-4 py-2.5 rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="p-3 border-2 border-dashed border-border dark:border-slate-800 rounded-2xl text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
              <Camera className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground font-medium">
                Tap to take or attach a photo of the defect
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/25"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Report...' : 'Submit Fault Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
