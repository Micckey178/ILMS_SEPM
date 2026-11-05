import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  ShieldCheck,
  Cpu,
  User,
  Calendar,
  Save,
  Check
} from 'lucide-react';
import { FaultTicket } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface FaultResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: FaultTicket | null;
  onSuccess: () => void;
}

export const FaultResolutionModal: React.FC<FaultResolutionModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<FaultTicket['status']>('INVESTIGATING');
  const [resolutionNote, setResolutionNote] = useState('');
  const [partsReplacedStr, setPartsReplacedStr] = useState('');
  const [timeSpentHours, setTimeSpentHours] = useState<number>(1);
  const [restoreAvailability, setRestoreAvailability] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ticket && isOpen) {
      setStatus(ticket.status === 'OPEN' ? 'INVESTIGATING' : ticket.status);
      setResolutionNote(
        ticket.status === 'RESOLVED'
          ? 'Completed diagnostic check, verified hardware parameters and restored apparatus.'
          : ''
      );
      setPartsReplacedStr('');
      setTimeSpentHours(1);
      setErrorMsg(null);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resolutionNote.trim()) {
      setErrorMsg('Please provide technical diagnosis or repair remarks.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parts = partsReplacedStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      await DataService.updateFaultTicket(
        ticket.id,
        {
          status,
          resolutionNote: resolutionNote.trim(),
          assignedTechnicianId: currentUser.id,
          assignedTechnicianName: currentUser.displayName,
          partsReplaced: parts,
          timeSpentHours: Number(timeSpentHours) || 1
        },
        currentUser
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update fault ticket:', err);
      setErrorMsg(err.message || 'Failed to update fault ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl border border-border dark:border-slate-800 flex flex-col overflow-hidden text-foreground dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border dark:border-slate-800 bg-gradient-to-r from-purple-50 via-white to-purple-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase">
                {ticket.id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Lab: <strong className="text-foreground dark:text-white">{ticket.laboratoryId}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground dark:text-white">
              {ticket.equipmentName}
            </h2>
            <p className="text-xs text-muted-foreground">
              Reported by <strong className="text-foreground dark:text-white">{ticket.reportedByName}</strong> • {new Date(ticket.reportedAt).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fault Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Problem Category: <strong className="text-foreground dark:text-white">{ticket.problemCategory}</strong>
              </span>
              <span className="text-xs font-bold text-purple-600">
                Assigned: {currentUser.displayName}
              </span>
            </div>
            <p className="text-xs text-foreground dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-border dark:border-slate-700/80">
              "{ticket.description}"
            </p>
          </div>

          {/* Lifecycle Status Radio Group */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Update Fault Ticket Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  val: 'INVESTIGATING',
                  title: 'Bench Diagnostic',
                  desc: 'Inspecting hardware & circuits'
                },
                {
                  val: 'REPAIR_SCHEDULED',
                  title: 'Repair Scheduled',
                  desc: 'Awaiting spare parts'
                },
                {
                  val: 'RESOLVED',
                  title: 'Resolved & Restored',
                  desc: 'Equipment operational'
                }
              ].map(st => (
                <button
                  key={st.val}
                  type="button"
                  onClick={() => setStatus(st.val as any)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    status === st.val
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-sm'
                      : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{st.title}</span>
                    {status === st.val && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Technical Diagnosis & Repair Remarks */}
          <div>
            <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
              Technician Diagnosis & Servicing Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              placeholder="Detailed description of troubleshooting performed, tests executed, multimeter readings, or calibrations..."
              className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
              required
            />
          </div>

          {/* Spares & Time Spent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                Replacement Parts / Spares Used
              </label>
              <input
                type="text"
                value={partsReplacedStr}
                onChange={e => setPartsReplacedStr(e.target.value)}
                placeholder="e.g. HDMI Cable, 10A Fast Fuse, RJ45"
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Comma separated list</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                Service Labor Time (Hours)
              </label>
              <input
                type="number"
                min="0.25"
                max="40"
                step="0.25"
                value={timeSpentHours}
                onChange={e => setTimeSpentHours(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Recorded into laboratory maintenance ledger</span>
            </div>
          </div>

          {/* Ticket Timeline History */}
          {ticket.timeline && ticket.timeline.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Ticket Lifecycle History</span>
              </span>
              <div className="space-y-2 border border-border dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
                {ticket.timeline.map((stage, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground dark:text-white">{stage.stage}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">
                        {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(stage.timestamp).toLocaleDateString()}
                      </span>
                      {stage.note && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{stage.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restore Equipment checkbox when resolving */}
          {status === 'RESOLVED' && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreAvailability}
                onChange={e => setRestoreAvailability(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Automatically restore equipment asset status to AVAILABLE
              </span>
            </label>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-border dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Ticket Action</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
