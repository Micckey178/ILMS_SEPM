import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  CheckCircle2,
  Clock,
  Building2,
  Cpu,
  Save,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { Laboratory, EquipmentAsset, TechnicianWorkCategory } from '../types';
import { DataService, localStore } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface LogWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LogWorkOrderModal: React.FC<LogWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, activeLab } = useAuth();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TechnicianWorkCategory>('PREVENTIVE_MAINTENANCE');
  const [equipmentName, setEquipmentName] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [timeSpentHours, setTimeSpentHours] = useState<number>(2);
  const [verifiedBy, setVerifiedBy] = useState('Dr. Roopa M J (HOD, CSE)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const labs = localStore.getLabs().filter(l => l.id !== 'lab-chem-01');
      setLaboratories(labs);
      setSelectedLabId(activeLab?.id || labs[0]?.id || 'lab-atl-01');
      setTitle('');
      setCategory('PREVENTIVE_MAINTENANCE');
      setEquipmentName('');
      setWorkDescription('');
      setTimeSpentHours(2);
      setErrorMsg(null);
    }
  }, [isOpen, activeLab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !workDescription.trim()) {
      setErrorMsg('Please provide a title and detailed description of the technical work performed.');
      return;
    }

    const lab = laboratories.find(l => l.id === selectedLabId);

    setIsSubmitting(true);
    try {
      await DataService.createTechnicianWorkLog(
        {
          laboratoryId: selectedLabId,
          laboratoryName: lab?.name || 'Department Laboratory',
          roomCode: lab?.code || 'CS-LAB',
          title: title.trim(),
          category,
          equipmentName: equipmentName.trim() || 'Laboratory Workstations & Bench',
          workDescription: workDescription.trim(),
          date: new Date().toISOString().split('T')[0],
          timeSpentHours: Number(timeSpentHours) || 2,
          technicianId: currentUser.id,
          technicianName: currentUser.displayName,
          verifiedBy: verifiedBy.trim() || 'Dr. Roopa M J (HOD, CSE)',
          status: 'COMPLETED'
        },
        currentUser
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create technician work log:', err);
      setErrorMsg(err.message || 'Failed to submit technical work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl border border-border dark:border-slate-800 flex flex-col overflow-hidden text-foreground dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border dark:border-slate-800 bg-gradient-to-r from-purple-50 via-white to-purple-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 text-xs font-bold font-mono uppercase">
                Technical Staff
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Campus Engineering Ledger
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground dark:text-white">
              Log Technical Work Order
            </h2>
            <p className="text-xs text-muted-foreground">
              Official record of lab workstation setup, bench calibration, hardware repair, or facility maintenance.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
              Work Order Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Ubuntu 24.04 OS Image Deployment & Bench Testing"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
            />
          </div>

          {/* Facility & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                Facility / Lab Room
              </label>
              <select
                value={selectedLabId}
                onChange={e => setSelectedLabId(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white font-medium"
              >
                {laboratories.map(lab => (
                  <option key={lab.id} value={lab.id}>
                    {lab.code}: {lab.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                Work Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TechnicianWorkCategory)}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white font-medium"
              >
                <option value="WORKSTATION_DEPLOYMENT">Workstation Deployments</option>
                <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</option>
                <option value="CALIBRATION">Equipment Calibration</option>
                <option value="HARDWARE_REPAIR">Hardware Repairs</option>
                <option value="NETWORK_CONFIG">Network Configurations</option>
                <option value="EMERGENCY_FAULT">Emergency Fault Fixes</option>
              </select>
            </div>
          </div>

          {/* Equipment / Apparatus Name */}
          <div>
            <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
              Equipment / Apparatus Serviced
            </label>
            <input
              type="text"
              placeholder="e.g. Cisco Catalyst 9200 Switch, WS-ATL1-01 to WS-ATL1-32, Digital Multimeters"
              value={equipmentName}
              onChange={e => setEquipmentName(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
            />
          </div>

          {/* Work Description */}
          <div>
            <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
              Technical Description & Work Performed <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Step-by-step description of procedures completed, diagnostic benchmarks run, replaced components, or calibration standards applied..."
              value={workDescription}
              onChange={e => setWorkDescription(e.target.value)}
              className="w-full p-3 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
            />
          </div>

          {/* Hours & Verifier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                Service Labor Hours
              </label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={timeSpentHours}
                onChange={e => setTimeSpentHours(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                Department Verifier / Approver
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={e => setVerifiedBy(e.target.value)}
                placeholder="Dr. Roopa M J (HOD, CSE)"
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Log Technical Work Order</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
