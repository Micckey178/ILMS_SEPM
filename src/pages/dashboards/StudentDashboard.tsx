import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Cpu,
  Clock,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  QrCode,
  Building2,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import {
  PracticalSession,
  EquipmentBooking,
  IssueReturnTransaction,
  EquipmentAsset
} from '../../types';

interface StudentDashboardProps {
  onOpenQRScanner: () => void;
  onOpenFaultReport: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenQRScanner,
  onOpenFaultReport
}) => {
  const navigate = useNavigate();
  const { currentUser, activeLab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mySessions, setMySessions] = useState<PracticalSession[]>([]);
  const [myBookings, setMyBookings] = useState<EquipmentBooking[]>([]);
  const [myLoans, setMyLoans] = useState<IssueReturnTransaction[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentAsset[]>([]);

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      try {
        const allottedIds = currentUser.assignedLabs && currentUser.assignedLabs.length > 0
          ? currentUser.assignedLabs
          : (currentUser.assignedLabId ? [currentUser.assignedLabId] : (activeLab ? [activeLab.id] : []));

        const [allSessionsList, allBookings, allTransactions, equipment] = await Promise.all([
          DataService.getPracticalSessions(),
          DataService.getBookings(activeLab?.id),
          DataService.getIssueReturnTransactions(activeLab?.id),
          DataService.getEquipment(activeLab?.id)
        ]);

        const studentSessions = allSessionsList.filter(s =>
          allottedIds.length === 0 || allottedIds.includes(s.laboratoryId)
        );

        setMySessions(studentSessions);
        // Filter strictly to current student's records for privacy
        setMyBookings(allBookings.filter(b => b.userId === currentUser.id));
        setMyLoans(allTransactions.filter(l => l.borrowerId === currentUser.id));
        setAvailableEquipment(equipment.filter(e => e.status === 'AVAILABLE').slice(0, 4));
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, [activeLab, currentUser]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeLoans = myLoans.filter(l => l.status === 'ISSUED');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Student Welcome Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Student Lab Space
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              Enrolled: {activeLab ? activeLab.name : 'Engineering & Sciences'}
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Welcome back, {currentUser.displayName}!
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            View your upcoming practical experiments, track borrowed equipment return deadlines, and reserve laboratory apparatus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/bookings')}
            className="px-4 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold text-sm shadow-md transition"
          >
            Reserve Equipment
          </button>
          <button
            onClick={onOpenQRScanner}
            className="px-4 py-2.5 rounded-2xl bg-[#F5F6FC] hover:bg-slate-100 text-[#172033] border border-[#E4E7F0] font-bold text-sm flex items-center gap-2 transition"
          >
            <QrCode className="w-4 h-4 text-[#172033]" />
            <span>Scan QR</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">My Sessions</span>
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {mySessions.length}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Scheduled practical classes</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Issued Equipment</span>
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {activeLoans.length}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Currently checked out</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">My Bookings</span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl text-foreground dark:text-white">
              {myBookings.length}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Equipment reservations</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Support & Help</span>
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-3">
            <button
              onClick={onOpenFaultReport}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline block"
            >
              Report Broken Instrument
            </button>
            <p className="text-xs text-muted-foreground mt-1">Instant technician dispatch</p>
          </div>
        </div>
      </div>

      {/* Two columns: Upcoming Practical Sessions & My Issued Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Practicals */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Upcoming Practical Sessions
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-purple-600 font-mono">Curriculum</span>
              <button
                type="button"
                onClick={() => navigate('/schedule')}
                className="text-xs font-black text-[#8961D8] hover:underline flex items-center gap-1"
              >
                <span>View Full Timetable →</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {mySessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No scheduled practical classes for today.
              </div>
            ) : (
              mySessions.map(session => (
                <div key={session.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-600">
                      {session.startTime} - {session.endTime}
                    </span>
                    <h4 className="font-bold text-sm text-foreground dark:text-white mt-0.5">
                      {session.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Instructor: {session.facultyName} • Group: {session.groupName}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    session.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Issued Loans & Deadlines */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              My Borrowed Equipment & Deadlines
            </h3>
            <span className="text-xs font-bold text-blue-600 font-mono">Active Loans</span>
          </div>

          <div className="space-y-3">
            {activeLoans.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                You have no loaned equipment currently in your possession.
              </div>
            ) : (
              activeLoans.map(loan => (
                <div key={loan.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground dark:text-white">{loan.itemName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due date: <strong>{new Date(loan.expectedReturnDate).toLocaleDateString()}</strong>
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-100 text-purple-700">
                    Checked Out
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
