import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  Search,
  Filter,
  Download,
  Printer,
  Sparkles,
  Edit3,
  Check,
  X,
  FileCheck,
  ChevronDown,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { exportAttendancePDF } from '../utils/pdfExport';
import {
  AttendanceRecord,
  AttendanceStatus,
  PracticalSession,
  StudentAttendanceItem
} from '../types';

export const AttendancePage: React.FC = () => {
  const { activeLab, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Recording Form State
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedClassBatch, setSelectedClassBatch] = useState<string>('SE&PM Lab (Batch A1)');
  const [roster, setRoster] = useState<StudentAttendanceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // History and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<AttendanceRecord | null>(null);

  // Correction Modal State
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionStudentId, setCorrectionStudentId] = useState('');
  const [correctionStudentName, setCorrectionStudentName] = useState('');
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');

  // SJBIT CSE Department Enrolled Scholars Roster
  const DEFAULT_ROSTER: StudentAttendanceItem[] = [
    { studentId: 'usr-stud-01', studentName: 'Kavya N', institutionId: '1JB23CS001', status: 'PRESENT' },
    { studentId: 'std-102', studentName: 'Abhishek R', institutionId: '1JB23CS002', status: 'PRESENT' },
    { studentId: 'std-103', studentName: 'Ananya S', institutionId: '1JB23CS003', status: 'PRESENT' },
    { studentId: 'std-104', studentName: 'Darshan Gowda', institutionId: '1JB23CS004', status: 'PRESENT' },
    { studentId: 'std-105', studentName: 'Deepika M', institutionId: '1JB23CS005', status: 'ABSENT' },
    { studentId: 'std-106', studentName: 'Harish Kumar', institutionId: '1JB23CS006', status: 'PRESENT' },
    { studentId: 'std-107', studentName: 'Keerthi S', institutionId: '1JB23CS007', status: 'PRESENT' },
    { studentId: 'std-108', studentName: 'Manoj K', institutionId: '1JB23CS008', status: 'PRESENT' },
    { studentId: 'std-109', studentName: 'Nischal B', institutionId: '1JB23CS009', status: 'PRESENT' },
    { studentId: 'std-110', studentName: 'Pooja V', institutionId: '1JB23CS010', status: 'PRESENT' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessList, attList] = await Promise.all([
        DataService.getPracticalSessions(activeLab?.id),
        DataService.getAttendanceRecords(activeLab?.id)
      ]);
      setSessions(sessList);
      setRecords(attList);
      if (sessList.length > 0) {
        setSelectedSessionId(sessList[0].id);
        setSelectedClassBatch(sessList[0].groupName);
      }
      setRoster(DEFAULT_ROSTER);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLab]);

  // Update roster status for student
  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRoster(prev =>
      prev.map(item => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  // Live Summary Calculations
  const totalCount = roster.length;
  const presentCount = roster.filter(s => s.status === 'PRESENT').length;
  const absentCount = roster.filter(s => s.status === 'ABSENT').length;
  const lateCount = roster.filter(s => s.status === 'LATE').length;
  const excusedCount = roster.filter(s => s.status === 'EXCUSED').length;
  const attendancePercentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const currentSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const handleSubmitAttendance = async () => {
    setSubmitting(true);
    setSuccessNotice(null);

    try {
      const newRecord = await DataService.createAttendanceRecord(
        {
          laboratoryId: activeLab?.id || 'lab-chem-01',
          laboratoryName: activeLab?.name || 'Academic Science Complex',
          sessionId: currentSession?.id,
          sessionTitle: currentSession?.title || 'General Laboratory Practical',
          courseCode: currentSession?.courseCode || 'LAB-301',
          classBatch: selectedClassBatch,
          date: new Date().toISOString().split('T')[0],
          facultyId: currentUser.id,
          facultyName: currentUser.displayName,
          students: roster,
          totalStudents: totalCount,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendancePercentage
        },
        currentUser
      );

      setSuccessNotice(`Attendance confirmed and archived for ${newRecord.sessionTitle}. (${presentCount}/${totalCount} students present)`);
      loadData();
      setActiveTab('history');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCorrection = (student: StudentAttendanceItem) => {
    setCorrectionStudentId(student.studentId);
    setCorrectionStudentName(student.studentName);
    setNewStatus(student.status);
    setCorrectionReason('');
    setIsCorrectionOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHistoryRecord || !correctionReason.trim()) return;

    try {
      await DataService.correctAttendance(
        selectedHistoryRecord.id,
        correctionStudentId,
        newStatus,
        correctionReason.trim(),
        currentUser
      );
      setIsCorrectionOpen(false);
      loadData();
      // Update local view
      const updated = await DataService.getAttendanceRecords(activeLab?.id);
      setSelectedHistoryRecord(updated.find(r => r.id === selectedHistoryRecord.id) || null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportPDF = (record: AttendanceRecord) => {
    exportAttendancePDF(record, activeLab?.name);
  };

  const exportCSV = (record: AttendanceRecord) => {
    const headers = ['Student ID', 'Student Name', 'Status', 'Check In Time', 'Remarks'];
    const rows = record.students.map(s => [
      `"${s.institutionId}"`,
      `"${s.studentName}"`,
      `"${s.status}"`,
      `"${s.checkInTime || '—'}"`,
      `"${(s.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${record.courseCode}_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner — Full Width on Mobile */}
      <div className="p-4.5 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 rounded-3xl text-[#172033] dark:text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 w-full">
        <div className="w-full">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Faculty Module
            </span>
            <span className="text-[#5B6478] dark:text-slate-400 text-xs font-semibold">
              {activeLab ? activeLab.name : 'All Facilities'}
            </span>
          </div>
          <h1 className="font-heading font-black text-xl sm:text-3xl lg:text-4xl text-[#172033] dark:text-white mt-2 w-full">
            Practical Session Attendance Management
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-[#5B6478] dark:text-slate-400 mt-1.5 w-full leading-relaxed font-medium">
            Record student laboratory attendance in real time, calculate verified presence ratios, process authorized corrections, and generate institutional compliance rosters.
          </p>
        </div>

        {/* Tab Switcher — Responsive on Phones */}
        <div className="w-full md:w-auto grid grid-cols-2 gap-1 bg-[#F5F6FC] dark:bg-slate-800 p-1.5 rounded-2xl border border-[#E4E7F0] dark:border-slate-700">
          <button
            onClick={() => setActiveTab('record')}
            className={`w-full text-center px-3 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 ${
              activeTab === 'record'
                ? 'bg-[#8961D8] text-white shadow-sm'
                : 'text-[#5B6478] hover:text-[#172033] dark:text-slate-300 hover:bg-white/60'
            }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full text-center px-3 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 ${
              activeTab === 'history'
                ? 'bg-[#8961D8] text-white shadow-sm'
                : 'text-[#5B6478] hover:text-[#172033] dark:text-slate-300 hover:bg-white/60'
            }`}
          >
            History ({records.length})
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="p-1 text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RECORD ATTENDANCE TAB */}
      {activeTab === 'record' ? (
        <div className="space-y-6">
          {/* Session Selector & Metadata Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 rounded-3xl shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-4">
              Step 1: Select Practical Session & Student Cohort
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5B6478] uppercase mb-1">
                  Active Practical Session
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    const matched = sessions.find(s => s.id === e.target.value);
                    if (matched) setSelectedClassBatch(matched.groupName);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] dark:border-slate-700 bg-[#F7F7FC] dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.courseCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6478] uppercase mb-1">
                  Class Batch / Cohort
                </label>
                <input
                  type="text"
                  value={selectedClassBatch}
                  onChange={(e) => setSelectedClassBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] dark:border-slate-700 bg-[#F7F7FC] dark:bg-slate-800 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6478] uppercase mb-1">
                  Faculty Supervisor
                </label>
                <div className="px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-[#20213A] dark:text-white">
                  {currentUser.displayName}
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Metrics Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-[#5B6478] block">Total Enrolled</span>
              <span className="font-heading font-black text-2xl text-[#20213A] dark:text-white mt-1 block">
                {totalCount}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Present</span>
              <span className="font-heading font-black text-2xl text-emerald-600 mt-1 block">
                {presentCount}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-rose-700 block">Absent</span>
              <span className="font-heading font-black text-2xl text-rose-600 mt-1 block">
                {absentCount}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Late</span>
              <span className="font-heading font-black text-2xl text-amber-600 mt-1 block">
                {lateCount}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 shadow-soft">
              <span className="text-[10px] font-bold uppercase text-cyan-800 block">Attendance Rate</span>
              <span className="font-heading font-black text-2xl text-cyan-900 mt-1 block">
                {attendancePercentage}%
              </span>
            </div>
          </div>

          {/* Student Roster Marking Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 rounded-3xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-[#E4E7F0] dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#20213A] dark:text-white">
                  Step 2: Mark Attendance Status
                </h3>
                <p className="text-xs text-[#5B6478]">Click status pills to mark attendance for each scholar.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setRoster(prev => prev.map(s => ({ ...s, status: 'PRESENT' })))}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs"
                >
                  Mark All Present
                </button>
              </div>
            </div>

            {/* UNIFIED DESKTOP TABLE — FULLY RESPONSIVE FOR PHONE & DESKTOP */}
            <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-2xl border border-[#E4E7F0] dark:border-slate-800">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="bg-[#F7F7FC] dark:bg-slate-800/60 uppercase font-bold text-[#5B6478] border-b border-[#E4E7F0] dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 sm:p-4">Roll / Student ID</th>
                    <th className="p-3.5 sm:p-4">Scholar Name</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Selector</th>
                    <th className="p-3.5 sm:p-4">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7F0] dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {roster.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-[#8961D8]">
                        {student.institutionId}
                      </td>
                      <td className="p-3.5 sm:p-4 font-bold text-sm text-[#20213A] dark:text-white whitespace-nowrap">
                        {student.studentName}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleSetStudentStatus(student.studentId, st)}
                              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] uppercase transition active:scale-95 ${
                                student.status === st
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                                    : st === 'LATE'
                                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
                                    : st === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/30'
                                    : 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-[#5B6478] hover:text-[#20213A] hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 sm:p-4 text-[#5B6478] min-w-[140px]">
                        <input
                          type="text"
                          value={student.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRoster(prev =>
                              prev.map(item => item.studentId === student.studentId ? { ...item, remarks: val } : item)
                            );
                          }}
                          placeholder="Optional remark..."
                          className="w-full bg-[#F7F7FC] dark:bg-slate-800 border border-[#E4E7F0] dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-[#332B40] dark:text-white placeholder-[#71667D] outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Submit Confirmation Bar — Responsive for Mobile Phone */}
            <div className="p-4 bg-[#F5F6FC] dark:bg-[#141E34] border-t border-[#E4E7F0] dark:border-[#26334A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <span className="text-xs text-[#5B6478] dark:text-[#B8C7DF] text-center sm:text-left font-medium">
                Ready to submit: <strong className="text-emerald-600">{presentCount} Present</strong> • <strong className="text-rose-600">{absentCount} Absent</strong> • <strong className="text-amber-500">{lateCount} Late</strong>
              </span>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitAttendance}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#8961D8] hover:bg-[#743BDB] text-white font-black text-xs sm:text-sm shadow-md shadow-[#8961D8]/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 active:scale-95"
              >
                <Check className="w-4 h-4 text-white" />
                <span>{submitting ? 'Confirming Attendance...' : 'Submit & Confirm Record'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ARCHIVED ATTENDANCE RECORDS & HISTORY TAB */
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 rounded-3xl shadow-soft flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by session title, course code, or cohort..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#E4E7F0] dark:border-slate-700 bg-[#F7F7FC] dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records
              .filter(r =>
                r.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.classBatch.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(record => (
                <div
                  key={record.id}
                  onClick={() => setSelectedHistoryRecord(record)}
                  className="p-5 bg-white dark:bg-slate-900 border border-[#E4E7F0] dark:border-slate-800 rounded-3xl shadow-card hover:shadow-card-hover hover:border-purple-300 transition cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        {record.courseCode}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {record.attendancePercentage}% Attendance
                      </span>
                    </div>

                    <h4 className="font-heading font-black text-lg text-[#20213A] dark:text-white mt-2">
                      {record.sessionTitle}
                    </h4>
                    <p className="text-xs text-[#5B6478] mt-0.5">
                      Batch: <strong>{record.classBatch}</strong> • Date: {record.date}
                    </p>
                    <p className="text-xs text-[#5B6478] mt-0.5">
                      Faculty: {record.facultyName}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E9DDF1] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#71667D]">
                      {record.presentCount} / {record.totalStudents} Present
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportPDF(record);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#F0E9FF] hover:bg-[#8961D8] hover:text-white text-[#8961D8] border border-[#BCA0F5]/50 text-xs font-bold flex items-center space-x-1 transition shadow-sm"
                        title="Download Official PDF Document"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportCSV(record);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF8F2] border border-[#E9DDF1] text-xs font-bold text-[#71667D] flex items-center space-x-1 transition"
                        title="Download CSV Spreadsheet"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RECORD DETAILS & CORRECTION MODAL */}
      {selectedHistoryRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 bg-white border-b border-[#E4E7F0] text-[#172033] flex items-start justify-between">
              <div>
                <span className="px-3 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono uppercase font-bold">
                  {selectedHistoryRecord.courseCode}
                </span>
                <h3 className="font-heading font-black text-2xl text-[#172033] mt-1">
                  {selectedHistoryRecord.sessionTitle}
                </h3>
                <p className="text-xs text-[#5B6478] mt-0.5">
                  Cohort: {selectedHistoryRecord.classBatch} • Date: {selectedHistoryRecord.date} • Verified by {selectedHistoryRecord.facultyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryRecord(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-[#5B6478]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-[#5B6478]">
                  Verified Student Roster ({selectedHistoryRecord.presentCount}/{selectedHistoryRecord.totalStudents} Present)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportPDF(selectedHistoryRecord)}
                    className="px-4 py-2 rounded-2xl bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition"
                    title="Download Institutional PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportCSV(selectedHistoryRecord)}
                    className="px-3 py-2 rounded-2xl bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-[#71667D] font-bold text-xs flex items-center space-x-1 transition"
                    title="Download CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="border border-[#E4E7F0] dark:border-slate-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[520px]">
                  <thead className="bg-[#F7F7FC] dark:bg-slate-800/60 uppercase font-bold text-[#5B6478]">
                    <tr>
                      <th className="p-3">Scholar</th>
                      <th className="p-3">Roll ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Check-In</th>
                      <th className="p-3 text-right">Correction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7F0] dark:divide-slate-800">
                    {selectedHistoryRecord.students.map(std => (
                      <tr key={std.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-[#20213A] dark:text-white">{std.studentName}</td>
                        <td className="p-3 font-mono text-purple-600 font-semibold">{std.institutionId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            std.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : std.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {std.status}
                          </span>
                        </td>
                        <td className="p-3 text-[#5B6478]">{std.checkInTime || '—'}</td>
                        <td className="p-3 text-right">
                          {currentUser.role !== 'student' && (
                            <button
                              type="button"
                              onClick={() => handleOpenCorrection(std)}
                              className="text-purple-600 font-bold hover:underline"
                            >
                              Edit Status
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedHistoryRecord.corrections && selectedHistoryRecord.corrections.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase block">
                    Audit Trail: Correction History
                  </span>
                  {selectedHistoryRecord.corrections.map((cor, idx) => (
                    <div key={idx} className="text-xs text-amber-900 leading-relaxed">
                      • {cor.studentName}: Changed from <strong>{cor.oldStatus}</strong> to <strong>{cor.newStatus}</strong> by {cor.updatedBy}. Reason: <em>"{cor.reason}"</em>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F7F7FC] dark:bg-slate-800/80 border-t border-[#E4E7F0] dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION DIALOG */}
      {isCorrectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] pb-3">
              <h3 className="font-heading font-black text-xl text-[#20213A]">
                Submit Attendance Correction
              </h3>
              <button onClick={() => setIsCorrectionOpen(false)}>
                <X className="w-5 h-5 text-[#5B6478]" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4 text-xs">
              <div>
                <span className="text-[#5B6478] block">Scholar:</span>
                <span className="font-bold text-sm text-[#20213A]">{correctionStudentName}</span>
              </div>

              <div>
                <label className="block font-bold text-[#5B6478] uppercase mb-1">
                  Adjusted Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E4E7F0] bg-[#F7F7FC] text-xs font-semibold outline-none"
                >
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#5B6478] uppercase mb-1">
                  Justification / Correction Reason
                </label>
                <textarea
                  required
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Student was attending dean office meeting with pre-approval note."
                  className="w-full px-3 py-2 rounded-xl border border-[#E4E7F0] bg-[#F7F7FC] text-xs outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
                >
                  Save & Log Correction
                </button>
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#5B6478] font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
