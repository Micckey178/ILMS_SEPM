import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Cpu,
  Monitor,
  AlertCircle,
  Calendar,
  Sparkles,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { EquipmentAsset, ComputerWorkstation, EquipmentBooking } from '../types';

interface LiveResourceAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking?: (resourceName: string) => void;
}

export const LiveResourceAvailabilityModal: React.FC<LiveResourceAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSelectBooking
}) => {
  const { activeLab } = useAuth();
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [workstations, setWorkstations] = useState<ComputerWorkstation[]>([]);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'workstations' | 'equipment'>('all');

  useEffect(() => {
    if (isOpen) {
      DataService.getEquipment(activeLab?.id).then(setEquipment).catch(() => {});
      DataService.getWorkstations(activeLab?.id).then(setWorkstations).catch(() => {});
      DataService.getBookings(activeLab?.id).then(setBookings).catch(() => {});
    }
  }, [isOpen, activeLab]);

  if (!isOpen) return null;

  const availableEquipment = equipment.filter(e => e.status === 'AVAILABLE');
  const availableWorkstations = workstations.filter(w => w.status === 'WORKING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header with vibrant gradient accent */}
        <div className="p-6 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#4F7DFF] text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-2xl text-foreground dark:text-white">
                Live Resource & Workstation Availability
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time slot availability for {activeLab ? activeLab.name : 'All Authorized Labs'}
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

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-border dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Resources ({availableEquipment.length + availableWorkstations.length})
            </button>
            <button
              onClick={() => setActiveTab('workstations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'workstations'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              Workstations ({availableWorkstations.length})
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'equipment'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              Instruments & Apparatus ({availableEquipment.length})
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Immediate Booking Ready</span>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Workstations Grid if relevant */}
          {(activeTab === 'all' || activeTab === 'workstations') && workstations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-600" />
                Computer Lab Workstations ({availableWorkstations.length} Available)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {workstations.map(ws => (
                  <div
                    key={ws.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      ws.status === 'WORKING'
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : ws.status === 'FAULTY'
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground dark:text-white flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-purple-600" />
                        {ws.workstationTag}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ws.status === 'WORKING'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                      }`}>
                        {ws.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {ws.cpu} • {ws.ram} • {ws.os}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      GPU: {ws.gpu || 'Integrated'} • Last inspected: {new Date(ws.lastInspection).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Assets */}
          {(activeTab === 'all' || activeTab === 'equipment') && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Instruments & Analytical Hardware ({availableEquipment.length} Available)
              </h4>
              <div className="space-y-2">
                {equipment.map(eq => (
                  <div
                    key={eq.id}
                    className="p-4 rounded-2xl border border-border dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-base text-foreground dark:text-white">{eq.name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                            SN: {eq.serialNumber}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Model: {eq.model} • Location: {eq.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold capitalize ${
                        eq.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}>
                        {eq.status}
                      </span>
                      {eq.status === 'AVAILABLE' && onSelectBooking && (
                        <button
                          onClick={() => {
                            onSelectBooking(eq.name);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <span>Reserve Slot</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Showing real-time equipment and workstation status synced from database.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-foreground font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
