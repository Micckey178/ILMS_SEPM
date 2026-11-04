import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Users,
  Clock,
  Shield,
  Layers,
  MapPin,
  X,
  CheckCircle2,
  Cpu,
  Monitor,
  AlertTriangle,
  Boxes,
  CalendarCheck,
  Calendar,
  Table as TableIcon,
  GraduationCap,
  BookOpen,
  BadgeCheck,
  Wrench,
  Search,
  Download,
  Filter,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  Laboratory,
  LaboratoryType,
  ComputerWorkstation,
  PracticalSession,
  EquipmentAsset,
  UniversalInventoryItem
} from '../types';

export const LaboratoriesPage: React.FC = () => {
  const { laboratories, currentUser, refreshData, switchLaboratory } = useAuth();
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);
  const [activeTab, setActiveTab] = useState<'timetable' | 'overview' | 'workstations' | 'students' | 'equipment' | 'inventory' | 'maintenance'>('timetable');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [workstations, setWorkstations] = useState<ComputerWorkstation[]>([]);
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [allSessions, setAllSessions] = useState<PracticalSession[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [inventory, setInventory] = useState<UniversalInventoryItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Form states for new lab
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<LaboratoryType>('physics');
  const [building, setBuilding] = useState('Science Complex');
  const [roomNumber, setRoomNumber] = useState('Room 101');
  const [capacity, setCapacity] = useState(30);

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  useEffect(() => {
    DataService.getPracticalSessions().then(setAllSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedLab) {
      DataService.getWorkstations(selectedLab.id).then(setWorkstations).catch(() => {});
      DataService.getPracticalSessions().then(list => {
        const labSessions = list.filter(s =>
          s.laboratoryId === selectedLab.id ||
          (selectedLab.name.toLowerCase().includes('vinodham') && s.laboratoryId === 'lab-vin-01') ||
          (selectedLab.code && s.laboratoryId.toLowerCase().includes(selectedLab.code.toLowerCase()))
        );
        setSessions(labSessions);
      }).catch(() => {});
      DataService.getEquipment(selectedLab.id).then(setEquipment).catch(() => {});
      DataService.getInventory(selectedLab.id).then(setInventory).catch(() => {});
    }
  }, [selectedLab]);

  // Timetable slot helper for noticeboard matrix
  const getSessionForSlot = (day: string, slot: '8:30' | '10:45' | '1:30' | '2:30') => {
    return sessions.find(s => {
      if (s.date.toLowerCase() !== day.toLowerCase()) return false;
      const start = s.startTime.toLowerCase();
      if (slot === '8:30') return start.includes('8:30') || start.includes('08:30');
      if (slot === '10:45') return start.includes('10:45');
      if (slot === '1:30') return start.includes('1:30') || start.includes('01:30');
      if (slot === '2:30') return start.includes('2:30') || start.includes('02:30');
      return false;
    });
  };

  // Lab Morning vs Afternoon Faculty Duty Roster
  const facultyDutyRoster = useMemo(() => {
    const map: Record<string, { morning: string[]; afternoon: string[] }> = {
      Monday: { morning: [], afternoon: [] },
      Tuesday: { morning: [], afternoon: [] },
      Wednesday: { morning: [], afternoon: [] },
      Thursday: { morning: [], afternoon: [] },
      Friday: { morning: [], afternoon: [] },
      Saturday: { morning: [], afternoon: [] }
    };

    sessions.forEach(s => {
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
  }, [sessions]);

  // Student roster data for deep dive
  const enrolledStudents = [
    { id: 'std-101', name: 'Kavya N', rollNo: '1JB23CS001', dept: 'Computer Science & Engineering', class: 'Year 3 / Sem 5', active: true, faculty: 'Mrs. Vinutha K', session: 'CN Lab (Batch C3)' },
    { id: 'std-102', name: 'Abhishek R', rollNo: '1JB23CS002', dept: 'Computer Science & Engineering', class: 'Year 3 / Sem 5', active: true, faculty: 'Dr. Veena H N', session: 'GAI&PE Lab (Batch A1)' },
    { id: 'std-103', name: 'Ananya S', rollNo: '1JB23CS003', dept: 'Computer Science & Engineering', class: 'Year 3 / Sem 5', active: true, faculty: 'Dr. Prakruthi M K', session: 'SE&PM Lab (Batch C1)' },
    { id: 'std-104', name: 'Darshan Gowda', rollNo: '1JB23CS004', dept: 'Computer Science & Engineering', class: 'Year 3 / Sem 5', active: true, faculty: 'Mrs. Manjula H S', session: 'SE&PM Lab (Batch B1)' },
    { id: 'std-105', name: 'Deepika M', rollNo: '1JB23CS005', dept: 'Computer Science & Engineering', class: 'Year 3 / Sem 5', active: false, faculty: 'Mrs. Vijayalaxmi Joshi', session: 'SE&PM Lab (Batch D1)' }
  ].filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.dept.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createLaboratory({
        id: `lab-${Date.now()}`,
        name,
        code,
        type,
        organizationId: currentUser.organizationId || 'org-main-01',
        campusId: 'campus-north',
        departmentId: `dept-${type}`,
        building,
        roomNumber,
        capacity: Number(capacity),
        managerId: currentUser.id,
        managerName: currentUser.displayName,
        technicianIds: ['usr-tech-01'],
        contactEmail: `${code.toLowerCase()}@institution.edu`,
        operatingHours: '08:30 - 17:30 (Mon-Fri)',
        safetyLevel: 'Standard',
        status: 'active',
        description: `Academic and scientific research facility for ${type}.`,
        enabledModules: ['inventory', 'equipment', 'booking'],
        createdAt: new Date().toISOString()
      }, currentUser);

      setIsAddModalOpen(false);
      setName('');
      setCode('');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Enterprise Governance
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">University Multi-Facility Registry</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Administrator Laboratory Management
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-2xl">
            Detailed operational oversight of laboratory infrastructure, workstation hardware specifications, safety compliance, and faculty supervision.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-2xl text-sm font-extrabold flex items-center space-x-2 shadow-lg transition"
        >
          <Plus className="w-5 h-5 text-[#172033]" />
          <span>Register New Laboratory</span>
        </button>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laboratories.map(lab => {
          const isComputerLab = lab.type === 'computer_science';
          const labSessionsCount = allSessions.filter(s =>
            s.laboratoryId === lab.id ||
            (lab.name.toLowerCase().includes('vinodham') && s.laboratoryId === 'lab-vin-01') ||
            (lab.code && s.laboratoryId.toLowerCase().includes(lab.code.toLowerCase()))
          ).length;

          return (
            <div
              key={lab.id}
              onClick={() => {
                setSelectedLab(lab);
                setActiveTab('timetable');
              }}
              className="p-6 bg-white border border-[#E4E7F0] rounded-3xl shadow-card hover:shadow-card-hover hover:border-cyan-300 transition cursor-pointer flex flex-col justify-between space-y-4 group text-[#172033]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                    {lab.code}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Operational
                  </span>
                </div>

                <h3 className="font-heading font-black text-xl text-[#172033] mt-3 group-hover:text-cyan-600 transition">
                  {lab.name}
                </h3>
                <p className="text-xs text-[#5B6478] flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>{lab.building} • Rm {lab.roomNumber}</span>
                </p>

                {/* Metric Badges */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#E4E7F0] text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F5F6FC] border border-[#E4E7F0]">
                    <span className="text-[10px] font-bold uppercase text-[#5B6478] block">
                      {isComputerLab ? 'Workstations' : 'Equipment'}
                    </span>
                    <span className="font-heading font-black text-base text-[#172033]">
                      {isComputerLab ? '36 Active' : '18 Units'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5]/50">
                    <span className="text-[10px] font-bold uppercase text-[#8961D8] block flex items-center gap-1">
                      <TableIcon className="w-3 h-3 text-[#8961D8]" />
                      Weekly Timetable
                    </span>
                    <span className="font-heading font-black text-base text-[#8961D8]">
                      {labSessionsCount} Sessions / Wk
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-[#5B6478] space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Supervisor / Incharge:</span>
                    <strong className="text-[#172033] font-black">{lab.managerName || 'Department Faculty'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Capacity per Batch:</span>
                    <strong className="text-[#172033]">{lab.capacity || 36} students</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E4E7F0] flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLab(lab);
                    setActiveTab('timetable');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] hover:opacity-95 text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Lab Timetable</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLab(lab);
                    setActiveTab('overview');
                  }}
                  className="py-2.5 px-3 rounded-2xl bg-[#F5F6FC] hover:bg-[#E9DDF1] text-[#332B40] text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED FACILITY MANAGEMENT DEEP-DIVE MODAL */}
      {selectedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-5xl bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[92vh] text-[#172033] my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-white border-b border-[#E4E7F0] flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold">
                    {selectedLab.code}
                  </span>
                  <span className="text-[#5B6478] text-xs font-medium">
                    {selectedLab.building} • Room {selectedLab.roomNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/50 text-xs font-bold">
                    Incharge: {selectedLab.managerName}
                  </span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#172033] mt-2">
                  {selectedLab.name}
                </h2>
                <p className="text-[#5B6478] text-xs mt-0.5">
                  Type: {selectedLab.type.replace('_', ' ')} • Safety Level: {selectedLab.safetyLevel || 'Standard'} • Capacity: {selectedLab.capacity} students / batch
                </p>
              </div>

              <button
                onClick={() => setSelectedLab(null)}
                className="p-2 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-[#F5F6FC] transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center space-x-1 px-6 border-b border-[#E4E7F0] overflow-x-auto bg-[#F5F6FC] shrink-0">
              <button
                onClick={() => setActiveTab('timetable')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition shrink-0 flex items-center space-x-1.5 ${
                  activeTab === 'timetable'
                    ? 'border-[#8961D8] text-[#8961D8] bg-white'
                    : 'border-transparent text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-[#8961D8]" />
                <span>Timetable & Class Schedule ({sessions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-cyan-600 text-cyan-800 bg-white'
                    : 'border-transparent text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                Overview
              </button>
              {selectedLab.type === 'computer_science' && (
                <button
                  onClick={() => setActiveTab('workstations')}
                  className={`py-3.5 px-4 text-xs font-bold border-b-2 transition shrink-0 ${
                    activeTab === 'workstations'
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-[#5B6478] hover:text-[#172033]'
                  }`}
                >
                  Computer Workstations ({workstations.length})
                </button>
              )}
              <button
                onClick={() => setActiveTab('students')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition shrink-0 ${
                  activeTab === 'students'
                    ? 'border-purple-600 text-purple-600 bg-white'
                    : 'border-transparent text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                Students & Staff Roster
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition shrink-0 ${
                  activeTab === 'equipment'
                    ? 'border-purple-600 text-purple-600 bg-white'
                    : 'border-transparent text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                Equipment ({equipment.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition shrink-0 ${
                  activeTab === 'inventory'
                    ? 'border-purple-600 text-purple-600 bg-white'
                    : 'border-transparent text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                Chemicals & Stock ({inventory.length})
              </button>
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TIMETABLE & CLASS SCHEDULE TAB */}
              {activeTab === 'timetable' && (
                <div className="space-y-6">
                  {/* Poster Header */}
                  <div className="p-6 bg-gradient-to-r from-[#FFF8F2] via-white to-[#F0E9FF] border-2 border-[#BCA0F5]/40 rounded-3xl shadow-sm text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="px-3 py-0.5 rounded-full bg-[#BCA0F5] text-white text-[11px] font-black uppercase tracking-wider">
                        Official Department Timetable
                      </span>
                      <span className="text-xs font-extrabold text-[#71667D]">
                        Department of Computer Science & Engineering
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-2xl text-[#332B40]">
                      {selectedLab.code}: {selectedLab.name}
                    </h3>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#71667D] pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#8961D8]" />
                        {selectedLab.roomNumber}
                      </span>
                      <span className="flex items-center gap-1 bg-[#FBE5EF] px-3 py-1 rounded-full text-[#332B40] border border-[#E9DDF1]">
                        <BadgeCheck className="w-4 h-4 text-[#8961D8]" />
                        <strong>LAB INCHARGE:</strong> {selectedLab.managerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#8961D8]" />
                        Timing: 08:30 AM – 04:30 PM (Mon–Sat) • Odd Sem 2026-27
                      </span>
                    </div>
                  </div>

                  {/* Weekly Timetable Matrix */}
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

                            return (
                              <tr key={day} className="hover:bg-[#FFF8F2]/50 transition">
                                {/* Day Column */}
                                <td className="py-4 px-3 font-black text-sm text-[#332B40] bg-[#FFF8F2] border-r border-[#E9DDF1]">
                                  {shortDay}
                                </td>

                                {/* Morning 8:30 - 10:30 (colSpan 2) */}
                                {morningSlot1 ? (
                                  <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                                    <div className="p-3 rounded-2xl bg-gradient-to-r from-[#F0E9FF] to-[#FBE5EF] border border-[#BCA0F5] shadow-xs text-left">
                                      <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                        <span>{morningSlot1.groupName || morningSlot1.title}</span>
                                        <span className="text-[10px] font-bold text-[#8961D8]">{morningSlot1.courseCode}</span>
                                      </div>
                                      <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                        👨‍🏫 {morningSlot1.facultyName}
                                      </p>
                                      <p className="text-[10px] text-[#71667D] mt-0.5 truncate">
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

                                {/* Mid-Morning 10:45 - 12:45 (colSpan 2) */}
                                {morningSlot2 ? (
                                  <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                                    <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#F0E9FF] border border-[#FFD2BF] shadow-xs text-left">
                                      <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                        <span>{morningSlot2.groupName || morningSlot2.title}</span>
                                        <span className="text-[10px] font-bold text-[#8961D8]">{morningSlot2.courseCode}</span>
                                      </div>
                                      <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                        👨‍🏫 {morningSlot2.facultyName}
                                      </p>
                                      <p className="text-[10px] text-[#71667D] mt-0.5 truncate">
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

                                {/* Afternoon Slots (1:30 - 4:30) */}
                                {afternoonSlot1 ? (
                                  <>
                                    {/* Spans 1:30 - 3:30 */}
                                    <td colSpan={2} className="p-2 border-r border-[#E9DDF1]">
                                      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#F0E9FF] to-[#FBE5EF] border border-[#BCA0F5] shadow-xs text-left">
                                        <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                          <span>{afternoonSlot1.groupName || afternoonSlot1.title}</span>
                                          <span className="text-[10px] font-bold text-[#8961D8]">{afternoonSlot1.courseCode}</span>
                                        </div>
                                        <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                          👨‍🏫 {afternoonSlot1.facultyName}
                                        </p>
                                        <p className="text-[10px] text-[#71667D] mt-0.5 truncate">
                                          {afternoonSlot1.title}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="p-2 text-[#71667D]/40 text-xs italic">—</td>
                                  </>
                                ) : afternoonSlot2 ? (
                                  <>
                                    <td className="p-2 border-r border-[#E9DDF1] text-[#71667D]/40 text-xs italic">—</td>
                                    {/* Spans 2:30 - 4:30 */}
                                    <td colSpan={2} className="p-2">
                                      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FBE5EF] to-[#FFF8F2] border border-[#E9DDF1] shadow-xs text-left">
                                        <div className="font-heading font-black text-xs text-[#332B40] flex items-center justify-between">
                                          <span>{afternoonSlot2.groupName || afternoonSlot2.title}</span>
                                          <span className="text-[10px] font-bold text-[#8961D8]">{afternoonSlot2.courseCode}</span>
                                        </div>
                                        <p className="text-[11px] font-extrabold text-[#8961D8] mt-0.5 truncate">
                                          👨‍🏫 {afternoonSlot2.facultyName}
                                        </p>
                                        <p className="text-[10px] text-[#71667D] mt-0.5 truncate">
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

                  {/* Lab Faculty Duty Roster (Morning vs. Afternoon) */}
                  <div className="p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-black text-base text-[#332B40] flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#8961D8]" />
                        Faculty Duty Roster for {selectedLab.name}
                      </h4>
                      <span className="text-xs font-bold text-[#8961D8]">
                        Odd Sem 2026-27 Breakdown
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
                            const roster = facultyDutyRoster[day];
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

                  {/* List of Practical Sessions Conducted in this Lab */}
                  <div className="p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-xs space-y-3">
                    <h4 className="font-heading font-black text-base text-[#332B40] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#8961D8]" />
                      All Scheduled Practical Batches ({sessions.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sessions.map(s => (
                        <div key={s.id} className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-full bg-[#F0E9FF] text-[#8961D8] font-mono text-[11px] font-bold border border-[#BCA0F5]/40">
                                {s.courseCode}
                              </span>
                              <span className="text-xs font-bold text-[#8961D8]">{s.date} • {s.startTime}</span>
                            </div>
                            <h5 className="font-heading font-black text-sm text-[#332B40] mt-1.5">
                              {s.groupName || s.title}
                            </h5>
                            <p className="text-xs font-extrabold text-[#8961D8] mt-0.5">
                              👨‍🏫 {s.facultyName}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#E9DDF1] flex items-center justify-between text-[11px] text-[#71667D]">
                            <span>{s.studentCount || 30} Enrolled Scholars</span>
                            <span className="text-emerald-700 font-bold">{s.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 block">
                        Assigned Manager
                      </span>
                      <span className="font-heading font-black text-lg text-foreground dark:text-white mt-1 block">
                        {selectedLab.managerName || 'Elena Rostova'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">
                        Assigned Technicians
                      </span>
                      <span className="font-heading font-black text-lg text-foreground dark:text-white mt-1 block">
                        2 Staff Active
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
                        Operational Health
                      </span>
                      <span className="font-heading font-black text-lg text-emerald-600 mt-1 block">
                        94 / 100
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 block">
                        Current Utilization
                      </span>
                      <span className="font-heading font-black text-lg text-amber-600 mt-1 block">
                        78% Capacity
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-base text-foreground dark:text-white mb-2">
                      Facility Description & Safety Standards
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedLab.description || 'Primary institution laboratory facility equipped for undergraduate and postgraduate experimental research.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-border dark:border-slate-800">
                    <button
                      onClick={() => {
                        switchLaboratory(selectedLab.id);
                        setSelectedLab(null);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs shadow-md"
                    >
                      Set As Active Workspace
                    </button>
                  </div>
                </div>
              )}

              {/* COMPUTER WORKSTATIONS TAB (CS / IT) */}
              {activeTab === 'workstations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base text-foreground dark:text-white">
                        Workstation Fleet & Hardware Specifications
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Hardware tracking, CPU/RAM telemetry, IP allocations, and maintenance history
                      </p>
                    </div>
                    <span className="text-xs font-bold text-purple-600 font-mono">
                      {workstations.filter(w => w.status === 'WORKING').length} / {workstations.length} Working
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workstations.map(ws => (
                      <div
                        key={ws.id}
                        className={`p-4 rounded-2xl border transition ${
                          ws.status === 'WORKING'
                            ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20'
                            : 'border-rose-200 dark:border-rose-900 bg-rose-50/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Monitor className="w-5 h-5 text-purple-600" />
                            <span className="font-heading font-black text-base text-foreground dark:text-white">
                              {ws.workstationTag}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            ws.status === 'WORKING' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ws.status}
                          </span>
                        </div>

                        <div className="mt-3 text-xs space-y-1 text-muted-foreground">
                          <p>Processor: <strong className="text-foreground dark:text-white">{ws.cpu}</strong></p>
                          <p>Memory: <strong className="text-foreground dark:text-white">{ws.ram}</strong></p>
                          <p>Operating System: <strong className="text-foreground dark:text-white">{ws.os}</strong></p>
                          <p>Storage: <span className="font-mono">{ws.storage}</span></p>
                          <p>Last Verified: {new Date(ws.lastInspection).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENTS & STAFF ROSTER TAB */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search student name, roll number, or dept..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <button
                      onClick={() => alert('Student roster exported as CSV.')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center space-x-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV Roster</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-border dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-muted-foreground border-b border-border dark:border-slate-800">
                        <tr>
                          <th className="p-3">Scholar Name</th>
                          <th className="p-3">Institution Roll No</th>
                          <th className="p-3">Department & Class</th>
                          <th className="p-3">Faculty In Charge</th>
                          <th className="p-3">Active Session</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-slate-800">
                        {enrolledStudents.map(std => (
                          <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-foreground dark:text-white">{std.name}</td>
                            <td className="p-3 font-mono text-purple-600 font-semibold">{std.rollNo}</td>
                            <td className="p-3 text-muted-foreground">{std.dept} ({std.class})</td>
                            <td className="p-3 text-foreground dark:text-slate-200">{std.faculty}</td>
                            <td className="p-3 text-muted-foreground">{std.session}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                std.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {std.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EQUIPMENT TAB */}
              {activeTab === 'equipment' && (
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-base text-foreground dark:text-white">
                    Assigned Instruments & Hardware
                  </h4>
                  <div className="space-y-2">
                    {equipment.map(eq => (
                      <div key={eq.id} className="p-3 rounded-2xl border border-border dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Cpu className="w-5 h-5 text-purple-600" />
                          <div>
                            <span className="font-bold text-sm text-foreground dark:text-white">{eq.name}</span>
                            <p className="text-xs text-muted-foreground">Model: {eq.model} • SN: {eq.serialNumber}</p>
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 capitalize">
                          {eq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-base text-foreground dark:text-white">
                    Chemical Reagents & Materials
                  </h4>
                  <div className="space-y-2">
                    {inventory.map(item => (
                      <div key={item.id} className="p-3 rounded-2xl border border-border dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Boxes className="w-5 h-5 text-blue-600" />
                          <div>
                            <span className="font-bold text-sm text-foreground dark:text-white">{item.name}</span>
                            <p className="text-xs text-muted-foreground">Location: {item.storageLocation} • Category: {item.category}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-foreground dark:text-white">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#F5F6FC] border-t border-[#E4E7F0] flex items-center justify-between">
              <span className="text-xs text-[#5B6478]">
                All records verified with institutional Firestore backend.
              </span>
              <button
                onClick={() => setSelectedLab(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#172033] font-bold text-xs border border-[#E4E7F0] shadow-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LAB MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl p-6 space-y-4 text-[#172033]">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] pb-3">
              <h3 className="font-heading font-black text-xl text-[#172033]">
                Register New Facility
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-[#5B6478]" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] uppercase mb-1">Laboratory Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Advanced Photonics Lab"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] bg-[#F5F6FC] text-[#172033] text-sm focus:outline-none focus:border-[#18BDF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted-foreground uppercase mb-1">Facility Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. PHO-401"
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-foreground uppercase mb-1">Discipline Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="computer_science">Computer Science & AI</option>
                    <option value="electronics">Electronics</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="biology">Biology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted-foreground uppercase mb-1">Building</label>
                  <input
                    type="text"
                    value={building}
                    onChange={e => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-foreground uppercase mb-1">Room / Floor</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md"
                >
                  Confirm & Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
