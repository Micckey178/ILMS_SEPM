import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Wrench,
  QrCode,
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PackagePlus,
  Send,
  CalendarCheck,
  Calendar,
  Cpu,
  Building2,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import {
  UniversalInventoryItem,
  EquipmentAsset,
  MaintenanceRecord,
  FaultTicket,
  IssueReturnTransaction,
  PracticalSession,
  Laboratory
} from '../../types';

interface TechnicianDashboardProps {
  onOpenQRScanner: () => void;
  onOpenFaultReport: () => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  onOpenQRScanner,
  onOpenFaultReport
}) => {
  const navigate = useNavigate();
  const { activeLab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<UniversalInventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [loans, setLoans] = useState<IssueReturnTransaction[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [faultTickets, setFaultTickets] = useState<FaultTicket[]>([]);
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [allLabs, setAllLabs] = useState<Laboratory[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [inv, eq, ln, mn, ft, ss, labs] = await Promise.all([
          DataService.getInventory(activeLab?.id),
          DataService.getEquipment(activeLab?.id),
          DataService.getIssueReturnTransactions(activeLab?.id),
          DataService.getMaintenanceRecords(activeLab?.id),
          DataService.getFaultTickets(activeLab?.id),
          DataService.getPracticalSessions(),
          DataService.getLaboratories()
        ]);
        setInventory(inv);
        setEquipment(eq);
        setLoans(ln);
        setMaintenances(mn);
        setFaultTickets(ft);
        setSessions(ss);
        setAllLabs(labs.filter(l => l.id !== 'lab-chem-01'));
      } catch (err) {
        console.error('Technician data load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeLab]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeLoans = loans.filter(l => l.status === 'ISSUED');
  const overdueLoans = loans.filter(l => l.status === 'OVERDUE');
  const lowStock = inventory.filter(i => i.isLowStock || i.quantity <= i.minStock);
  const pendingMaintenance = maintenances.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Operations Deck
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              {activeLab ? activeLab.name : 'Technical Operations'}
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Technician Daily Operations
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Execute asset checkout and returns, perform urgent maintenance work orders, restock low chemical supplies, and calibrate equipment.
          </p>
        </div>

        {/* Large Quick Operational Task Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/timetable')}
            className="px-5 py-3 rounded-2xl bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border border-[#E9DDF1] font-bold text-sm shadow-sm flex items-center gap-2 transition"
          >
            <CalendarCheck className="w-5 h-5 text-[#8961D8]" />
            <span>All Lab Timetables (11 Labs)</span>
          </button>
          <button
            onClick={onOpenQRScanner}
            className="px-5 py-3 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold text-sm shadow-md flex items-center gap-2 transition"
          >
            <QrCode className="w-5 h-5 text-[#172033]" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={onOpenFaultReport}
            className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <Wrench className="w-5 h-5" />
            <span>Log Fault</span>
          </button>
        </div>
      </div>

      {/* Frequently Used Operations Bar with Large Accessible Buttons */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Frequently Used Operational Tasks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/timetable')}
            className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100 text-left transition group"
          >
            <CalendarCheck className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-heading font-bold text-sm text-foreground dark:text-white">Class Timetables</h4>
            <p className="text-xs text-muted-foreground mt-0.5">All 11 Labs & Class Schedules</p>
          </button>

          <button
            onClick={() => navigate('/issue-return')}
            className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 text-left transition group"
          >
            <ArrowRightLeft className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-heading font-bold text-sm text-foreground dark:text-white">Issue Item</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Loan equipment to student</p>
          </button>

          <button
            onClick={() => navigate('/issue-return')}
            className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 text-left transition group"
          >
            <CheckCircle2 className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-heading font-bold text-sm text-foreground dark:text-white">Accept Return</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Checkin returned asset</p>
          </button>

          <button
            onClick={() => navigate('/inventory')}
            className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-left transition group"
          >
            <PackagePlus className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-heading font-bold text-sm text-foreground dark:text-white">Receive Stock</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Record newly delivered supplies</p>
          </button>

          <button
            onClick={() => navigate('/maintenance')}
            className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 text-left transition group"
          >
            <Wrench className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-heading font-bold text-sm text-foreground dark:text-white">Maintenance Due</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingMaintenance.length} tasks scheduled</p>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => navigate('/timetable')}
          className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card cursor-pointer hover:border-indigo-400 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground block group-hover:text-indigo-600 transition">
              Class Timetables
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              11 Labs
            </span>
          </div>
          <span className="font-heading font-black text-3xl text-foreground dark:text-white mt-2 block">
            {sessions.length} Classes
          </span>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            Weekly Practical Schedule (CS-01 to CS-11) →
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <span className="text-xs font-bold uppercase text-muted-foreground block">Active Loans</span>
          <span className="font-heading font-black text-3xl text-foreground dark:text-white mt-2 block">
            {activeLoans.length}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Currently in possession of students</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <span className="text-xs font-bold uppercase text-muted-foreground block">Overdue Returns</span>
          <span className="font-heading font-black text-3xl text-rose-600 mt-2 block">
            {overdueLoans.length}
          </span>
          <p className="text-xs text-rose-600 font-semibold mt-1">Notification sent to student</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <span className="text-xs font-bold uppercase text-muted-foreground block">Open Fault Tickets</span>
          <span className="font-heading font-black text-3xl text-foreground dark:text-white mt-2 block">
            {faultTickets.length}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Reported by lab users</p>
        </div>
      </div>

      {/* DEPARTMENT PRACTICAL CLASSES & WORKSTATION PREPARATION (ALL 11 LABS) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold font-mono">
                ODD SEMESTER 2026-27
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                All 11 CSE Laboratories & Classes
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-foreground dark:text-white mt-1">
              Class Timetables & Equipment Readiness Overview
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review assigned classes across all laboratories to ensure workstation operating systems, compilers, networks, and lab benches are pre-calibrated.
            </p>
          </div>

          <button
            onClick={() => navigate('/timetable')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] hover:opacity-95 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 self-start md:self-auto shrink-0 transition"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Open Master Noticeboard Timetable →</span>
          </button>
        </div>

        {/* Day Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedDayFilter === day
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
              }`}
            >
              {day === 'ALL' ? 'All Weekdays' : day}
            </button>
          ))}
        </div>

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions
            .filter(s => selectedDayFilter === 'ALL' || s.date.toLowerCase() === selectedDayFilter.toLowerCase())
            .slice(0, 9)
            .map(session => {
              const lab = allLabs.find(l => l.id === session.laboratoryId);
              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl border border-border dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 hover:bg-slate-100/70 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                      {lab?.code || 'CS-LAB'} • {lab?.name?.replace('Laboratory', 'Lab') || 'Academic Lab'}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {session.date}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground dark:text-white leading-snug">
                      {session.title}
                    </h4>
                    <p className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                      {session.courseCode} {session.groupName ? `• ${session.groupName}` : ''}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {session.startTime} - {session.endTime}
                    </span>
                    <span className="font-bold text-foreground dark:text-slate-200">
                      {session.facultyName}
                    </span>
                  </div>

                  {session.requiredEquipment && session.requiredEquipment.length > 0 && (
                    <div className="text-[10px] text-muted-foreground bg-white dark:bg-slate-800 p-2 rounded-xl border border-border/50">
                      <span className="font-bold text-foreground">Equipment: </span>
                      {session.requiredEquipment.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {sessions.length > 9 && (
          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/timetable')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View all {sessions.length} practical classes in Master Noticeboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Two columns: Fault Tickets & Low Stock Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fault Tickets Queue */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Reported Fault Tickets
            </h3>
            <span className="text-xs font-bold text-rose-600">{faultTickets.length} Active</span>
          </div>

          <div className="space-y-3">
            {faultTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active malfunction tickets reported.
              </div>
            ) : (
              faultTickets.map(ticket => (
                <div key={ticket.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-foreground dark:text-white">{ticket.equipmentName}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Reported by {ticket.reportedByName} • {new Date(ticket.reportedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/maintenance')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  >
                    Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Low Stock & Reorder Alerts
            </h3>
            <span className="text-xs font-bold text-amber-600">{lowStock.length} Items</span>
          </div>

          <div className="space-y-3">
            {lowStock.map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground dark:text-white">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Location: {item.storageLocation} • Category: {item.category}
                  </p>
                  <p className="text-xs text-rose-600 font-bold mt-1">
                    Current: {item.quantity} {item.unit} (Min: {item.minStock} {item.unit})
                  </p>
                </div>
                <button
                  onClick={() => navigate('/procurement')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                >
                  Create Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
