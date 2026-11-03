import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CalendarCheck,
  Cpu,
  Users,
  FlaskConical,
  PlusCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Play
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { PracticalSession, EquipmentAsset, EquipmentBooking } from '../../types';

interface FacultyDashboardProps {
  onOpenLiveAvailability: () => void;
  onOpenQRScanner: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onOpenLiveAvailability,
  onOpenQRScanner
}) => {
  const { activeLab, currentUser } = useAuth();
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ss, eq, bk] = await Promise.all([
          DataService.getPracticalSessions(activeLab?.id),
          DataService.getEquipment(activeLab?.id),
          DataService.getBookings(activeLab?.id)
        ]);
        setSessions(ss);
        setEquipment(eq);
        setBookings(bk);
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
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

  const availableEq = equipment.filter(e => e.status === 'AVAILABLE');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Faculty Workspace
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">Curriculum & Research Portal</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Professor {currentUser.displayName}
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Coordinate student practical laboratory cohorts, reserve advanced instruments, issue digital lab manuals, and evaluate student observations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLiveAvailability}
            className="px-4 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold text-sm shadow-md transition"
          >
            Find Open Slots
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">My Sessions</span>
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {sessions.length}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Scheduled practicals</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Assigned Batches</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">3</span>
            <p className="text-xs text-muted-foreground mt-1">CS-IV, CS-VI, AI-Sem8</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Equipment Ready</span>
            <Cpu className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {availableEq.length}
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Available to reserve</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">My Reservations</span>
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {bookings.filter(b => b.userId === currentUser.id).length || 2}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Active lab bookings</p>
          </div>
        </div>
      </div>

      {/* Practical Sessions Workspace */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-extrabold text-xl text-foreground dark:text-white">
              Digital Practical Session Workspace
            </h3>
            <p className="text-xs text-muted-foreground">
              Syllabus exercises, reserved experiment kits, student attendance & observation logs
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
            Semester Practical Track
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(s => (
            <div key={s.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-600">
                    {s.startTime} - {s.endTime}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    s.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-heading font-black text-lg text-foreground dark:text-white mt-1">
                  {s.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cohort: <strong>{s.groupName}</strong> ({s.studentCount} enrolled scholars)
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border/80 dark:border-slate-800 text-xs text-muted-foreground">
                <span className="font-bold text-foreground dark:text-white block">Experiment Observations:</span>
                {s.observations || 'Execute benchmark runs and verify sensor readings.'}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {s.attendanceCount || 24} Present
                </span>
                <button
                  onClick={() => alert(`Opening digital session console for ${s.title}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Session Console</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
