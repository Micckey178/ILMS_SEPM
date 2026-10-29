import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
  Biohazard,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { IncidentTicket } from '../types';

export const SafetyPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [incidents, setIncidents] = useState<IncidentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<IncidentTicket['severity']>('MEDIUM');
  const [type, setType] = useState<IncidentTicket['type']>('CHEMICAL_SPILL');
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await DataService.getIncidents(activeLab?.id);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load safety incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [activeLab]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.reportIncident({
        title,
        laboratoryId: activeLab?.id || 'lab-chem-01',
        severity,
        type,
        reportedBy: currentUser.id,
        reportedByName: currentUser.displayName,
        description,
        immediateActionsTaken: immediateAction
      }, currentUser);
      setIsReportModalOpen(false);
      setTitle('');
      setDescription('');
      setImmediateAction('');
      loadIncidents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolve = async (inc: IncidentTicket) => {
    const notes = prompt('Enter corrective action and resolution notes:');
    if (!notes) return;

    try {
      await DataService.resolveIncident(inc.id, 'RESOLVED', notes, currentUser);
      loadIncidents();
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
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Laboratory Safety, Hazards & Incident Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • EHS incident logging and corrective action verification
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-rose-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Report Safety Incident</span>
        </button>
      </div>

      {/* Incident Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="divide-y divide-slate-800/70">
          {incidents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No safety incidents logged. Environment is operating within safety guidelines.
            </div>
          ) : (
            incidents.map((inc) => {
              const isResolved = inc.status === 'RESOLVED' || inc.status === 'CLOSED';
              const canClose = can('close_incident') && !isResolved;

              return (
                <div key={inc.id} className="p-5 hover:bg-slate-850/40 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-sm text-slate-100">{inc.title}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {inc.severity} SEVERITY
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                        {inc.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {inc.description}
                    </p>

                    {inc.immediateActionsTaken && (
                      <div className="p-2.5 bg-slate-950/60 rounded-lg text-xs text-slate-400 border border-slate-800/80">
                        <strong className="text-slate-200">Immediate Actions:</strong> {inc.immediateActionsTaken}
                      </div>
                    )}

                    {inc.resolutionNotes && (
                      <div className="p-2.5 bg-emerald-500/10 rounded-lg text-xs text-emerald-300 border border-emerald-500/30">
                        <strong>Resolution & Corrective Actions:</strong> {inc.resolutionNotes}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Reported by {inc.reportedByName} on {new Date(inc.reportedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {canClose ? (
                      <button
                        onClick={() => handleResolve(inc)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sign Off Resolution</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Log Safety Incident / Hazard</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReport} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Incident Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minor solvent leak in storage secondary tray"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="LOW">Low (Observation)</option>
                    <option value="MEDIUM">Medium (Minor Spill/Issue)</option>
                    <option value="HIGH">High (Equipment Hazard)</option>
                    <option value="CRITICAL">Critical (Immediate Evac)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Hazard Classification
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="CHEMICAL_SPILL">Chemical Spill</option>
                    <option value="EQUIPMENT_DAMAGE">Equipment Damage</option>
                    <option value="BIOSAFETY">Biosafety Breach</option>
                    <option value="ELECTRICAL">Electrical Hazard</option>
                    <option value="FIRE">Fire Hazard</option>
                    <option value="INJURY">Physical Injury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Incident Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the circumstances, personnel involved, and any damages."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Immediate Actions Taken
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Absorbent pads placed, secondary containment cleaned with neutralizing agent."
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Incident Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
