import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  FileText,
  AlertCircle,
  Save,
  Search,
  Check,
  UserCheck,
  Sparkles,
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { PracticalSession, AttendanceStatus } from '../types';
import { DataService, localStore } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SessionConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PracticalSession | null;
  onSessionUpdated: () => void;
}

interface StudentRosterItem {
  id: string;
  name: string;
  usn: string;
  status: AttendanceStatus;
  workstationNumber: string;
}

const DEFAULT_COHORT_STUDENTS: { name: string; usn: string }[] = [
  { name: 'Kavya N', usn: '1JB23CS001' },
  { name: 'Abhishek R', usn: '1JB23CS002' },
  { name: 'Ananya S', usn: '1JB23CS003' },
  { name: 'Darshan Gowda', usn: '1JB23CS004' },
  { name: 'Deepika M', usn: '1JB23CS005' },
  { name: 'Harish Kumar', usn: '1JB23CS006' },
  { name: 'Keerthi S', usn: '1JB23CS007' },
  { name: 'Manoj K', usn: '1JB23CS008' },
  { name: 'Nischal B', usn: '1JB23CS009' },
  { name: 'Pooja V', usn: '1JB23CS010' },
  { name: 'Rahul Sharma', usn: '1JB23CS011' },
  { name: 'Sneha Patel', usn: '1JB23CS012' },
  { name: 'Varun Reddy', usn: '1JB23CS013' },
  { name: 'Yashaswini K', usn: '1JB23CS014' },
  { name: 'Tejaswini M', usn: '1JB23CS015' },
  { name: 'Aditya Rao', usn: '1JB23CS016' },
  { name: 'Bhavana Gowda', usn: '1JB23CS017' },
  { name: 'Chirag Patil', usn: '1JB23CS018' },
  { name: 'Divya Shree', usn: '1JB23CS019' },
  { name: 'Eshwar Prasad', usn: '1JB23CS020' },
  { name: 'Gautam Naik', usn: '1JB23CS021' },
  { name: 'Hemavathi R', usn: '1JB23CS022' },
  { name: 'Irfan Ahmed', usn: '1JB23CS023' },
  { name: 'Jyothi Sagar', usn: '1JB23CS024' },
  { name: 'Karthik Somayaji', usn: '1JB23CS025' },
  { name: 'Lavanya Bhat', usn: '1JB23CS026' },
  { name: 'Meghana Joshi', usn: '1JB23CS027' },
  { name: 'Naveen Kumar', usn: '1JB23CS028' },
  { name: 'Pranav Shetti', usn: '1JB23CS029' },
  { name: 'Rakshitha S', usn: '1JB23CS030' }
];

export const SessionConsoleModal: React.FC<SessionConsoleModalProps> = ({
  isOpen,
  onClose,
  session,
  onSessionUpdated
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'roster' | 'equipment' | 'observations'>('roster');
  const [currentStatus, setCurrentStatus] = useState<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'>('SCHEDULED');
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [observations, setObservations] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    power: true,
    safety: true,
    network: true,
    manuals: true
  });
  const [rubricScores, setRubricScores] = useState({
    execution: 4,
    safety: 5,
    viva: 4
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize or reset state when session opens
  useEffect(() => {
    if (session && isOpen) {
      setCurrentStatus(session.status);
      setObservations(session.observations || 'Benchmark execution and sensor analysis verified for scheduled cohort.');
      
      const count = Math.min(session.studentCount || 30, DEFAULT_COHORT_STUDENTS.length);
      const initialPresentCount = session.attendanceCount ?? Math.max(1, count - 2);

      const generatedRoster: StudentRosterItem[] = DEFAULT_COHORT_STUDENTS.slice(0, count).map((stud, idx) => ({
        id: `stud-${session.id}-${idx + 1}`,
        name: stud.name,
        usn: stud.usn,
        status: idx < initialPresentCount ? 'PRESENT' : 'ABSENT',
        workstationNumber: `WS-${String(idx + 1).padStart(2, '0')}`
      }));

      setRoster(generatedRoster);
      setNotification(null);
      setElapsedSeconds(session.status === 'IN_PROGRESS' ? 1420 : 0);
      setTimerRunning(session.status === 'IN_PROGRESS');
    }
  }, [session, isOpen]);

  // Elapsed time tracker for live session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  if (!isOpen || !session) return null;

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStatusChange = (newStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') => {
    setCurrentStatus(newStatus);
    if (newStatus === 'IN_PROGRESS') {
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRoster(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const markAll = (status: AttendanceStatus) => {
    setRoster(prev => prev.map(s => ({ ...s, status })));
  };

  // Metrics
  const totalCount = roster.length;
  const presentCount = roster.filter(s => s.status === 'PRESENT').length;
  const absentCount = roster.filter(s => s.status === 'ABSENT').length;
  const lateCount = roster.filter(s => s.status === 'LATE').length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const filteredRoster = roster.filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.workstationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      await DataService.updatePracticalSession(
        session.id,
        {
          status: currentStatus,
          attendanceCount: presentCount + lateCount,
          observations: observations.trim()
        },
        currentUser
      );

      setNotification({
        type: 'success',
        message: 'Practical Session Console state and attendance synced successfully!'
      });
      onSessionUpdated();

      setTimeout(() => {
        setNotification(null);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to update practical session console:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save session updates.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-border dark:border-slate-800 flex flex-col overflow-hidden text-foreground dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border dark:border-slate-800 bg-gradient-to-r from-purple-50 via-white to-purple-50/40 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold uppercase tracking-wider">
                {session.courseCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                Cohort: {session.groupName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                {session.startTime} - {session.endTime}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                currentStatus === 'IN_PROGRESS'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                  : currentStatus === 'COMPLETED'
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
              }`}>
                {currentStatus === 'IN_PROGRESS' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                {currentStatus.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground dark:text-white">
              {session.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Instructor: <strong className="text-foreground dark:text-white">{session.facultyName}</strong> • Lab Room: <strong className="text-foreground dark:text-white">{session.laboratoryId}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close Console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Controller Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-border dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-muted-foreground">Session Elapsed:</span>
              <span className="text-sm font-mono font-bold text-foreground dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-border dark:border-slate-700">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Attendance:</span>
              <span className="font-bold text-emerald-600">{presentCount + lateCount}/{totalCount} ({attendanceRate}%)</span>
            </div>
          </div>

          {/* Quick Lifecycle Status Buttons */}
          <div className="flex items-center gap-2">
            {currentStatus !== 'IN_PROGRESS' ? (
              <button
                type="button"
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Practical</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('SCHEDULED')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleStatusChange('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                currentStatus === 'COMPLETED'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conclude Lab</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-border dark:border-slate-800 flex gap-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'roster'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Scholar Attendance ({presentCount}/{totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'equipment'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Apparatus & Workstations</span>
          </button>

          <button
            onClick={() => setActiveTab('observations')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'observations'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Observations & Rubric</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {notification && (
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: ROSTER & ATTENDANCE */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Stat Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase block">Enrolled</span>
                  <span className="text-xl font-heading font-black text-purple-900 dark:text-purple-100">{totalCount} Scholars</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Present</span>
                  <span className="text-xl font-heading font-black text-emerald-900 dark:text-emerald-100">{presentCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase block">Late</span>
                  <span className="text-xl font-heading font-black text-amber-900 dark:text-amber-100">{lateCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase block">Absent</span>
                  <span className="text-xl font-heading font-black text-rose-900 dark:text-rose-100">{absentCount}</span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by student name, USN, or workstation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markAll('PRESENT')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll('ABSENT')}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto divide-y divide-border dark:divide-slate-800">
                  {filteredRoster.map(student => (
                    <div
                      key={student.id}
                      className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs text-foreground dark:text-white truncate">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {student.usn} • <span className="text-purple-600 font-semibold">{student.workstationNumber}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.id, 'PRESENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.id, 'LATE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'LATE'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.id, 'ABSENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredRoster.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No scholars found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPARATUS & EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
                <h4 className="font-heading font-black text-sm text-foreground dark:text-white flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <span>Required Laboratory Instruments</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Apparatus allocated specifically for this practical session curriculum syllabus.
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(session.requiredEquipment && session.requiredEquipment.length > 0
                    ? session.requiredEquipment
                    : ['Workstation High-Spec Node', 'Digital Storage Oscilloscope', 'Local Loop Switch']
                  ).map((equipName, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-foreground dark:text-white">{equipName}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Operational
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-Lab Setup Checklist */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-border dark:border-slate-800">
                <h4 className="font-heading font-black text-sm text-foreground dark:text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Instructor Pre-Lab Readiness Verification</span>
                </h4>

                <div className="space-y-2.5">
                  {[
                    { key: 'power', label: 'All workstation power rails and terminal grounding verified' },
                    { key: 'safety', label: 'Safety protocols and emergency stop controls briefed to students' },
                    { key: 'network', label: 'Local Gigabit VLAN network & test server routes active' },
                    { key: 'manuals', label: 'Digital lab manual & source code templates accessible to scholars' }
                  ].map(item => (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.key] || false}
                        onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-border"
                      />
                      <span className="text-xs font-semibold text-foreground dark:text-slate-200">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OBSERVATIONS & RUBRIC */}
          {activeTab === 'observations' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-foreground dark:text-white mb-1.5">
                  Practical Experiment Observations & Notes
                </label>
                <textarea
                  rows={4}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Record experiment findings, cohort performance remarks, apparatus issues or anomalies..."
                  className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground dark:text-white"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  These observation notes will be recorded in the departmental laboratory audit log and visible on the faculty dashboard.
                </p>
              </div>

              {/* Viva Evaluation Matrix */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800">
                <h4 className="font-heading font-black text-sm text-foreground dark:text-white flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Cohort Practical Rubric Assessment (Out of 5)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">Experiment Execution</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={rubricScores.execution}
                      onChange={e => setRubricScores(prev => ({ ...prev, execution: parseInt(e.target.value) }))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-muted-foreground">Novice</span>
                      <span className="text-xs font-bold text-purple-600">{rubricScores.execution} / 5</span>
                      <span className="text-[10px] text-muted-foreground">Flawless</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">Safety & Protocol</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={rubricScores.safety}
                      onChange={e => setRubricScores(prev => ({ ...prev, safety: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-muted-foreground">Standard</span>
                      <span className="text-xs font-bold text-emerald-600">{rubricScores.safety} / 5</span>
                      <span className="text-[10px] text-muted-foreground">Strict</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">Viva Voce Understanding</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={rubricScores.viva}
                      onChange={e => setRubricScores(prev => ({ ...prev, viva: parseInt(e.target.value) }))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-muted-foreground">Adequate</span>
                      <span className="text-xs font-bold text-purple-600">{rubricScores.viva} / 5</span>
                      <span className="text-[10px] text-muted-foreground">Mastery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/attendance');
            }}
            className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 order-2 sm:order-1"
          >
            <span>Open Institutional Attendance Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Console Updates</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
