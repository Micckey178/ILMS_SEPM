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
  X,
  User,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Paperclip,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { IncidentTicket } from '../types';

export const SafetyPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [incidents, setIncidents] = useState<IncidentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // New Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<IncidentTicket['severity']>('MEDIUM');
  const [type, setType] = useState<IncidentTicket['type']>('CHEMICAL_SPILL');
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');

  // Selected Incident Inspection Modal
  const [selectedIncident, setSelectedIncident] = useState<IncidentTicket | null>(null);

  // Resolution Sign-off Modal
  const [resolvingIncident, setResolvingIncident] = useState<IncidentTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

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
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the incident title and description.');
      return;
    }

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

  const handleConfirmResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident || !resolutionNotes.trim()) return;

    try {
      await DataService.resolveIncident(resolvingIncident.id, 'RESOLVED', resolutionNotes, currentUser);
      setResolvingIncident(null);
      setResolutionNotes('');
      if (selectedIncident?.id === resolvingIncident.id) {
        setSelectedIncident(null);
      }
      loadIncidents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getSeverityBadge = (sev: IncidentTicket['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusBadge = (status: IncidentTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'INVESTIGATING':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'CORRECTIVE_ACTION_PENDING':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-700/40 text-slate-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const getTypeIcon = (t: IncidentTicket['type']) => {
    switch (t) {
      case 'CHEMICAL_SPILL':
        return <Biohazard className="w-4 h-4 text-rose-400" />;
      case 'EQUIPMENT_DAMAGE':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'FIRE':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'BIOSAFETY':
        return <Biohazard className="w-4 h-4 text-emerald-400" />;
      case 'ELECTRICAL':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'INJURY':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'IT_SYSTEM':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              EHS Incident Intelligence
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              OSHA & Academic Safety Compliance
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Safety Log & Incident Response
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Real-time logging of chemical spills, electrical hazards, apparatus faults, and verified corrective action sign-offs across laboratories.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-md transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Safety Incident</span>
        </button>
      </div>

      {/* Incident Cards Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-lg text-[#172033] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Active & Resolved Safety Incident Cards ({incidents.length})</span>
          </h2>
          <p className="text-xs text-[#5B6478]">Click any card to inspect full investigation timeline and corrective documentation</p>
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {incidents.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white border border-[#E4E7F0] rounded-3xl text-[#5B6478] shadow-card">
            <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <h3 className="font-heading font-bold text-lg text-[#172033]">No Safety Incidents Recorded</h3>
            <p className="text-xs text-[#5B6478] mt-1">Laboratory environment is currently operating within safety and hazard guidelines.</p>
          </div>
        ) : (
          incidents.map((inc) => {
            const isResolved = inc.status === 'RESOLVED' || inc.status === 'CLOSED';
            const canClose = can('close_incident') && !isResolved;

            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className="bg-white border border-[#E4E7F0] hover:border-cyan-400 rounded-3xl p-6 shadow-card transition hover:scale-[1.01] cursor-pointer flex flex-col justify-between group space-y-4"
              >
                {/* Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 rounded-lg bg-[#F5F6FC] border border-[#E4E7F0]">
                        {getTypeIcon(inc.type)}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#5B6478]">
                        {inc.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity} SEVERITY
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getStatusBadge(inc.status)}`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-[#172033] group-hover:text-cyan-700 transition line-clamp-1">
                    {inc.title}
                  </h3>

                  <p className="text-xs text-[#5B6478] leading-relaxed line-clamp-2">
                    {inc.description}
                  </p>
                </div>

                {/* Immediate Actions Highlight */}
                {inc.immediateActionsTaken && (
                  <div className="p-3 bg-[#F5F6FC] rounded-2xl border border-[#E4E7F0] text-xs text-[#172033] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#5B6478] block tracking-wider">
                      Immediate Action Taken:
                    </span>
                    <p className="line-clamp-2 text-[#5B6478]">{inc.immediateActionsTaken}</p>
                  </div>
                )}

                {/* Resolution Notes if Resolved */}
                {inc.resolutionNotes && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                      Verified Resolution & Corrective Actions:
                    </span>
                    <p className="line-clamp-2 text-emerald-900">{inc.resolutionNotes}</p>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-3 border-t border-[#E4E7F0] flex items-center justify-between text-xs text-[#5B6478]">
                  <div className="flex items-center space-x-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-[#5B6478] shrink-0" />
                    <span className="truncate">Reported by <strong className="text-[#172033]">{inc.reportedByName}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-[#5B6478]">
                      {new Date(inc.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>

                    {canClose && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setResolvingIncident(inc);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sign Off</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULL INCIDENT DETAILS & AUDIT INVESTIGATION MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col text-[#172033]">
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-[#E4E7F0] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getSeverityBadge(selectedIncident.severity)}`}>
                    {selectedIncident.severity}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getStatusBadge(selectedIncident.status)}`}>
                    {selectedIncident.status}
                  </span>
                  <span className="text-xs font-mono text-[#5B6478] uppercase">
                    {selectedIncident.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-heading font-black text-xl text-[#172033] mt-1.5">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-[#5B6478] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#F5F6FC] rounded-2xl border border-[#E4E7F0]">
                <div>
                  <span className="text-[#5B6478] block text-[10px] uppercase font-bold">Reported By</span>
                  <span className="font-bold text-[#172033]">{selectedIncident.reportedByName}</span>
                </div>
                <div>
                  <span className="text-[#5B6478] block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-mono text-[#172033]">{new Date(selectedIncident.reportedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#5B6478] block text-[10px] uppercase font-bold">Incident Reference</span>
                  <span className="font-mono text-cyan-700 font-bold">#{selectedIncident.id}</span>
                </div>
              </div>

              <div>
                <span className="text-[#5B6478] block text-[10px] uppercase font-bold mb-1">
                  Incident Narrative & Description
                </span>
                <p className="text-[#172033] bg-[#F5F6FC] p-3 rounded-xl border border-[#E4E7F0] leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.immediateActionsTaken && (
                <div>
                  <span className="text-[#5B6478] block text-[10px] uppercase font-bold mb-1">
                    Immediate Containment Actions Taken
                  </span>
                  <p className="text-[#172033] bg-[#F5F6FC] p-3 rounded-xl border border-[#E4E7F0] leading-relaxed">
                    {selectedIncident.immediateActionsTaken}
                  </p>
                </div>
              )}

              {selectedIncident.resolutionNotes ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Resolution & Corrective Actions</span>
                  </span>
                  <p className="text-emerald-900 leading-relaxed">
                    {selectedIncident.resolutionNotes}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Pending final corrective action verification</span>
                  </span>
                  {can('close_incident') && (
                    <button
                      onClick={() => setResolvingIncident(selectedIncident)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                    >
                      Resolve Incident
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E4E7F0] bg-[#F5F6FC] flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-white border border-[#E4E7F0] hover:bg-slate-100 text-[#172033] rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION SIGN-OFF MODAL */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#172033]">
            <div className="p-5 bg-white border-b border-[#E4E7F0] flex items-center justify-between">
              <h3 className="font-heading font-bold text-[#172033] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Authorized Incident Resolution</span>
              </h3>
              <button onClick={() => setResolvingIncident(null)} className="p-1 text-[#5B6478] hover:text-[#172033]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="p-5 space-y-4">
              <div>
                <span className="text-[11px] text-[#5B6478] block font-bold mb-1">Incident:</span>
                <p className="font-bold text-[#172033] text-xs">{resolvingIncident.title}</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Corrective Actions & Root-Cause Mitigation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Detail what was cleaned up, replaced, repaired, or procedural changes made to prevent reoccurrence..."
                  className="w-full p-3 bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="px-4 py-2 bg-slate-100 text-[#5B6478] hover:text-[#172033] rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Confirm & Sign Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#172033]">
            <div className="p-5 bg-white border-b border-[#E4E7F0] flex items-center justify-between">
              <h3 className="font-heading font-bold text-[#172033] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Log Laboratory Incident / Hazard</span>
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 text-[#5B6478] hover:text-[#172033]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReport} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Incident Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Minor solvent leak in storage secondary tray"
                  className="w-full px-3 py-2 bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl text-xs text-[#172033] focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl text-xs text-[#172033] focus:outline-none"
                  >
                    <option value="CHEMICAL_SPILL">Chemical Spill</option>
                    <option value="EQUIPMENT_DAMAGE">Equipment Damage</option>
                    <option value="FIRE">Fire</option>
                    <option value="BIOSAFETY">Biosafety</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="INJURY">Injury</option>
                    <option value="IT_SYSTEM">IT System</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Description of Hazard / Event <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe location, materials involved, and immediate risks..."
                  className="w-full p-3 bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Immediate Actions Taken
                </label>
                <input
                  type="text"
                  value={immediateAction}
                  onChange={e => setImmediateAction(e.target.value)}
                  placeholder="e.g. Applied absorbent pads, isolated area, notified manager"
                  className="w-full px-3 py-2 bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl text-xs text-[#172033] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-[#5B6478] hover:text-[#172033] rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
