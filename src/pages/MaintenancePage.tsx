import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { MaintenanceRecord, EquipmentAsset } from '../types';

export const MaintenancePage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedRecordForSignoff, setSelectedRecordForSignoff] = useState<MaintenanceRecord | null>(null);

  // New Schedule form
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [serviceType, setServiceType] = useState<MaintenanceRecord['type']>('PREVENTIVE');
  const [scheduledDate, setScheduledDate] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  // Signoff form
  const [workPerformed, setWorkPerformed] = useState('');
  const [actualCost, setActualCost] = useState<number>(0);
  const [partsReplacedStr, setPartsReplacedStr] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [maint, equip] = await Promise.all([
        DataService.getMaintenanceRecords(activeLab?.id),
        DataService.getEquipment(activeLab?.id)
      ]);
      setRecords(maint);
      setEquipmentList(equip);
      if (equip.length > 0) setSelectedEquipId(equip[0].id);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setScheduledDate(nextWeek.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLab]);

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const equip = equipmentList.find(e => e.id === selectedEquipId);
    try {
      await DataService.createMaintenanceRecord({
        equipmentId: selectedEquipId,
        equipmentName: equip?.name || 'Lab Instrument',
        laboratoryId: activeLab?.id || 'lab-chem-01',
        type: serviceType,
        scheduledDate: new Date(`${scheduledDate}T09:00:00Z`).toISOString(),
        serviceProvider,
        faultDescription,
        cost: estimatedCost
      }, currentUser);
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteSignoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForSignoff) return;
    const parts = partsReplacedStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await DataService.completeMaintenance(
        selectedRecordForSignoff.id,
        workPerformed,
        actualCost,
        parts,
        currentUser
      );
      setSelectedRecordForSignoff(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Equipment Maintenance & Calibration Tracking</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Preventative schedules, fault tickets, and safety unblocking
          </p>
        </div>

        {can('manage_equipment') && (
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-amber-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Maintenance</span>
          </button>
        )}
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Instrument Asset</th>
                <th className="py-3 px-3">Service Type</th>
                <th className="py-3 px-3">Scheduled Date</th>
                <th className="py-3 px-3">Technician / Vendor</th>
                <th className="py-3 px-3">Cost ($)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No maintenance or calibration logs found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isOverdue = rec.status === 'OVERDUE' || (rec.status === 'SCHEDULED' && new Date(rec.scheduledDate).getTime() < Date.now());
                  const canSignoff = can('manage_equipment') && rec.status !== 'COMPLETED';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{rec.equipmentName}</div>
                        {rec.faultDescription && (
                          <div className="text-[11px] text-amber-300/80 italic mt-0.5">
                            "{rec.faultDescription}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-400 font-medium">
                        {rec.type}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {new Date(rec.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {rec.serviceProvider || rec.technicianName}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        ${rec.cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        {isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        ) : rec.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canSignoff ? (
                          <button
                            onClick={() => {
                              setSelectedRecordForSignoff(rec);
                              setWorkPerformed(rec.faultDescription ? `Resolved: ${rec.faultDescription}. Full recalibration performed.` : 'Preventive maintenance and cleaning completed.');
                              setActualCost(rec.cost || 150);
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 mx-auto transition shadow-sm"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Sign-Off & Unlock</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Signed Off</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Schedule Maintenance / Calibration</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Equipment Asset
                </label>
                <select
                  value={selectedEquipId}
                  onChange={(e) => setSelectedEquipId(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} [{eq.assetTag}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="PREVENTIVE">Preventive Service</option>
                    <option value="CALIBRATION">Calibration</option>
                    <option value="CORRECTIVE">Corrective Repair</option>
                    <option value="SAFETY_INSPECTION">Safety Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Service Provider / Certified Technician
                </label>
                <input
                  type="text"
                  placeholder="e.g. Agilent Direct Services or Institutional Senior Tech"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Fault / Service Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Optical alignment verification and mirror cleaning."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                >
                  Create Maintenance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Maintenance & Unlock Modal */}
      {selectedRecordForSignoff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Sign-Off & Clear Maintenance Lock</h3>
              <button onClick={() => setSelectedRecordForSignoff(null)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSignoff} className="p-5 space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs space-y-1">
                <div>Asset: <strong className="text-slate-100">{selectedRecordForSignoff.equipmentName}</strong></div>
                <div>Service: <span className="font-mono text-sky-400">{selectedRecordForSignoff.type}</span></div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Work Performed & Certification Details <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Parts Replaced (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diode lamp, O-ring seal, drive belt"
                  value={partsReplacedStr}
                  onChange={(e) => setPartsReplacedStr(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Final Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForSignoff(null)}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Restore Asset to AVAILABLE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
