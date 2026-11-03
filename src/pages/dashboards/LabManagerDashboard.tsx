import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Cpu,
  Boxes,
  AlertTriangle,
  ArrowRightLeft,
  Wrench,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { SmartLabHealthScoreCard } from '../../components/SmartLabHealthScoreCard';
import {
  UniversalInventoryItem,
  EquipmentAsset,
  EquipmentBooking,
  ComputerWorkstation,
  PracticalSession,
  SmartHealthScore
} from '../../types';

interface LabManagerDashboardProps {
  onOpenQRScanner: () => void;
  onOpenLiveAvailability: () => void;
}

export const LabManagerDashboard: React.FC<LabManagerDashboardProps> = ({
  onOpenQRScanner,
  onOpenLiveAvailability
}) => {
  const { activeLab, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<UniversalInventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [workstations, setWorkstations] = useState<ComputerWorkstation[]>([]);
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [healthScore, setHealthScore] = useState<SmartHealthScore | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [inv, eq, bk, ws, ss, hs] = await Promise.all([
          DataService.getInventory(activeLab?.id),
          DataService.getEquipment(activeLab?.id),
          DataService.getBookings(activeLab?.id),
          DataService.getWorkstations(activeLab?.id),
          DataService.getPracticalSessions(activeLab?.id),
          DataService.calculateLabHealthScore(activeLab?.id)
        ]);
        setInventory(inv);
        setEquipment(eq);
        setBookings(bk);
        setWorkstations(ws);
        setSessions(ss);
        setHealthScore(hs);
      } catch (err) {
        console.error('Failed to load lab manager dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeLab]);

  if (loading || !healthScore) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const availableEq = equipment.filter(e => e.status === 'AVAILABLE').length;
  const pendingApprovals = bookings.filter(b => b.status === 'PENDING');
  const workingWs = workstations.filter(w => w.status === 'WORKING').length;
  const faultyWs = workstations.filter(w => w.status === 'FAULTY').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Lab Management Hub
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              {activeLab ? `${activeLab.building} • Rm ${activeLab.roomNumber}` : 'Facility Operations'}
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            {activeLab ? activeLab.name : 'Laboratory Manager'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Supervise practical class occupancy, technical instrumentation uptime, student loan approvals, and hazardous stock thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLiveAvailability}
            className="px-4 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold text-sm shadow-md transition"
          >
            Resource Matrix
          </button>
          <button
            onClick={onOpenQRScanner}
            className="px-4 py-2.5 rounded-2xl bg-[#F5F6FC] hover:bg-slate-100 text-[#172033] border border-[#E4E7F0] font-bold text-sm transition"
          >
            Scan QR
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Assigned Students</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {activeLab?.capacity ? activeLab.capacity * 4 : 128}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Across 4 semester batches</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Equipment Ready</span>
            <Cpu className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {availableEq} / {equipment.length}
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Ready for practicals</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Workstations</span>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {workingWs}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {faultyWs > 0 ? <strong className="text-rose-600">{faultyWs} Faulty</strong> : 'All Operational'}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Pending Bookings</span>
            <CalendarCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {pendingApprovals.length}
            </span>
            <p className="text-xs text-amber-600 font-semibold mt-1">Awaiting approval</p>
          </div>
        </div>
      </div>

      {/* Health Score */}
      <SmartLabHealthScoreCard score={healthScore} labName={activeLab?.name} />

      {/* Two Columns: Practical Sessions & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Sessions */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Current & Upcoming Sessions
            </h3>
            <span className="text-xs font-bold text-purple-600">Timetable</span>
          </div>

          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground dark:text-white">{s.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Batch: {s.groupName} • Instructor: {s.facultyName}
                  </p>
                  <p className="text-[11px] font-mono text-purple-600 mt-1">
                    {s.startTime} - {s.endTime}
                  </p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase ${
                  s.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals Queue */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Booking Approvals Queue
            </h3>
            <span className="text-xs font-bold text-amber-600">{pendingApprovals.length} Pending</span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No reservation requests pending approval.
              </div>
            ) : (
              pendingApprovals.map(b => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground dark:text-white">{b.equipmentName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested by {b.userName} • Start: {new Date(b.startTime).toLocaleTimeString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{b.purpose}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        await DataService.updateBookingStatus(b.id, 'CONFIRMED', currentUser);
                        setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'CONFIRMED' } : x));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
