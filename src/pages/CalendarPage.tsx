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
  BadgeCheck,
  ShieldAlert,
  User,
  SlidersHorizontal,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { EquipmentBooking, PracticalSession, MaintenanceRecord, Laboratory, UserProfile } from '../types';

export const CalendarPage: React.FC = () => {
  const { activeLab, currentUser } = useAuth();
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
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number;
    dayName: string;
    events: any[];
  } | null>(null);

  // Role Checks
  const isStudent = currentUser.role === 'student';
  const isFaculty = currentUser.role === 'faculty';
  const isAdmin = currentUser.role === 'admin';
  const isLabManager = currentUser.role === 'labManager';

  // For faculty: Default to showing only classes they are taking
  const [facultyOnlyMode, setFacultyOnlyMode] = useState<boolean>(() => isFaculty);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('ALL');

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

        // Default timetable to ALL so all allotted classes appear immediately
        setSelectedLabId('ALL');
      } catch (err) {
        console.error('Failed to load schedule events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeLab]);

  // Keep faculty mode synced when role is faculty
  useEffect(() => {
    if (isFaculty) {
      setFacultyOnlyMode(true);
    }
  }, [currentUser]);

  // Check if a faculty user is taking a given session
  const isCurrentUserTakingClass = (s: PracticalSession): boolean => {
    if (!currentUser || !s.facultyName) return false;
    if (s.facultyId && s.facultyId === currentUser.id) return true;

    const userClean = (currentUser.displayName || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .trim();
    const facClean = s.facultyName.toLowerCase();

    if (facClean.includes(userClean) || userClean.includes(facClean)) return true;

    // Check specific name tokens (e.g. Roopa, Ajay, Suma, Chetana, Manjula, Veena, Anusha, Dhananjaya, Shubha, Prasad, Bindiya, etc.)
    const userWords = userClean
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['prof', 'prof.', 'dr.', 'mrs.', 'mr.', 'ms.', 'cse', 'department', 'faculty', 'lead', 'system'].includes(w));

    return userWords.some(w => facClean.includes(w));
  };

  // Check if student is allotted to a given laboratory
  const isStudentAllotted = (labId: string): boolean => {
    if (!isStudent) return true;
    if (!currentUser.assignedLabs || currentUser.assignedLabs.length === 0) {
      if (currentUser.assignedLabId) return currentUser.assignedLabId === labId;
      return true;
    }
    return currentUser.assignedLabs.includes(labId);
  };

  // Student allotted labs list
  const studentAllottedLabs = useMemo(() => {
    if (!isStudent) return laboratories;
    if (currentUser?.assignedLabs && currentUser.assignedLabs.length > 0) {
      return laboratories.filter(l => currentUser.assignedLabs.includes(l.id));
    }
    if (currentUser?.assignedLabId) {
      return laboratories.filter(l => l.id === currentUser.assignedLabId);
    }
    return laboratories;
  }, [isStudent, currentUser, laboratories]);

  // Faculty teaching labs list (labs where this faculty member conducts classes)
  const facultyTeachingLabs = useMemo(() => {
    if (!isFaculty) return laboratories;
    const labIds = new Set(sessions.filter(isCurrentUserTakingClass).map(s => s.laboratoryId));
    const flabs = laboratories.filter(l => labIds.has(l.id));
    return flabs.length > 0 ? flabs : laboratories;
  }, [isFaculty, sessions, laboratories, currentUser]);

  // Laboratories to display in the selector strip & filter dropdown
  // Always includes all 11 department laboratories (CS-01 to CS-11)
  const visibleLabs = useMemo(() => {
    return laboratories.filter(l => l.id !== 'lab-chem-01');
  }, [laboratories]);

  // Selected laboratory object
  const currentLab = useMemo(() => {
    if (selectedLabId === 'ALL') return null;
    return laboratories.find(l => l.id === selectedLabId) || null;
  }, [laboratories, selectedLabId]);

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
  // ENFORCING ROLE-BASED VISIBILITY:
  // 1. For Student: ONLY sessions in allotted laboratories appear.
  // 2. For Faculty (when facultyOnlyMode is on): ONLY sessions they are taking appear across all days.
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
        // Condition A: Student Allotment Check
        if (isStudent && !isStudentAllotted(s.laboratoryId)) {
          return;
        }

        // Condition B: Faculty Teaching Check
        if (isFaculty && facultyOnlyMode && !isCurrentUserTakingClass(s)) {
          return;
        }

        // Condition C: Specific Teacher Filter (Integrates specific teacher's timetable)
        if (selectedFaculty !== 'ALL') {
          const facClean = (s.facultyName || '').toLowerCase();
          const targetClean = selectedFaculty.toLowerCase();
          if (!facClean.includes(targetClean) && !targetClean.includes(facClean)) {
            return;
          }
        }

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
  }, [currentDate, sessions, laboratories, isStudent, isFaculty, facultyOnlyMode, currentUser]);

  // Aggregate all events
  const allEvents = useMemo(() => {
    const bookingEvents = bookings
      .filter(b => {
        if (isStudent && !isStudentAllotted(b.laboratoryId)) return false;
        if (isFaculty && facultyOnlyMode && b.userId !== currentUser.id) return false;
        return true;
      })
      .map(b => {
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

    const maintenanceEvents = maintenances
      .filter(m => {
        if (isStudent) return false; // Students do not see internal maintenance tickets in their student calendar
        return true;
      })
      .map(m => {
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
  }, [bookings, maintenances, calendarPracticalEvents, laboratories, isStudent, isFaculty, facultyOnlyMode, currentUser]);

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
        viewMode === 'month' || selectedDay === 'ALL' || evt.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase();

      const matchesFaculty =
        selectedFaculty === 'ALL' || evt.user.toLowerCase().includes(selectedFaculty.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' || evt.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesLab && matchesDay && matchesFaculty && matchesStatus;
    });
  }, [allEvents, searchQuery, selectedLabId, selectedDay, selectedFaculty, selectedStatus, viewMode]);

  // Sessions filtered for the Timetable Noticeboard grid & Directory
  // Enforces student allotment and faculty teaching filter
  const timetableSessions = useMemo(() => {
    return sessions.filter(s => {
      // 1. Student allotment filter
      if (isStudent && !isStudentAllotted(s.laboratoryId)) {
        return false;
      }

      // 2. Faculty teaching filter (shows only the classes they are taking when facultyOnlyMode is on)
      if (isFaculty && facultyOnlyMode && !isCurrentUserTakingClass(s)) {
        return false;
      }

      // 3. Laboratory filter
      let matchesLab = selectedLabId === 'ALL' || s.laboratoryId === selectedLabId;
      if (!matchesLab && currentLab) {
        if (currentLab.id === s.laboratoryId) matchesLab = true;
        if (currentLab.name.toLowerCase().includes('vinodham') && s.laboratoryId === 'lab-vin-01') matchesLab = true;
        if (currentLab.code && s.laboratoryId.toLowerCase().includes(currentLab.code.toLowerCase())) matchesLab = true;
      }

      // 4. Search query
      const matchesSearch =
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.groupName && s.groupName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

      // 5. Day filter
      const matchesDay =
        selectedDay === 'ALL' || s.date.toLowerCase() === selectedDay.toLowerCase();

      // 6. Faculty dropdown filter
      const matchesFaculty =
        selectedFaculty === 'ALL' || s.facultyName.toLowerCase().includes(selectedFaculty.toLowerCase());

      return matchesLab && matchesSearch && matchesDay && matchesFaculty;
    });
  }, [sessions, selectedLabId, currentLab, searchQuery, selectedDay, selectedFaculty, isStudent, isFaculty, facultyOnlyMode, currentUser]);

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
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const totalGridCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const trailingEmptyCount = totalGridCells - (firstDayIndex + daysInMonth);

  const handleDayClick = (dateStr: string, dayNum: number, dayEvents: any[]) => {
    const d = new Date(year, month, dayNum);
    const dayName = d.toLocaleDateString([], { weekday: 'long' });
    setSelectedDayDetail({
      dateStr,
      dayNum,
      dayName,
      events: dayEvents
    });
  };

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
    link.download = `sjbit-timetable-${currentUser.role}-${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
  };

  // Helper to extract session for a cell in the Noticeboard Grid
  const getSessionForSlot = (sessionList: PracticalSession[], day: string, slot: '8:30' | '10:45' | '1:30' | '2:30') => {
    return sessionList.find(s => {
      if (s.date.toLowerCase() !== day.toLowerCase()) return false;
      const start = s.startTime.toLowerCase();
      if (slot === '8:30') return start.includes('8:30') || start.includes('08:30');
      if (slot === '10:45') return start.includes('10:45');
      if (slot === '1:30') return start.includes('1:30') || start.includes('01:30');
      if (slot === '2:30') return start.includes('2:30') || start.includes('02:30');
      return false;
    });
  };

  // Helper to extract duty roster for a given set of sessions
  const getRosterForSessions = (sessionList: PracticalSession[]) => {
    const map: Record<string, { morning: string[]; afternoon: string[] }> = {
      Monday: { morning: [], afternoon: [] },
      Tuesday: { morning: [], afternoon: [] },
      Wednesday: { morning: [], afternoon: [] },
      Thursday: { morning: [], afternoon: [] },
      Friday: { morning: [], afternoon: [] },
      Saturday: { morning: [], afternoon: [] }
    };

    sessionList.forEach(s => {
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
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HERO HEADER & ROLE CONTEXT BANNER */}
      <div className="p-6 sm:p-8 bg-white border border-[#E9DDF1] rounded-3xl text-[#332B40] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/50 font-mono text-xs uppercase font-extrabold tracking-wider">
              Odd Semester 2026-27 • w.e.f: 07/09/2026
            </span>

            {/* Role Badge with customized context */}
            {isStudent && (
              <span className="px-3 py-1 rounded-full bg-[#E8F8F0] text-[#1E7E52] border border-[#A7E7C4] text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Student View: Allotted Labs Only ({studentAllottedLabs.length} Labs Allotted)
              </span>
            )}

            {isFaculty && (
              <span className="px-3 py-1 rounded-full bg-[#FBE5EF] text-[#8961D8] border border-[#E9DDF1] text-xs font-bold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Faculty View: Showing Classes You Take Across All Days
              </span>
            )}

            {isAdmin && (
              <span className="px-3 py-1 rounded-full bg-[#FFF8F2] text-[#332B40] border border-[#FFD2BF] text-xs font-bold flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-[#8961D8]" />
                Admin Master View: All 11 CSE Laboratories
              </span>
            )}
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#332B40] mt-2 tracking-tight">
            Laboratory Timetable & Schedule
          </h1>
          <p className="text-sm sm:text-base text-[#71667D] mt-1 max-w-2xl leading-relaxed">
            {isStudent
              ? `Personalized timetable displaying classes for your officially allotted laboratories (${studentAllottedLabs.map(l => l.code).join(', ')}).`
              : isFaculty
              ? `Personalized faculty schedule displaying all days (Monday to Saturday) with the exact practical sessions assigned to you.`
              : `Comprehensive institutional schedule showing practical classes, faculty assignments, and workstations across all laboratories.`}
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

      {/* 2. PRIMARY VIEW MODE TOGGLES & FACULTY FILTER SWITCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm">
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

        {/* Right side options: Faculty Teaching Toggle or Session Counter */}
        <div className="flex items-center gap-3">
          {isFaculty && (
            <div className="flex items-center bg-[#FFF8F2] p-1 rounded-2xl border border-[#E9DDF1]">
              <button
                onClick={() => setFacultyOnlyMode(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  facultyOnlyMode
                    ? 'bg-white text-[#8961D8] shadow-xs font-black'
                    : 'text-[#71667D] hover:text-[#332B40]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>My Classes Only</span>
              </button>
              <button
                onClick={() => setFacultyOnlyMode(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  !facultyOnlyMode
                    ? 'bg-white text-[#8961D8] shadow-xs font-black'
                    : 'text-[#71667D] hover:text-[#332B40]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>All Department Classes</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs font-bold text-[#71667D] px-3 py-1.5 rounded-full bg-[#FFF8F2] border border-[#E9DDF1] shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#8961D8]" />
            <span>{timetableSessions.length} Classes Shown</span>
          </div>
        </div>
      </div>

      {/* 3. SEPARATE LAB SELECTOR STRIP (EACH LAB SEPARATELY SELECTABLE) */}
      <div className="bg-white border border-[#E9DDF1] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-heading font-black text-[#332B40] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#8961D8]" />
            Select Individual Laboratory or All Labs:
          </span>
          {isStudent ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              🎓 Student Allotted: {studentAllottedLabs.length} Assigned Laboratories
            </span>
          ) : isFaculty && facultyOnlyMode ? (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              👨‍🏫 Teaching Schedule: {facultyTeachingLabs.length} Active Laboratories
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#71667D]">
              All 11 CSE Department Laboratories (CS-01 to CS-11)
            </span>
          )}
        </div>

        {/* Horizontal Scrollable Lab Buttons (Each Lab Separate) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Option: All Labs */}
          <button
            onClick={() => setSelectedLabId('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition shrink-0 flex items-center space-x-1.5 ${
              selectedLabId === 'ALL'
                ? 'bg-[#332B40] text-white shadow-md'
                : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D] border border-[#E9DDF1]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isStudent ? 'All My Allotted Labs' : isFaculty ? 'All My Teaching Labs' : 'All 11 Laboratories'}</span>
          </button>

          {/* Each Lab Separately */}
          {visibleLabs.map(lab => {
            const allotted = isStudentAllotted(lab.id);
            const isSelected = selectedLabId === lab.id;

            return (
              <button
                key={lab.id}
                onClick={() => setSelectedLabId(lab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white border-transparent shadow-md'
                    : isStudent && allotted
                    ? 'bg-[#E8F8F0] hover:bg-[#D4F4E4] text-[#1E7E52] border-[#A7E7C4]'
                    : isStudent && !allotted
                    ? 'bg-[#F9F9FB] text-[#71667D]/60 border-[#E9DDF1] hover:bg-slate-100'
                    : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border-[#E9DDF1]'
                }`}
              >
                <span className="font-mono font-black">{lab.code}</span>
                <span className="uppercase font-bold">{lab.name.replace('Laboratory', 'Lab')}</span>
                {isStudent && allotted && !isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Allotted to you" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SECONDARY SEARCH & DAY/FACULTY FILTERS */}
      <div className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71667D]" />
            <input
              type="text"
              placeholder="Search by instructor (e.g. Roopa, Ajay, Suma, Chetana), batch (C2, B1) or course..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs font-semibold text-[#332B40] placeholder-[#71667D] focus:outline-none focus:ring-2 focus:ring-[#BCA0F5]"
            />
          </div>

          {/* Laboratory Selector Dropdown */}
          <div className="flex items-center gap-2 min-w-[260px]">
            <Building2 className="w-4 h-4 text-[#8961D8] shrink-0" />
            <select
              value={selectedLabId}
              onChange={e => setSelectedLabId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs font-bold text-[#332B40] focus:outline-none focus:ring-2 focus:ring-[#BCA0F5]"
            >
              <option value="ALL">
                {isStudent ? '✨ All My Allotted Laboratories' : isFaculty ? '✨ All My Teaching Laboratories' : '✨ All 11 CSE Laboratories'}
              </option>
              {visibleLabs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.code} — {lab.name} ({lab.roomNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Faculty / Instructor Dropdown Filter (Allows Student & Faculty to integrate specific teacher's timetable) */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <GraduationCap className="w-4 h-4 text-[#8961D8] shrink-0" />
            <select
              value={selectedFaculty}
              onChange={e => setSelectedFaculty(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs font-bold text-[#332B40] focus:outline-none focus:ring-2 focus:ring-[#BCA0F5]"
            >
              <option value="ALL">
                {isFaculty && facultyOnlyMode
                  ? '👨‍🏫 My Teaching Classes (Personal)'
                  : isStudent
                  ? '👨‍🏫 All Allotted Teachers'
                  : '👨‍🏫 All Faculty Instructors'}
              </option>
              {allFacultyNames.map(fac => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Dropdown Filter (Hidden if faculty is viewing only their own classes) */}
          {(!isFaculty || !facultyOnlyMode) && (
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
          )}
        </div>

        {/* Day Pills Bar */}
        <div className="pt-3 border-t border-[#E9DDF1] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71667D] mr-2">
              Filter Day:
            </span>
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDay === 'ALL'
                  ? 'bg-[#332B40] text-white shadow-xs'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              All Days (Mon–Sat)
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
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* STUDENT NON-ALLOTTED LAB WARNING (IF STUDENT PICKS A LAB NOT ALLOTTED TO THEM) */}
      {isStudent && selectedLabId !== 'ALL' && !isStudentAllotted(selectedLabId) && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-heading font-black text-sm">
              Laboratory Not Allotted to Your Student Account
            </h4>
            <p className="text-xs leading-relaxed">
              You are currently viewing <strong>{currentLab?.name}</strong>, but your student profile ({currentUser.displayName}) is not allotted to this facility.
              Your allotted laboratories are: <strong>{studentAllottedLabs.map(l => l.name).join(', ')}</strong>.
            </p>
            <button
              onClick={() => setSelectedLabId('ALL')}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
            >
              Show My Allotted Labs
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: NOTICEBOARD TIMETABLE GRID (DIGITAL POSTER REPLICA) */}
      {/* ======================================================== */}
      {viewMode === 'timetable' && (
        <div className="space-y-8">
          {/* Faculty Profile No Allotment Warning & Easy Switch */}
          {isFaculty && facultyOnlyMode && timetableSessions.length === 0 && (
            <div className="p-6 bg-gradient-to-r from-amber-50 to-[#FFF8F2] border-2 border-amber-300 rounded-3xl text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-heading font-black text-sm">No Teaching Sessions Allotted to Current Profile</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your profile (<strong>{currentUser.displayName}</strong>) is not matched on the 11 physical laboratory noticeboards. Switch to department view to see the complete timetable with all periods and teachers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFacultyOnlyMode(false)}
                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 shadow-md transition"
              >
                View All Department Timetables (11 Labs)
              </button>
            </div>
          )}

          {(() => {
            const labsToDisplay = selectedLabId === 'ALL'
              ? (isStudent ? studentAllottedLabs : visibleLabs)
              : (currentLab ? [currentLab] : visibleLabs);

            return (
              <div className="space-y-10">
                {labsToDisplay.map(lab => {
                  const labSessions = sessions.filter(s => {
                    const matchesLab = s.laboratoryId === lab.id ||
                      (lab.name.toLowerCase().includes('vinodham') && s.laboratoryId === 'lab-vin-01') ||
                      (lab.code && s.laboratoryId.toLowerCase().includes(lab.code.toLowerCase()));
                    if (!matchesLab) return false;

                    // Faculty teaching filter
                    if (isFaculty && facultyOnlyMode && !isCurrentUserTakingClass(s)) return false;

                    // Faculty name dropdown
                    if (selectedFaculty !== 'ALL' && !s.facultyName.toLowerCase().includes(selectedFaculty.toLowerCase())) return false;

                    // Search query
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      const match = s.title.toLowerCase().includes(q) ||
                        s.facultyName.toLowerCase().includes(q) ||
                        s.courseCode.toLowerCase().includes(q) ||
                        (s.groupName && s.groupName.toLowerCase().includes(q));
                      if (!match) return false;
                    }

                    return true;
                  });

                  const roster = getRosterForSessions(labSessions);

                  return (
                    <div key={lab.id} id={`lab-board-${lab.id}`} className="space-y-4 pt-2">
                      {/* Noticeboard Header */}
                      <div className="p-6 bg-gradient-to-r from-[#FFF8F2] via-white to-[#F0E9FF] border-2 border-[#BCA0F5]/40 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-0.5 rounded-full bg-[#BCA0F5] text-white text-[11px] font-black uppercase tracking-wider">
                              Official Department Timetable
                            </span>
                            <span className="text-xs font-extrabold text-[#71667D]">
                              Department of Computer Science & Engineering
                            </span>
                          </div>

                          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#332B40] mt-1">
                            {lab.code}: {lab.name}
                          </h2>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#71667D] pt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#8961D8]" />
                              {lab.roomNumber}
                            </span>
                            <span className="flex items-center gap-1 bg-[#FBE5EF] px-3 py-1 rounded-full text-[#332B40] border border-[#E9DDF1]">
                              <BadgeCheck className="w-4 h-4 text-[#8961D8]" />
                              <strong>LAB INCHARGE:</strong> {lab.managerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#8961D8]" />
                              Timing: 08:30 AM – 04:30 PM (Mon–Sat) • w.e.f: 07/09/2026
                            </span>
                          </div>
                        </div>

                        {selectedLabId === 'ALL' && (
                          <button
                            onClick={() => setSelectedLabId(lab.id)}
                            className="px-4 py-2 rounded-2xl bg-white hover:bg-[#F0E9FF] border border-[#BCA0F5] text-[#8961D8] font-bold text-xs flex items-center gap-1.5 self-start md:self-center shadow-xs"
                          >
                            <span>Focus on {lab.code}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Timetable Matrix */}
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
                                const morningSlot1 = getSessionForSlot(labSessions, day, '8:30');
                                const morningSlot2 = getSessionForSlot(labSessions, day, '10:45');
                                const afternoonSlot1 = getSessionForSlot(labSessions, day, '1:30');
                                const afternoonSlot2 = getSessionForSlot(labSessions, day, '2:30');

                                if (selectedDay !== 'ALL' && selectedDay.toLowerCase() !== day.toLowerCase()) {
                                  return null;
                                }

                                return (
                                  <tr key={day} className="hover:bg-[#FFF8F2]/50 transition">
                                    <td className="py-4 px-3 font-black text-sm text-[#332B40] bg-[#FFF8F2] border-r border-[#E9DDF1]">
                                      {shortDay}
                                    </td>

                                    {/* Morning 8:30 - 10:30 */}
                                    {morningSlot1 ? (
                                      <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                                        <div
                                          onClick={() => setSelectedEvent(morningSlot1)}
                                          className="p-3 rounded-2xl bg-gradient-to-r from-[#F0E9FF] to-[#FBE5EF] border border-[#BCA0F5] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                                        >
                                          <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                            <span>{morningSlot1.groupName || morningSlot1.title}</span>
                                            <span className="text-[10px] font-bold text-[#8961D8]">{morningSlot1.courseCode}</span>
                                          </div>
                                          <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                            👨‍🏫 {morningSlot1.facultyName}
                                          </p>
                                          <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                            {morningSlot1.title}
                                          </p>
                                        </div>
                                      </td>
                                    ) : (
                                      <>
                                        <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                                        <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                                      </>
                                    )}

                                    {/* Tea Break */}
                                    <td className="bg-[#FBE5EF]/40 border-r border-[#E9DDF1] text-[10px] font-black text-[#8961D8]">
                                      TEA
                                    </td>

                                    {/* Mid-Morning 10:45 - 12:45 */}
                                    {morningSlot2 ? (
                                      <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                                        <div
                                          onClick={() => setSelectedEvent(morningSlot2)}
                                          className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#F0E9FF] border border-[#FFD2BF] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                                        >
                                          <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                            <span>{morningSlot2.groupName || morningSlot2.title}</span>
                                            <span className="text-[10px] font-bold text-[#8961D8]">{morningSlot2.courseCode}</span>
                                          </div>
                                          <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                            👨‍🏫 {morningSlot2.facultyName}
                                          </p>
                                          <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                            {morningSlot2.title}
                                          </p>
                                        </div>
                                      </td>
                                    ) : (
                                      <>
                                        <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                                        <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                                      </>
                                    )}

                                    {/* Lunch Break */}
                                    <td className="bg-[#FFF8F2] border-r border-[#E9DDF1] text-[10px] font-black text-[#8961D8]">
                                      LUNCH
                                    </td>

                                    {/* Afternoon Slots */}
                                    {afternoonSlot1 ? (
                                      <>
                                        <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                                          <div
                                            onClick={() => setSelectedEvent(afternoonSlot1)}
                                            className="p-3 rounded-2xl bg-gradient-to-r from-[#F0E9FF] to-[#FBE5EF] border border-[#BCA0F5] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                                          >
                                            <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                              <span>{afternoonSlot1.groupName || afternoonSlot1.title}</span>
                                              <span className="text-[10px] font-bold text-[#8961D8]">{afternoonSlot1.courseCode}</span>
                                            </div>
                                            <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                              👨‍🏫 {afternoonSlot1.facultyName}
                                            </p>
                                            <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                              {afternoonSlot1.title}
                                            </p>
                                          </div>
                                        </td>
                                        <td className="p-2 text-[#71667D]/40 text-xs italic">—</td>
                                      </>
                                    ) : afternoonSlot2 ? (
                                      <>
                                        <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                                        <td colSpan={2} className="p-2">
                                          <div
                                            onClick={() => setSelectedEvent(afternoonSlot2)}
                                            className="p-3 rounded-2xl bg-gradient-to-r from-[#FBE5EF] to-[#FFF8F2] border border-[#E9DDF1] shadow-xs hover:shadow-md cursor-pointer transition text-left"
                                          >
                                            <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                              <span>{afternoonSlot2.groupName || afternoonSlot2.title}</span>
                                              <span className="text-[10px] font-bold text-[#8961D8]">{afternoonSlot2.courseCode}</span>
                                            </div>
                                            <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                              👨‍🏫 {afternoonSlot2.facultyName}
                                            </p>
                                            <p className="text-[10px] text-[#71667D] truncate mt-0.5">
                                              {afternoonSlot2.title}
                                            </p>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
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

                      {/* Faculty Duty Roster Table for this Lab */}
                      <div className="p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-black text-base text-[#332B40] flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-[#8961D8]" />
                            Faculty Duty Roster for {lab.code} ({lab.name})
                          </h4>
                          <span className="text-xs font-bold text-[#8961D8]">
                            Odd Sem 2026-27 Roster
                          </span>
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
                                const r = roster[day];
                                return (
                                  <tr key={day} className="hover:bg-[#FFF8F2]/60">
                                    <td className="p-3 font-black text-[#332B40] bg-[#FFF8F2] border-r border-[#E9DDF1]">
                                      {short} ({day})
                                    </td>
                                    <td className="p-3 font-semibold text-[#332B40] border-r border-[#E9DDF1]">
                                      {r.morning.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {r.morning.map((f, i) => (
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
                                      {r.afternoon.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {r.afternoon.map((f, i) => (
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
                  );
                })}
              </div>
            );
          })()}
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
                Instructor & Class Directory
              </span>
              <h2 className="font-heading font-black text-2xl text-[#332B40] mt-1.5">
                Who Is Taking Which Class At What Time
              </h2>
              <p className="text-xs text-[#71667D] mt-0.5">
                {isFaculty && facultyOnlyMode
                  ? `Showing all practical classes scheduled for you (${currentUser.displayName}) across all days.`
                  : isStudent
                  ? `Showing practical classes scheduled across your officially allotted laboratories.`
                  : `Detailed schedule cards listing each faculty instructor, course, practical batch, exact timing, and laboratory room.`}
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
                <p className="text-xs mt-1">
                  {isStudent
                    ? 'No classes found for your allotted laboratories matching current filters.'
                    : isFaculty && facultyOnlyMode
                    ? 'No classes scheduled for you under the selected filters. Switch to "All Department Classes" to view other faculty.'
                    : 'Try resetting your search query or selecting a different laboratory.'}
                </p>
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
              {isStudent
                ? `Showing practical classes for your allotted labs in ${monthNames[month]}`
                : isFaculty && facultyOnlyMode
                ? `Showing classes you take across all days in ${monthNames[month]}`
                : `Showing ${filteredEvents.length} events in ${monthNames[month]}`}
            </div>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[#E9DDF1] text-center py-3 bg-[#FFF8F2] text-xs font-black uppercase tracking-wider text-[#332B40]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Month Cells: Seamless 1px grid using gap-px with clean border */}
            <div className="grid grid-cols-7 gap-px bg-[#E9DDF1]">
              {/* Previous Month Leading Days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const prevDayNum = daysInPrevMonth - firstDayIndex + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="min-h-[120px] bg-[#FFF8F2]/30 p-2 flex flex-col justify-between opacity-40 select-none"
                  >
                    <span className="text-xs font-bold text-[#71667D]">{prevDayNum}</span>
                    <span className="text-[10px] text-[#71667D]/60 italic font-mono">Previous Month</span>
                  </div>
                );
              })}

              {/* Current Month Active Days */}
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
                    onClick={() => handleDayClick(dateStr, dayNum, dayEvents)}
                    className={`min-h-[130px] p-2 flex flex-col justify-between transition group bg-white hover:bg-[#F0E9FF]/40 cursor-pointer hover:shadow-xs hover:ring-2 hover:ring-[#8961D8]/40 ${
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
                    <div className="space-y-1.5 my-1.5 flex-1 overflow-y-auto max-h-[90px] no-scrollbar">
                      {dayEvents.map(evt => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer truncate transition hover:scale-[1.02] shadow-xs bg-[#F0E9FF] border-[#BCA0F5]/50 text-[#8961D8]"
                        >
                          <div className="flex items-center space-x-1 truncate">
                            <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-[#8961D8]/10 text-[#8961D8] shrink-0">
                              {evt.labCode || 'LAB'}
                            </span>
                            <span className="font-extrabold shrink-0">{evt.startTime}</span>
                            <span className="truncate">{evt.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-[#8961D8] font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Click to view day</span>
                    </div>
                  </div>
                );
              })}

              {/* Next Month Trailing Days (Pads grid so all 7 columns in every row are complete) */}
              {Array.from({ length: trailingEmptyCount }).map((_, i) => {
                const nextMonthDayNum = i + 1;
                return (
                  <div
                    key={`trailing-${i}`}
                    className="min-h-[120px] bg-[#FFF8F2]/30 p-2 flex flex-col justify-between opacity-40 select-none"
                  >
                    <span className="text-xs font-bold text-[#71667D]">{nextMonthDayNum}</span>
                    <span className="text-[10px] text-[#71667D]/60 italic font-mono">Next Month</span>
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
            <span>
              {isStudent
                ? `Allotted Practical Stream (${filteredEvents.length} Sessions)`
                : isFaculty && facultyOnlyMode
                ? `Your Teaching Classes Stream (${filteredEvents.length} Sessions)`
                : `Chronological Practical Stream (${filteredEvents.length} Sessions)`}
            </span>
            <span className="text-xs text-[#71667D] font-normal">Sorted by day & time</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-[#71667D]">
              <CalendarIcon className="w-10 h-10 mx-auto text-[#BCA0F5] mb-2" />
              <p className="font-black text-base text-[#332B40]">No Scheduled Sessions Found</p>
              <p className="text-xs mt-1">
                {isStudent
                  ? 'No classes found for your allotted laboratories.'
                  : isFaculty && facultyOnlyMode
                  ? 'No classes scheduled for you under the selected filters.'
                  : 'Try resetting filters or selecting another laboratory.'}
              </p>
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
      {/* 5. MODAL: DAY INSPECTION MODAL (CLICKING ON ANY DAY) */}
      {/* ======================================================== */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <h3 className="font-heading font-black text-xl text-white">
                    {selectedDayDetail.dayName}, {monthNames[month]} {selectedDayDetail.dayNum}, {year}
                  </h3>
                </div>
                <p className="text-xs text-white/80 font-semibold mt-1">
                  {isStudent
                    ? `Showing your allotted laboratory sessions for this date`
                    : isFaculty && facultyOnlyMode
                    ? `Showing classes you teach on this date`
                    : `Showing all scheduled classes and bookings`}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
              {selectedDayDetail.events.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF8F2] text-[#8961D8] flex items-center justify-center mx-auto mb-2 border border-[#E9DDF1]">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-black text-sm text-[#332B40]">
                    No Classes Scheduled on {selectedDayDetail.dayName}
                  </h4>
                  <p className="text-xs text-[#71667D] max-w-md mx-auto">
                    {isStudent
                      ? `There are no practical sessions scheduled in your allotted laboratories on ${selectedDayDetail.dayName}.`
                      : isFaculty && facultyOnlyMode
                      ? `You are not scheduled to conduct any classes on ${selectedDayDetail.dayName}.`
                      : `No departmental sessions or reservations are scheduled for this date.`}
                  </p>
                </div>
              ) : (
                selectedDayDetail.events.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedDayDetail(null);
                      setSelectedEvent(evt);
                    }}
                    className="p-4 rounded-2xl border border-[#E9DDF1] bg-[#FFF8F2]/40 hover:bg-[#F0E9FF]/50 transition cursor-pointer space-y-2 group hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-[#8961D8] text-white text-[11px] font-mono font-black">
                          {evt.labCode || 'LAB'}
                        </span>
                        <span className="font-heading font-black text-sm text-[#332B40]">
                          {evt.title}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {evt.status || 'SCHEDULED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#71667D]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8961D8]" />
                        <span className="font-bold text-[#332B40]">{evt.timeStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#8961D8]" />
                        <span>{evt.labName} ({evt.roomNumber})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#8961D8]" />
                        <span>Teacher: <strong className="text-[#332B40]">{evt.facultyName || evt.user}</strong></span>
                      </div>
                      {evt.studentCount && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#8961D8]" />
                          <span>Batch: <strong className="text-[#332B40]">{evt.studentCount} Students</strong></span>
                        </div>
                      )}
                    </div>

                    {evt.resource && (
                      <div className="text-[11px] text-[#71667D] pt-1.5 border-t border-[#E9DDF1]/60 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#8961D8]" />
                        <span>Equipment: {evt.resource}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#FFF8F2] border-t border-[#E9DDF1] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#71667D]">
                {selectedDayDetail.events.length} session{selectedDayDetail.events.length !== 1 ? 's' : ''} on this date
              </span>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#332B40] text-white text-xs font-bold hover:bg-[#8961D8] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: DETAILED PRACTICAL CLASS / EVENT INSPECTOR */}
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
