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
import { formatINR } from '../utils/formatCurrency';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Asset Health & Calibration
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Preventative schedules, fault tickets, and safety unblocking
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Equipment Maintenance & Calibration Tracking
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Schedule recurring ISO/IEC calibrations, track technician sign-offs, restore maintenance locks, and audit instrumentation reliability.
          </p>
        </div>

        {can('manage_equipment') && (
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-5 py-3 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-md transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Maintenance</span>
          </button>
        )}
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-white border border-[#E4E7F0] rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7F0] bg-[#F5F6FC] text-[#5B6478] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-5">Instrument Asset</th>
                <th className="py-3.5 px-4">Service Type</th>
                <th className="py-3.5 px-4">Scheduled Date</th>
                <th className="py-3.5 px-4">Technician / Vendor</th>
                <th className="py-3.5 px-4">Cost (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7F0]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6478] text-xs">
                    No maintenance or calibration logs found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isOverdue = rec.status === 'OVERDUE' || (rec.status === 'SCHEDULED' && new Date(rec.scheduledDate).getTime() < Date.now());
                  const canSignoff = can('manage_equipment') && rec.status !== 'COMPLETED';

                  return (
                    <tr key={rec.id} className="hover:bg-[#F5F6FC]/60 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-sm text-[#172033]">{rec.equipmentName}</div>
                        {rec.faultDescription && (
                          <div className="text-[11px] text-amber-700 italic mt-0.5">
                            "{rec.faultDescription}"
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-800 font-bold">
                        {rec.type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#5B6478]">
                        {new Date(rec.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-[#5B6478] font-medium">
                        {rec.serviceProvider || rec.technicianName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">
                        {formatINR(rec.cost)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        ) : rec.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {canSignoff ? (
                          <button
                            onClick={() => {
                              setSelectedRecordForSignoff(rec);
                              setWorkPerformed(rec.faultDescription ? `Resolved: ${rec.faultDescription}. Full recalibration performed.` : 'Preventive maintenance and cleaning completed.');
                              setActualCost(rec.cost || 1500);
                            }}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 mx-auto transition shadow-sm"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Sign-Off & Unlock</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#5B6478] font-bold uppercase tracking-wider">Signed Off</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#172033]">
            <div className="flex items-center justify-between p-5 border-b border-[#E4E7F0] bg-white">
              <h3 className="font-heading font-black text-lg text-[#172033]">Schedule Maintenance / Calibration</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1.5 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Equipment Asset
                </label>
                <select
                  value={selectedEquipId}
                  onChange={(e) => setSelectedEquipId(e.target.value)}
                  required
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none font-semibold"
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
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-2 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none font-semibold"
                  >
                    <option value="PREVENTIVE">Preventive Service</option>
                    <option value="CALIBRATION">Calibration</option>
                    <option value="CORRECTIVE">Corrective Repair</option>
                    <option value="SAFETY_INSPECTION">Safety Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Service Provider / Certified Technician
                </label>
                <input
                  type="text"
                  placeholder="e.g. Agilent Direct Services or Institutional Senior Tech"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Fault / Service Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Optical alignment verification and mirror cleaning."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5B6478] hover:text-[#172033] bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-xl text-xs font-extrabold shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#172033]">
            <div className="flex items-center justify-between p-5 border-b border-[#E4E7F0] bg-white">
              <h3 className="font-heading font-black text-lg text-[#172033]">Sign-Off & Clear Maintenance Lock</h3>
              <button onClick={() => setSelectedRecordForSignoff(null)} className="p-1.5 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSignoff} className="p-6 space-y-4">
              <div className="p-3 bg-[#F5F6FC] rounded-2xl border border-[#E4E7F0] text-xs space-y-1">
                <div>Asset: <strong className="text-[#172033]">{selectedRecordForSignoff.equipmentName}</strong></div>
                <div>Service: <span className="font-mono text-cyan-800 font-bold">{selectedRecordForSignoff.type}</span></div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Work Performed & Certification Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Parts Replaced (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diode lamp, O-ring seal, drive belt"
                  value={partsReplacedStr}
                  onChange={(e) => setPartsReplacedStr(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Final Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForSignoff(null)}
                  className="px-4 py-2 text-xs font-bold text-[#5B6478] hover:text-[#172033] bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
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
