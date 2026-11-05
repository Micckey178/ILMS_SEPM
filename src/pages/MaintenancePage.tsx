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
  FileCheck,
  Search,
  Filter,
  Building2,
  CheckCheck,
  Cpu,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  MaintenanceRecord,
  EquipmentAsset,
  Laboratory,
  FaultTicket,
  TechnicianWorkLog
} from '../types';
import { formatINR } from '../utils/formatCurrency';
import { FaultResolutionModal } from '../components/FaultResolutionModal';
import { LogWorkOrderModal } from '../components/LogWorkOrderModal';

export const MaintenancePage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'faults' | 'workOrders'>('scheduled');
  
  // Datasets
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentAsset[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [faultTickets, setFaultTickets] = useState<FaultTicket[]>([]);
  const [workLogs, setWorkLogs] = useState<TechnicianWorkLog[]>([]);
  
  // Filters
  const [selectedLabId, setSelectedLabId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedRecordForSignoff, setSelectedRecordForSignoff] = useState<MaintenanceRecord | null>(null);
  const [selectedTicketForResolution, setSelectedTicketForResolution] = useState<FaultTicket | null>(null);
  const [isLogWorkOrderModalOpen, setIsLogWorkOrderModalOpen] = useState(false);

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
      const [maint, equip, labs, faults, works] = await Promise.all([
        DataService.getMaintenanceRecords(),
        DataService.getEquipment(),
        DataService.getLaboratories(),
        DataService.getFaultTickets(),
        DataService.getTechnicianWorkLogs()
      ]);
      setRecords(maint);
      setEquipmentList(equip);
      setLaboratories(labs.filter(l => l.id !== 'lab-chem-01'));
      setFaultTickets(faults);
      setWorkLogs(works);

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
        laboratoryId: selectedLabId !== 'ALL' ? selectedLabId : (activeLab?.id || 'lab-atl-01'),
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

  // Filtered maintenance records
  const filteredRecords = records.filter(rec => {
    const matchesLab = selectedLabId === 'ALL' || rec.laboratoryId === selectedLabId;
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesSearch = !searchQuery ||
      rec.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.technicianName && rec.technicianName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.serviceProvider && rec.serviceProvider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.faultDescription && rec.faultDescription.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLab && matchesStatus && matchesSearch;
  });

  // Filtered fault tickets
  const filteredFaults = faultTickets.filter(ticket => {
    const matchesLab = selectedLabId === 'ALL' || ticket.laboratoryId === selectedLabId;
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesSearch = !searchQuery ||
      ticket.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.problemCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.reportedByName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLab && matchesStatus && matchesSearch;
  });

  // Filtered work logs
  const filteredWorkLogs = workLogs.filter(work => {
    const matchesLab = selectedLabId === 'ALL' || work.laboratoryId === selectedLabId;
    const matchesSearch = !searchQuery ||
      work.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.workDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.equipmentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLab && matchesSearch;
  });

  const scheduledCount = records.filter(r => r.status === 'SCHEDULED').length;
  const inProgressCount = records.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = records.filter(r => r.status === 'COMPLETED').length;
  const activeFaultsCount = faultTickets.filter(f => f.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              {currentUser.role === 'technician' ? 'Technician Operations' : 'Asset Health & Calibration'}
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              All 12 Laboratories • Preventative schedules, fault tickets, and field work orders
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            {currentUser.role === 'technician' ? 'Work Orders & Equipment Maintenance' : 'Equipment Maintenance & Calibration Tracking'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Schedule ISO/IEC calibrations, resolve equipment fault tickets, sign off maintenance locks, and log technical campus work orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {activeTab === 'workOrders' && (
            <button
              onClick={() => setIsLogWorkOrderModalOpen(true)}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Technical Work Order</span>
            </button>
          )}

          {activeTab === 'scheduled' && can('manage_equipment') && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-5 py-3 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Maintenance</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-[#E4E7F0] pb-2 bg-transparent">
        <button
          type="button"
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'scheduled'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'bg-white text-[#5B6478] hover:bg-slate-50 border border-[#E4E7F0]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Maintenance & Calibrations</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/50 text-foreground font-mono">
            {records.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faults')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'faults'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-[#5B6478] hover:bg-slate-50 border border-[#E4E7F0]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reported Fault Tickets</span>
          {activeFaultsCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
              {activeFaultsCount} Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workOrders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'workOrders'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-[#5B6478] hover:bg-slate-50 border border-[#E4E7F0]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Campus Technical Work Orders</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
            {workLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SCHEDULED MAINTENANCE & CALIBRATIONS */}
      {activeTab === 'scheduled' && (
        <div className="space-y-5">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-2xl shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6478]">Total Tracked</div>
              <div className="text-2xl font-black text-[#172033] mt-1">{records.length} Logs</div>
            </div>
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-2xl shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Scheduled Due</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{scheduledCount}</div>
            </div>
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-2xl shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">In Progress</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{inProgressCount}</div>
            </div>
            <div className="p-4 bg-white border border-[#E4E7F0] rounded-2xl shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</div>
            </div>
          </div>

          {/* Filters and Multi-Lab Selector */}
          <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-card flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6478]" />
              <input
                type="text"
                placeholder="Search maintenance logs by instrument, technician, or fault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#172033] placeholder-[#5B6478] focus:border-[#18BDF5] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 w-full md:w-auto">
                <Building2 className="w-4 h-4 text-[#8961D8] shrink-0" />
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-3 py-2 text-xs font-bold text-[#172033] outline-none focus:border-[#18BDF5] w-full md:w-56"
                >
                  <option value="ALL">🏛️ All 12 CSE Laboratories</option>
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.code}: {lab.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-3 py-2 text-xs font-bold text-[#172033] outline-none focus:border-[#18BDF5] shrink-0"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>

          {/* Maintenance Records Table */}
          <div className="bg-white border border-[#E4E7F0] rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E7F0] bg-[#F5F6FC] text-[#5B6478] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-5">Instrument Asset</th>
                    <th className="py-3.5 px-4">Facility / Room</th>
                    <th className="py-3.5 px-4">Service Type</th>
                    <th className="py-3.5 px-4">Scheduled Date</th>
                    <th className="py-3.5 px-4">Technician / Vendor</th>
                    <th className="py-3.5 px-4">Cost (₹)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7F0]">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#5B6478] text-xs">
                        No maintenance or calibration logs found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const isOverdue = rec.status === 'OVERDUE' || (rec.status === 'SCHEDULED' && new Date(rec.scheduledDate).getTime() < Date.now());
                      const canSignoff = can('manage_equipment') && rec.status !== 'COMPLETED';
                      const lab = laboratories.find(l => l.id === rec.laboratoryId);

                      return (
                        <tr key={rec.id} className="hover:bg-[#F5F6FC]/60 transition">
                          <td className="py-3.5 px-5 font-semibold text-[#172033]">
                            {rec.equipmentName}
                            {rec.faultDescription && (
                              <div className="text-[10px] text-[#5B6478] font-normal truncate max-w-[200px] mt-0.5">
                                {rec.faultDescription}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              {lab ? lab.code : 'CS-01'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              rec.type === 'CALIBRATION' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {new Date(rec.scheduledDate).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-[#5B6478]">
                            {rec.technicianName || rec.serviceProvider || 'Unassigned'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">
                            {formatINR(rec.cost)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : rec.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isOverdue ? 'OVERDUE' : rec.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            {canSignoff ? (
                              <button
                                onClick={() => {
                                  setSelectedRecordForSignoff(rec);
                                  setWorkPerformed(rec.workPerformed || '');
                                  setActualCost(rec.cost || 0);
                                  setPartsReplacedStr((rec.partsReplaced || []).join(', '));
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
        </div>
      )}

      {/* TAB 2: REPORTED FAULT TICKETS */}
      {activeTab === 'faults' && (
        <div className="space-y-5">
          {/* Fault Filters */}
          <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-card flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6478]" />
              <input
                type="text"
                placeholder="Search fault tickets by equipment, defect category, or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#172033] placeholder-[#5B6478] focus:border-[#18BDF5] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 w-full md:w-auto">
                <Building2 className="w-4 h-4 text-[#8961D8] shrink-0" />
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-3 py-2 text-xs font-bold text-[#172033] outline-none focus:border-[#18BDF5] w-full md:w-56"
                >
                  <option value="ALL">🏛️ All 12 CSE Laboratories</option>
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.code}: {lab.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-3 py-2 text-xs font-bold text-[#172033] outline-none focus:border-[#18BDF5] shrink-0"
              >
                <option value="ALL">All Fault Statuses</option>
                <option value="OPEN">Open</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="REPAIR_SCHEDULED">Repair Scheduled</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* Fault Tickets Table */}
          <div className="bg-white border border-[#E4E7F0] rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E7F0] bg-[#F5F6FC] text-[#5B6478] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-5">Ticket ID / Equipment</th>
                    <th className="py-3.5 px-4">Facility</th>
                    <th className="py-3.5 px-4">Problem Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-5">Description & Fault Note</th>
                    <th className="py-3.5 px-4">Reported By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7F0]">
                  {filteredFaults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#5B6478] text-xs">
                        No fault tickets found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFaults.map((ticket) => {
                      const lab = laboratories.find(l => l.id === ticket.laboratoryId);
                      return (
                        <tr key={ticket.id} className="hover:bg-[#F5F6FC]/60 transition">
                          <td className="py-3.5 px-5">
                            <span className="font-mono text-xs font-black text-purple-700 block">
                              {ticket.id}
                            </span>
                            <span className="font-bold text-xs text-[#172033] mt-0.5 block">
                              {ticket.equipmentName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              {lab ? lab.code : 'CS-01'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#172033]">
                            {ticket.problemCategory}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              ticket.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                              ticket.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 max-w-[260px] text-[#5B6478]">
                            <p className="truncate">{ticket.description}</p>
                          </td>
                          <td className="py-3.5 px-4 text-[#5B6478] text-[11px]">
                            {ticket.reportedByName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              ticket.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ticket.status === 'INVESTIGATING'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedTicketForResolution(ticket)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 mx-auto transition shadow-xs"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>{ticket.status === 'RESOLVED' ? 'View Service' : 'Inspect / Resolve'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS TECHNICAL WORK ORDERS */}
      {activeTab === 'workOrders' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E7F0] bg-[#F5F6FC] text-[#5B6478] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-5">Work Order #</th>
                    <th className="py-3.5 px-4">Facility / Room</th>
                    <th className="py-3.5 px-4">Work Category</th>
                    <th className="py-3.5 px-4">Equipment / Apparatus</th>
                    <th className="py-3.5 px-5">Work Performed & Technical Notes</th>
                    <th className="py-3.5 px-4">Time Spent</th>
                    <th className="py-3.5 px-4">Verified By</th>
                    <th className="py-3.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7F0]">
                  {filteredWorkLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#5B6478] text-xs">
                        No technical work orders found. Click "+ Log Technical Work Order" to record an activity.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkLogs.map((work) => {
                      const lab = laboratories.find(l => l.id === work.laboratoryId);
                      return (
                        <tr key={work.id} className="hover:bg-[#F5F6FC]/60 transition">
                          <td className="py-3.5 px-5">
                            <span className="font-mono text-xs font-black text-cyan-800">
                              {work.workOrderNumber}
                            </span>
                            <div className="text-[10px] text-[#5B6478] mt-0.5">
                              {new Date(work.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                              {work.roomCode || (lab ? lab.code : 'CS-01')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-mono font-bold text-purple-800 bg-[#F0E9FF] px-2 py-0.5 rounded-md">
                              {work.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#172033]">
                            {work.equipmentName}
                          </td>
                          <td className="py-3.5 px-5 text-[#5B6478] max-w-[280px]">
                            <p className="truncate">{work.workDescription}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                            {work.timeSpentHours} hrs
                          </td>
                          <td className="py-3.5 px-4 text-[#5B6478] text-[11px] font-medium">
                            {work.verifiedBy}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{work.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                    <option value="EMERGENCY_REPAIR">Emergency Repair</option>
                    <option value="INSPECTION">Periodic Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-2 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Service Provider / Assigned Lead
                </label>
                <input
                  type="text"
                  placeholder="e.g. In-house Tech or Keysight Technologies"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  required
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Fault / Maintenance Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Routine annual ISO calibration, firmware check, probe impedance check..."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl p-3 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Estimated Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
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
                  className="px-5 py-2 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-xl text-xs font-extrabold shadow-md shadow-[#18BDF5]/20"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign-Off Modal */}
      {selectedRecordForSignoff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#172033]">
            <div className="flex items-center justify-between p-5 border-b border-[#E4E7F0] bg-white">
              <h3 className="font-heading font-black text-lg text-[#172033]">Maintenance Sign-Off & Unlock</h3>
              <button onClick={() => setSelectedRecordForSignoff(null)} className="p-1.5 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSignoff} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
                Completing this sign-off will automatically set equipment status back to <strong>AVAILABLE</strong> and remove maintenance locks from bookings.
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Work Performed Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Replaced worn coupling, recalibrated sensor span, verified zero point..."
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl p-3 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Parts Replaced (comma separated)
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

      {/* Technician Fault Resolution Modal */}
      <FaultResolutionModal
        isOpen={!!selectedTicketForResolution}
        onClose={() => setSelectedTicketForResolution(null)}
        ticket={selectedTicketForResolution}
        onSuccess={loadData}
      />

      {/* Technician Log Work Order Modal */}
      <LogWorkOrderModal
        isOpen={isLogWorkOrderModalOpen}
        onClose={() => setIsLogWorkOrderModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
