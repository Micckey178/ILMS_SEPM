import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { EquipmentAsset, EquipmentBooking } from '../types';
import { DataService, localStore } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEquipmentId?: string;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedEquipmentId,
  onSuccess
}) => {
  const { currentUser, activeLab } = useAuth();
  const [equipmentList, setEquipmentList] = useState<EquipmentAsset[]>([]);
  const [selectedEquipId, setSelectedEquipId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [purpose, setPurpose] = useState<string>('');
  const [projectOrExperiment, setProjectOrExperiment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const equip = localStore.getEquipment().filter(
        e => !activeLab || e.laboratoryId === activeLab.id
      );
      setEquipmentList(equip);
      setSelectedEquipId(preselectedEquipmentId || equip[0]?.id || '');

      // Set default tomorrow date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
      setErrorMsg(null);
    }
  }, [isOpen, preselectedEquipmentId, activeLab]);

  if (!isOpen) return null;

  const selectedEquipment = equipmentList.find(e => e.id === selectedEquipId);
  const isBlocked = selectedEquipment?.status === 'MAINTENANCE_BLOCKED' ||
    selectedEquipment?.status === 'UNDER_MAINTENANCE' ||
    selectedEquipment?.status === 'OUT_OF_SERVICE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedEquipment) {
      setErrorMsg('Please select an equipment asset.');
      return;
    }

    if (isBlocked) {
      setErrorMsg(`Equipment "${selectedEquipment.name}" is locked (${selectedEquipment.status}). Reservations cannot be confirmed.`);
      return;
    }

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endIso = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
      setErrorMsg('Start time must be before end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await DataService.createBooking(
        {
          equipmentId: selectedEquipment.id,
          equipmentName: selectedEquipment.name,
          laboratoryId: selectedEquipment.laboratoryId,
          userId: currentUser.id,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          startTime: startIso,
          endTime: endIso,
          purpose,
          projectOrExperiment: projectOrExperiment || undefined
        },
        currentUser
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reserve equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100">Reserve Equipment Session</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Equipment selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Equipment Asset
            </label>
            <select
              value={selectedEquipId}
              onChange={(e) => setSelectedEquipId(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} [{eq.assetTag}] — {eq.status}
                </option>
              ))}
            </select>
          </div>

          {/* Status warning if maintenance blocked */}
          {isBlocked && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-semibold">Safety / Maintenance Lock Active:</span> This instrument cannot be booked until required maintenance is cleared by an authorized technician.
              </div>
            </div>
          )}

          {/* Timeslot Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Purpose & Project */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Experiment / Booking Purpose <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. UV-Vis spectroscopic kinetics of synthesized dye"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Course / Project Code (Optional)
            </label>
            <input
              type="text"
              value={projectOrExperiment}
              onChange={(e) => setProjectOrExperiment(e.target.value)}
              placeholder="e.g. CHEM-301-LAB-B or NSF-GRANT-2026"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isBlocked}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-sky-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Checking schedule...' : 'Confirm Reservation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
