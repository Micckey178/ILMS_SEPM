import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Building2,
  Cpu,
  Layers,
  X,
  Search,
  RotateCcw,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Table as TableIcon,
  UserCheck,
  MapPin,
  Coffee,
  UtensilsCrossed,
  ArrowRight,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { EquipmentBooking, PracticalSession, MaintenanceRecord, Laboratory } from '../types';

export const CalendarPage: React.FC = () => {
  const { activeLab, currentUser, switchLaboratory } = useAuth();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'timetable' | 'faculty' | 'month' | 'week' | 'agenda'>('timetable');
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('ALL');

  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const disciplines = [
    'ALL',
    'Computer Science',
    'Electronics',
    'Physics',
    'Chemistry',
    'Mechanical',
    'Biotechnology'
  ];

  // Load labs & events
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [labs, bk, ss, mn] = await Promise.all([
          DataService.getLaboratories(),
          DataService.getBookings(),
          DataService.getPracticalSessions(),
          DataService.getMaintenanceRecords()
        ]);
        setLaboratories(labs);
        setBookings(bk);
        setSessions(ss);
        setMaintenances(mn);

        // Default timetable to active lab if set, otherwise first lab
        if (activeLab?.id) {
          setSelectedLabId(activeLab.id);
        } else if (labs.length > 0) {
          setSelectedLabId(labs[0].id);
        }
      } catch (err) {
        console.error('Failed to load schedule events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeLab]);

  // Selected laboratory object
  const currentLab = useMemo(() => {
    return laboratories.find(l => l.id === selectedLabId) || activeLab || laboratories[0];
  }, [laboratories, selectedLabId, activeLab]);

  // Distinct faculty list for filter dropdown
  const allFacultyNames = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      if (s.facultyName) {
        s.facultyName.split(',').forEach(f => {
          const clean = f.trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Convert weekday sessions into dated events for the calendar month
  const calendarPracticalEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results: any[] = [];

    const dayNameToWeekday: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(year, month, day);
      const weekdayNum = thisDate.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      sessions.forEach(s => {
        const sessionDay = s.date?.toLowerCase().trim();
        const matchesWeekday = sessionDay ? dayNameToWeekday[sessionDay] === weekdayNum : false;
        const matchesExactDate = s.date === dateStr;

        if (matchesWeekday || matchesExactDate) {
          const lab = laboratories.find(l => l.id === s.laboratoryId);
          results.push({
            id: `${s.id}-${dateStr}`,
            sessionId: s.id,
            title: `${s.groupName || s.title} (${s.courseCode})`,
            rawTitle: s.title,
            courseCode: s.courseCode,
            groupName: s.groupName,
            category: 'Practical Timetable',
            type: 'practical',
            discipline: 'Computer Science',
            date: dateStr,
            dayOfWeek: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            timeStr: `${s.startTime} - ${s.endTime}`,
            user: s.facultyName,
            facultyName: s.facultyName,
            resource: s.requiredEquipment?.join(', ') || 'Computer Workstations',
            laboratoryId: s.laboratoryId,
            labName: lab?.name || 'Computer Science Lab',
            labCode: lab?.code || 'CS-LAB',
            labIncharge: lab?.managerName || 'Department Faculty',
            roomNumber: lab?.roomNumber || 'CSE Academic Block',
            status: s.status,
            studentCount: s.studentCount,
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
          });
        }
      });
    }

    return results;
  }, [currentDate, sessions, laboratories]);

  // Aggregate all events
  const allEvents = useMemo(() => {
    const bookingEvents = bookings.map(b => {
      const lab = laboratories.find(l => l.id === b.laboratoryId);
      return {
        id: b.id,
        title: `${b.equipmentName} Reservation`,
        rawTitle: b.equipmentName,
        category: 'Equipment Booking',
        type: 'booking',
        discipline: 'Computer Science',
        date: b.startTime.split('T')[0] || new Date().toISOString().split('T')[0],
        dayOfWeek: new Date(b.startTime).toLocaleDateString([], { weekday: 'long' }),
        startTime: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeStr: `${new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        user: b.userName,
        facultyName: b.userName,
        resource: b.equipmentName,
        laboratoryId: b.laboratoryId,
        labName: lab?.name || 'Academic Lab',
        labCode: lab?.code || 'LAB',
        labIncharge: lab?.managerName || '',
        roomNumber: lab?.roomNumber || '',
        status: b.status,
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
      };
    });

    const maintenanceEvents = maintenances.map(m => {
      const lab = laboratories.find(l => l.id === m.laboratoryId);
      return {
        id: m.id,
        title: `${m.equipmentName} Calibration`,
        rawTitle: m.equipmentName,
        category: 'Maintenance & Calibration',
        type: 'maintenance',
        discipline: 'Computer Science',
        date: m.scheduledDate.split('T')[0],
        dayOfWeek: new Date(m.scheduledDate).toLocaleDateString([], { weekday: 'long' }),
        startTime: '09:00 AM',
        endTime: '11:30 AM',
        timeStr: '09:00 AM - 11:30 AM',
        user: m.technicianName,
        facultyName: m.technicianName,
        resource: m.equipmentName,
        laboratoryId: m.laboratoryId,
        labName: lab?.name || 'Maintenance Facility',
        labCode: lab?.code || 'LAB',
        labIncharge: lab?.managerName || '',
        roomNumber: lab?.roomNumber || '',
        status: m.status,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
      };
    });

    return [...calendarPracticalEvents, ...bookingEvents, ...maintenanceEvents];
  }, [bookings, maintenances, calendarPracticalEvents, laboratories]);

  // Filtering
  const filteredEvents = useMemo(() => {
    return allEvents.filter(evt => {
      const matchesSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.labName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLab =
        selectedLabId === 'ALL' || evt.laboratoryId === selectedLabId;

      const matchesDay =
        selectedDay === 'ALL' || evt.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase();

      const matchesFaculty =
        selectedFaculty === 'ALL' || evt.user.toLowerCase().includes(selectedFaculty.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' || evt.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesLab && matchesDay && matchesFaculty && matchesStatus;
    });
  }, [allEvents, searchQuery, selectedLabId, selectedDay, selectedFaculty, selectedStatus]);

  // Sessions filtered for the Timetable Noticeboard grid
  const timetableSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesLab = selectedLabId === 'ALL' || s.laboratoryId === selectedLabId;
      const matchesSearch =
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.groupName && s.groupName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFaculty =
        selectedFaculty === 'ALL' || s.facultyName.toLowerCase().includes(selectedFaculty.toLowerCase());

      return matchesLab && matchesSearch && matchesFaculty;
    });
  }, [sessions, selectedLabId, searchQuery, selectedFaculty]);

  // Noticeboard Morning & Afternoon Faculty Table Map
  const noticeboardFacultyRoster = useMemo(() => {
    const map: Record<string, { morning: string[]; afternoon: string[] }> = {
      Monday: { morning: [], afternoon: [] },
      Tuesday: { morning: [], afternoon: [] },
      Wednesday: { morning: [], afternoon: [] },
      Thursday: { morning: [], afternoon: [] },
      Friday: { morning: [], afternoon: [] },
      Saturday: { morning: [], afternoon: [] }
    };

    timetableSessions.forEach(s => {
      const day = s.date;
      if (map[day]) {
        const timeHour = parseInt(s.startTime.split(':')[0], 10);
        const isPM = s.startTime.toLowerCase().includes('pm');
        const normalizedHour = isPM && timeHour !== 12 ? timeHour + 12 : timeHour;

        if (normalizedHour < 13) {
          if (!map[day].morning.includes(s.facultyName)) map[day].morning.push(s.facultyName);
        } else {
          if (!map[day].afternoon.includes(s.facultyName)) map[day].afternoon.push(s.facultyName);
        }
      }
    });

    return map;
  }, [timetableSessions]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDay('ALL');
    setSelectedFaculty('ALL');
    setSelectedStatus('ALL');
    setSelectedLabId('ALL');
  };

  const exportICS = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SJBIT CSE//ILMS Timetable//EN\n';
    filteredEvents.slice(0, 50).forEach(evt => {
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `SUMMARY:${evt.title}\n`;
      icsContent += `DESCRIPTION:Faculty: ${evt.user} | Lab: ${evt.labName}\n`;
      icsContent += `LOCATION:${evt.labName} (${evt.roomNumber})\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += 'END:VEVENT\n';
    });
    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sjbit-timetable-schedule-${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
  };

  // Helper to extract session for a cell in the Noticeboard Grid
  const getSessionForSlot = (day: string, slot: '8:30' | '10:45' | '1:30' | '2:30') => {
    return timetableSessions.find(s => {
      if (s.date.toLowerCase() !== day.toLowerCase()) return false;
      const start = s.startTime.toLowerCase();
      if (slot === '8:30') return start.includes('8:30') || start.includes('08:30');
      if (slot === '10:45') return start.includes('10:45');
      if (slot === '1:30') return start.includes('1:30') || start.includes('01:30');
      if (slot === '2:30') return start.includes('2:30') || start.includes('02:30');
      return false;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HERO HEADER & TIMETABLE BRAND */}
      <div className="p-6 sm:p-8 bg-white border border-[#E9DDF1] rounded-3xl text-[#332B40] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/50 font-mono text-xs uppercase font-extrabold tracking-wider">
              Odd Semester 2026-27 • w.e.f: 07/09/2026
            </span>
            <span className="text-[#71667D] text-xs font-semibold">
              SJB Institute of Technology • Dept of Computer Science & Engineering
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#332B40] mt-2 tracking-tight">
            Laboratory Timetable & Faculty Schedule
          </h1>
          <p className="text-sm sm:text-base text-[#71667D] mt-1 max-w-2xl leading-relaxed">
            Real-time schedule planner showing exactly <strong>who is taking which practical class at what time</strong> across all 11 CSE laboratories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportICS}
            className="px-4 py-2.5 rounded-full bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border border-[#E9DDF1] font-bold text-sm flex items-center gap-2 transition active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4 text-[#8961D8]" />
            <span>Export Timetable (.ics)</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY VIEW MODE TOGGLES (NOTICEBOARD TIMETABLE / FACULTY DIRECTORY / CALENDAR) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('timetable')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition flex items-center space-x-2 ${
              viewMode === 'timetable'
                ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-md'
                : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Noticeboard Timetable Grid</span>
          </button>

          <button
            onClick={() => setViewMode('faculty')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition flex items-center space-x-2 ${
              viewMode === 'faculty'
                ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-md'
                : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Who Is Taking Which Class</span>
          </button>

          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition flex items-center space-x-2 ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-md'
                : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Monthly Calendar</span>
          </button>

          <button
            onClick={() => setViewMode('agenda')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition flex items-center space-x-2 ${
              viewMode === 'agenda'
                ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-md'
                : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Agenda Stream</span>
          </button>
        </div>

        {/* Total Practical Sessions Counter */}
        <div className="flex items-center space-x-2 text-xs font-bold text-[#71667D] px-3 py-1.5 rounded-full bg-[#FFF8F2] border border-[#E9DDF1] shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#8961D8]" />
          <span>{sessions.length} Scheduled Batches Loaded</span>
        </div>
      </div>

      {/* 3. INTERACTIVE CONTROLS & FILTER TOOLBAR */}
      <div className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-4">
        {/* Top Controls: Search + Laboratory Selector */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search by teacher or class */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71667D]" />
            <input
              type="text"
              placeholder="Search faculty name (e.g. Roopa, Ajay, Suma, Chetana, Manjula), course or batch..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs font-semibold text-[#332B40] placeholder-[#71667D] focus:outline-none focus:ring-2 focus:ring-[#BCA0F5]"
            />
          </div>

          {/* Laboratory Selector (All 11 Labs) */}
          <div className="flex items-center gap-2 min-w-[260px]">
            <Building2 className="w-4 h-4 text-[#8961D8] shrink-0" />
            <select
              value={selectedLabId}
              onChange={e => setSelectedLabId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs font-bold text-[#332B40] focus:outline-none focus:ring-2 focus:ring-[#BCA0F5]"
            >
              <option value="ALL">All 11 SJBIT CSE Laboratories</option>
              {laboratories
                .filter(l => l.id !== 'lab-chem-01')
                .map(lab => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} ({lab.code}) — Incharge: {lab.managerName}
                  </option>
                ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <GraduationCap className="w-4 h-4 text-[#8961D8] shrink-0" />
            <select
              value={selectedFaculty}
              onChange={e => setSelectedFaculty(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs font-bold text-[#332B40] focus:outline-none focus:ring-2 focus:ring-[#BCA0F5]"
            >
              <option value="ALL">All Faculty Instructors</option>
              {allFacultyNames.map(fac => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of Week Selector Pills */}
        <div className="pt-3 border-t border-[#E9DDF1] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71667D] mr-2">
              Day Filter:
            </span>
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDay === 'ALL'
                  ? 'bg-[#332B40] text-white shadow-xs'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              Whole Week (Mon–Sat)
            </button>
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedDay === day
                    ? 'bg-[#8961D8] text-white shadow-xs'
                    : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {(searchQuery || selectedLabId !== 'ALL' || selectedDay !== 'ALL' || selectedFaculty !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: NOTICEBOARD TIMETABLE GRID (DIGITAL POSTER REPLICA) */}
      {/* ======================================================== */}
      {viewMode === 'timetable' && (
        <div className="space-y-6">
          {/* Header of Active Timetable Poster */}
          <div className="p-6 bg-gradient-to-r from-[#FFF8F2] via-white to-[#F0E9FF] border-2 border-[#BCA0F5]/40 rounded-3xl shadow-sm text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="px-3 py-0.5 rounded-full bg-[#BCA0F5] text-white text-[11px] font-black uppercase tracking-wider">
                Official Department Timetable
              </span>
              <span className="text-xs font-extrabold text-[#71667D]">
                Department of Computer Science & Engineering
              </span>
            </div>

            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#332B40]">
              {selectedLabId === 'ALL' ? 'Comprehensive All-Labs Overview' : currentLab?.name}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#71667D] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8961D8]" />
                {currentLab?.roomNumber || 'CSE Academic Block'}
              </span>
              <span className="flex items-center gap-1 bg-[#FBE5EF] px-3 py-1 rounded-full text-[#332B40] border border-[#E9DDF1]">
                <BadgeCheck className="w-4 h-4 text-[#8961D8]" />
                <strong>LAB INCHARGE:</strong> {currentLab?.managerName || 'Assigned Faculty'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#8961D8]" />
                Timing: 08:30 AM – 04:30 PM (Mon–Sat)
              </span>
            </div>
          </div>

          {/* Time Table Matrix Table */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center min-w-[950px]">
                <thead>
                  <tr className="bg-[#FFF8F2] border-b border-[#E9DDF1] text-[11px] font-black text-[#332B40] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-24 border-r border-[#E9DDF1]">DAY</th>
                    <th className="py-3 px-3 border-r border-[#E9DDF1]">
                      8:30 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 9:30</span>
                    </th>
                    <th className="py-3 px-3 border-r border-[#E9DDF1]">
                      9:30 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 10:30</span>
                    </th>
                    <th className="py-3 px-2 w-14 bg-[#FBE5EF]/70 border-r border-[#E9DDF1] text-[#8961D8]">
                      TEA <br /><span className="text-[9px]">10:30-10:45</span>
                    </th>
                    <th className="py-3 px-3 border-r border-[#E9DDF1]">
                      10:45 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 11:45</span>
                    </th>
                    <th className="py-3 px-3 border-r border-[#E9DDF1]">
                      11:45 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 12:45</span>
                    </th>
                    <th className="py-3 px-2 w-16 bg-[#FFF8F2] border-r border-[#E9DDF1] text-[#8961D8]">
                      LUNCH <br /><span className="text-[9px]">12:45-1:30</span>
                    </th>
                    <th className="py-3 px-3 border-r border-[#E9DDF1]">
                      1:30 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 2:30</span>
                    </th>
                    <th className="py-3 px-3 border-r border-[#E9DDF1]">
                      2:30 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 3:30</span>
                    </th>
                    <th className="py-3 px-3">
                      3:30 <br /><span className="text-[10px] font-semibold text-[#71667D]">to 4:30</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E9DDF1] text-xs">
                  {DAYS_OF_WEEK.map((day, dIdx) => {
                    const shortDay = DAYS_SHORT[dIdx];
                    const morningSlot1 = getSessionForSlot(day, '8:30');
                    const morningSlot2 = getSessionForSlot(day, '10:45');
                    const afternoonSlot1 = getSessionForSlot(day, '1:30');
                    const afternoonSlot2 = getSessionForSlot(day, '2:30');

                    // If filtered by day and not matched, hide row
                    if (selectedDay !== 'ALL' && selectedDay.toLowerCase() !== day.toLowerCase()) {
                      return null;
                    }

                    return (
                      <tr key={day} className="hover:bg-[#FFF8F2]/50 transition">
                        {/* Day Column */}
                        <td className="py-4 px-3 font-black text-sm text-[#332B40] bg-[#FFF8F2] border-r border-[#E9DDF1]">
                          {shortDay}
                        </td>

                        {/* Morning 8:30 - 10:30 (Spans 2 periods) */}
                        {morningSlot1 ? (
                          <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                            <div
                              onClick={() => setSelectedEvent(morningSlot1)}
                              className="p-3 rounded-2xl bg-gradient-to-r from-[#F0E9FF] to-[#FBE5EF] border border-[#BCA0F5] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                            >
                              <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                <span>{morningSlot1.groupName || morningSlot1.title}</span>
                                <span className="text-[10px] font-bold text-[#8961D8]">{morningSlot1.startTime}</span>
                              </div>
                              <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                👨‍🏫 {morningSlot1.facultyName}
                              </p>
                              <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                {laboratories.find(l => l.id === morningSlot1.laboratoryId)?.name}
                              </p>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                            <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                          </>
                        )}

                        {/* Tea Break Column */}
                        <td className="bg-[#FBE5EF]/40 border-r border-[#E9DDF1] text-[10px] font-black text-[#8961D8] writing-mode-vertical">
                          TEA
                        </td>

                        {/* Mid-Morning 10:45 - 12:45 (Spans 2 periods) */}
                        {morningSlot2 ? (
                          <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                            <div
                              onClick={() => setSelectedEvent(morningSlot2)}
                              className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#F0E9FF] border border-[#FFD2BF] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                            >
                              <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                <span>{morningSlot2.groupName || morningSlot2.title}</span>
                                <span className="text-[10px] font-bold text-[#8961D8]">{morningSlot2.startTime}</span>
                              </div>
                              <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                👨‍🏫 {morningSlot2.facultyName}
                              </p>
                              <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                {laboratories.find(l => l.id === morningSlot2.laboratoryId)?.name}
                              </p>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                            <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                          </>
                        )}

                        {/* Lunch Break Column */}
                        <td className="bg-[#FFF8F2] border-r border-[#E9DDF1] text-[10px] font-black text-[#8961D8]">
                          LUNCH
                        </td>

                        {/* Afternoon 1:30 - 2:30 (Single or Spanned) */}
                        {afternoonSlot1 ? (
                          <td className="p-2 border-r border-[#E9DDF1]">
                            <div
                              onClick={() => setSelectedEvent(afternoonSlot1)}
                              className="p-2.5 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                            >
                              <span className="font-heading font-black text-xs text-[#332B40] block truncate">
                                {afternoonSlot1.groupName || afternoonSlot1.title}
                              </span>
                              <span className="text-[10px] font-bold text-[#8961D8] block truncate">
                                {afternoonSlot1.facultyName}
                              </span>
                            </div>
                          </td>
                        ) : (
                          <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                        )}

                        {/* Afternoon 2:30 - 4:30 (Spans 2 periods) */}
                        {afternoonSlot2 ? (
                          <td colSpan={2} className="p-2">
                            <div
                              onClick={() => setSelectedEvent(afternoonSlot2)}
                              className="p-3 rounded-2xl bg-gradient-to-r from-[#FBE5EF] to-[#FFF8F2] border border-[#E9DDF1] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                            >
                              <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                <span>{afternoonSlot2.groupName || afternoonSlot2.title}</span>
                                <span className="text-[10px] font-bold text-[#8961D8]">{afternoonSlot2.startTime}</span>
                              </div>
                              <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                👨‍🏫 {afternoonSlot2.facultyName}
                              </p>
                              <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                {laboratories.find(l => l.id === afternoonSlot2.laboratoryId)?.name}
                              </p>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                            <td className="p-2 text-[#71667D]/40 text-xs italic">—</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Authentic Faculty Incharge Summary Table (Morning & Afternoon Roster) */}
          <div className="p-6 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-lg text-[#332B40] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#8961D8]" />
                  Faculty Duty Roster (Morning vs. Afternoon)
                </h3>
                <p className="text-xs text-[#71667D]">
                  Official department faculty breakdown by morning (08:30 - 12:45) and afternoon (01:30 - 04:30) slots.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E9DDF1]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF8F2] border-b border-[#E9DDF1] font-heading font-black text-[#332B40] uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-28 border-r border-[#E9DDF1]">DAY</th>
                    <th className="p-3 border-r border-[#E9DDF1]">MORNING FACULTY (8:30 AM – 12:45 PM)</th>
                    <th className="p-3">AFTERNOON FACULTY (1:30 PM – 4:30 PM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DDF1]">
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const short = DAYS_SHORT[idx];
                    const roster = noticeboardFacultyRoster[day];
                    return (
                      <tr key={day} className="hover:bg-[#FFF8F2]/60">
                        <td className="p-3 font-black text-[#332B40] bg-[#FFF8F2] border-r border-[#E9DDF1]">
                          {short} ({day})
                        </td>
                        <td className="p-3 font-semibold text-[#332B40] border-r border-[#E9DDF1]">
                          {roster.morning.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {roster.morning.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full bg-[#F0E9FF] border border-[#BCA0F5]/50 text-[#8961D8] font-bold text-xs">
                                  {f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#71667D]/40 italic">—</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-[#332B40]">
                          {roster.afternoon.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {roster.afternoon.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full bg-[#FBE5EF] border border-[#E9DDF1] text-[#332B40] font-bold text-xs">
                                  {f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#71667D]/40 italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: "WHO IS TAKING WHICH CLASS AT WHAT TIME" DIRECTORY */}
      {/* ======================================================== */}
      {viewMode === 'faculty' && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-[#F0E9FF] to-[#FFF8F2] border border-[#BCA0F5]/40 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-white text-[#8961D8] text-[11px] font-black uppercase tracking-wider border border-[#BCA0F5]">
                Instructor & Practical Directory
              </span>
              <h2 className="font-heading font-black text-2xl text-[#332B40] mt-1.5">
                Who Is Taking Which Class At What Time
              </h2>
              <p className="text-xs text-[#71667D] mt-0.5">
                Detailed schedule cards listing each faculty instructor, course, practical batch, exact timing, and laboratory room.
              </p>
            </div>

            <div className="text-right">
              <span className="font-heading font-black text-2xl text-[#8961D8]">{timetableSessions.length}</span>
              <span className="block text-xs font-semibold text-[#71667D]">Active Sessions Found</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {timetableSessions.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white border border-[#E9DDF1] rounded-3xl text-[#71667D]">
                <Users className="w-10 h-10 mx-auto text-[#BCA0F5] mb-2" />
                <p className="font-black text-base text-[#332B40]">No Matching Classes Found</p>
                <p className="text-xs mt-1">Try resetting your search query or selecting a different laboratory.</p>
              </div>
            ) : (
              timetableSessions.map(sess => {
                const lab = laboratories.find(l => l.id === sess.laboratoryId);
                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedEvent(sess)}
                    className="p-5 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm hover:shadow-lg hover:border-[#BCA0F5] transition duration-200 cursor-pointer flex flex-col justify-between group space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[#F0E9FF] border border-[#BCA0F5]/50 text-[#8961D8] text-[11px] font-black uppercase">
                          {sess.courseCode}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#FFF8F2] border border-[#FFD2BF] text-[#332B40] text-[11px] font-bold">
                          {sess.date}
                        </span>
                      </div>

                      {/* Title & Group */}
                      <h3 className="font-heading font-black text-base text-[#332B40] group-hover:text-[#8961D8] transition mt-3">
                        {sess.groupName || sess.title}
                      </h3>
                      <p className="text-xs text-[#71667D] mt-0.5 font-medium line-clamp-1">
                        {sess.title}
                      </p>
                    </div>

                    {/* Key Info: Faculty, Time, Lab */}
                    <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-2 text-xs">
                      {/* Faculty */}
                      <div className="flex items-start space-x-2">
                        <GraduationCap className="w-4 h-4 text-[#8961D8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#71667D] block">Faculty Taking Class</span>
                          <span className="font-black text-sm text-[#332B40]">{sess.facultyName}</span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-start space-x-2 pt-1 border-t border-[#E9DDF1]/60">
                        <Clock className="w-4 h-4 text-[#8961D8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#71667D] block">Time Slot</span>
                          <span className="font-extrabold text-xs text-[#332B40]">{sess.startTime} – {sess.endTime}</span>
                        </div>
                      </div>

                      {/* Location & Lab Incharge */}
                      <div className="flex items-start space-x-2 pt-1 border-t border-[#E9DDF1]/60">
                        <Building2 className="w-4 h-4 text-[#8961D8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#71667D] block">Laboratory & Incharge</span>
                          <span className="font-bold text-xs text-[#332B40] block">{lab?.name}</span>
                          <span className="text-[10px] text-[#71667D]">Incharge: {lab?.managerName} ({lab?.roomNumber})</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#8961D8]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {sess.studentCount} Students
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate('/attendance');
                        }}
                        className="text-xs font-black px-3 py-1 rounded-full bg-[#F0E9FF] hover:bg-[#8961D8] hover:text-white transition flex items-center gap-1"
                      >
                        <span>Take Attendance</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: INTERACTIVE MONTHLY CALENDAR GRID */}
      {/* ======================================================== */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          {/* Month Navigator Toolbar */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl border border-[#E9DDF1] hover:bg-[#FFF8F2] text-[#332B40] transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-heading font-black text-xl text-[#332B40] min-w-[200px]">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl border border-[#E9DDF1] hover:bg-[#FFF8F2] text-[#332B40] transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3.5 py-1.5 rounded-xl bg-[#F0E9FF] text-[#8961D8] font-bold text-xs hover:bg-[#BCA0F5] hover:text-white transition"
              >
                Today
              </button>
            </div>

            <div className="text-xs font-bold text-[#71667D]">
              Showing {filteredEvents.length} recurring practical classes in {monthNames[month]}
            </div>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[#E9DDF1] text-center py-3 bg-[#FFF8F2] text-xs font-black uppercase tracking-wider text-[#332B40]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Month Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#E9DDF1]">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] bg-[#FFF8F2]/30 p-2" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = filteredEvents.filter(e => e.date === dateStr);
                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[130px] p-2 flex flex-col justify-between transition group hover:bg-[#F0E9FF]/30 ${
                      isToday ? 'bg-[#FBE5EF]/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isToday
                            ? 'bg-[#8961D8] text-white font-black shadow-xs'
                            : 'text-[#332B40]'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-[#71667D]">
                          {dayEvents.length} class{dayEvents.length > 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>

                    {/* Day Events Preview */}
                    <div className="space-y-1.5 my-1.5 flex-1 overflow-y-auto max-h-[90px]">
                      {dayEvents.map(evt => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className="p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer truncate transition hover:scale-[1.02] shadow-xs bg-[#F0E9FF] border-[#BCA0F5]/50 text-[#8961D8]"
                        >
                          <div className="flex items-center space-x-1 truncate">
                            <span className="font-extrabold">{evt.startTime}</span>
                            <span className="truncate">{evt.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-[#71667D] opacity-0 group-hover:opacity-100 transition">
                      Click to inspect
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: AGENDA STREAM */}
      {/* ======================================================== */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-sm overflow-hidden divide-y divide-[#E9DDF1]">
          <div className="p-4 bg-[#FFF8F2] font-heading font-black text-sm text-[#332B40] flex items-center justify-between">
            <span>Chronological Institutional Practical Stream ({filteredEvents.length} Sessions)</span>
            <span className="text-xs text-[#71667D] font-normal">Sorted by day & time</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-[#71667D]">
              <CalendarIcon className="w-10 h-10 mx-auto text-[#BCA0F5] mb-2" />
              <p className="font-black text-base text-[#332B40]">No Scheduled Sessions Found</p>
              <p className="text-xs mt-1">Try resetting filters or selecting another laboratory.</p>
            </div>
          ) : (
            filteredEvents.map(evt => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="p-4 sm:p-5 hover:bg-[#FFF8F2]/60 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F0E9FF] text-[#8961D8] flex flex-col items-center justify-center font-bold shrink-0 border border-[#BCA0F5]/50">
                    <span className="text-[10px] uppercase font-black">{evt.dayOfWeek?.slice(0, 3)}</span>
                    <span className="text-xs font-black">{evt.startTime}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading font-black text-sm sm:text-base text-[#332B40]">
                        {evt.title}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FFF8F2] border border-[#FFD2BF] text-[#8961D8]">
                        {evt.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#71667D] mt-1.5">
                      <span className="flex items-center gap-1 font-bold text-[#332B40]">
                        <Clock className="w-3.5 h-3.5 text-[#8961D8]" /> {evt.timeStr}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[#8961D8]">
                        <GraduationCap className="w-3.5 h-3.5" /> Faculty: {evt.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {evt.labName} ({evt.roomNumber})
                      </span>
                      {evt.labIncharge && (
                        <span className="flex items-center gap-1 font-semibold">
                          <BadgeCheck className="w-3.5 h-3.5 text-[#8961D8]" /> Incharge: {evt.labIncharge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]">
                    {evt.status || 'SCHEDULED'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: DETAILED PRACTICAL CLASS / EVENT INSPECTOR */}
      {/* ======================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-black bg-white/20 px-2.5 py-0.5 rounded-full">
                  {selectedEvent.courseCode || 'PRACTICAL'} • {selectedEvent.date || selectedEvent.dayOfWeek}
                </span>
                <h3 className="font-heading font-black text-xl text-white mt-1">
                  {selectedEvent.groupName || selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#FFF8F2] rounded-2xl border border-[#E9DDF1]">
                <div>
                  <span className="text-[#71667D] block text-[10px] uppercase font-bold">Faculty In Charge</span>
                  <span className="font-black text-sm text-[#332B40]">{selectedEvent.facultyName || selectedEvent.user}</span>
                </div>
                <div>
                  <span className="text-[#71667D] block text-[10px] uppercase font-bold">Time Slot</span>
                  <span className="font-black text-sm text-[#8961D8]">{selectedEvent.startTime} – {selectedEvent.endTime || ''}</span>
                </div>
                <div>
                  <span className="text-[#71667D] block text-[10px] uppercase font-bold">Laboratory Facility</span>
                  <span className="font-bold text-[#332B40]">{selectedEvent.labName}</span>
                  <span className="text-[10px] text-[#71667D] block">{selectedEvent.roomNumber}</span>
                </div>
                <div>
                  <span className="text-[#71667D] block text-[10px] uppercase font-bold">Lab Incharge</span>
                  <span className="font-bold text-[#332B40]">{selectedEvent.labIncharge || 'Department Incharge'}</span>
                </div>
              </div>

              {selectedEvent.resource && (
                <div className="space-y-1">
                  <span className="text-[#71667D] block text-[10px] uppercase font-bold">Required Equipment & Software Tools</span>
                  <p className="font-semibold text-[#332B40] text-xs p-3 rounded-xl bg-[#F0E9FF]/40 border border-[#BCA0F5]/40">
                    {selectedEvent.resource}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#E9DDF1] flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate('/attendance');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8961D8] hover:bg-[#BCA0F5] text-white font-black flex items-center gap-1.5 transition"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Open Attendance Sheet</span>
                </button>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border border-[#E9DDF1] rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
