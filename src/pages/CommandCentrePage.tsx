import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldAlert,
  Cpu,
  Boxes,
  CalendarCheck,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  RotateCcw,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  ShoppingCart,
  Calendar,
  XCircle,
  Eye,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DataService, localStore } from '../services/dataService';
import {
  Laboratory,
  EquipmentAsset,
  EquipmentBooking,
  MaintenanceRecord,
  IncidentTicket,
  PurchaseRequest,
  AuditLogEntry,
  CommandCentreKPIs,
  DepartmentSummary,
  InstitutionalAlert,
  PracticalSession
} from '../types';

export const CommandCentrePage: React.FC = () => {
  const { currentUser, laboratories } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'bookings' | 'alerts' | 'timeline'>('overview');

  // Loading state
  const [loading, setLoading] = useState(true);

  // Core Data
  const [kpis, setKpis] = useState<CommandCentreKPIs | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [alerts, setAlerts] = useState<InstitutionalAlert[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [sessions, setSessions] = useState<PracticalSession[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLogEntry[]>([]);

  // Global Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-27 (Odd Sem)');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // Timeline Filter & Pagination
  const [timelineCategory, setTimelineCategory] = useState('ALL');
  const [timelinePage, setTimelinePage] = useState(1);
  const TIMELINE_PAGE_SIZE = 10;

  // Booking Tab Filter
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [k, d, a, l, eq, bk, ss, mn, logs] = await Promise.all([
        DataService.getCommandCentreKPIs(),
        DataService.getDepartmentSummaries(),
        DataService.getInstitutionalAlerts(),
        DataService.getLaboratories(),
        DataService.getEquipment(),
        DataService.getBookings(),
        DataService.getPracticalSessions(),
        DataService.getMaintenanceRecords(),
        DataService.getAuditLogs()
      ]);
      setKpis(k);
      setDepartments(d);
      setAlerts(a);
      setLabs(l);
      setEquipment(eq);
      setBookings(bk);
      setSessions(ss);
      setMaintenances(mn);
      setActivityLogs(logs);
    } catch (err) {
      console.error('Failed to load Command Centre metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    await DataService.acknowledgeAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Filtered Laboratories
  const filteredLabs = useMemo(() => {
    return labs.filter(lab => {
      const matchesSearch =
        lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lab.building && lab.building.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lab.managerName && lab.managerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDepartment === 'ALL' || lab.departmentId === selectedDepartment;
      const matchesCategory = selectedCategory === 'ALL' || lab.type === selectedCategory;

      const hasAlert = alerts.some(a => a.laboratoryId === lab.id);
      let matchesStatus = true;
      if (selectedStatus === 'OPERATIONAL') {
        matchesStatus = lab.status === 'active' && !hasAlert;
      } else if (selectedStatus === 'ATTENTION') {
        matchesStatus = lab.status !== 'active' || hasAlert;
      }

      if (kpiFilter === 'attention') {
        matchesStatus = lab.status !== 'active' || hasAlert;
      }

      return matchesSearch && matchesDept && matchesCategory && matchesStatus;
    });
  }, [labs, searchQuery, selectedDepartment, selectedCategory, selectedStatus, alerts, kpiFilter]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesLab = selectedDepartment === 'ALL' || labs.find(l => l.id === b.laboratoryId)?.departmentId === selectedDepartment;
      const matchesStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
      const matchesSearch =
        b.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLab && matchesStatus && matchesSearch;
    });
  }, [bookings, selectedDepartment, bookingStatusFilter, searchQuery, labs]);

  // Filtered Activity Timeline
  const filteredTimeline = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesCat = timelineCategory === 'ALL' || log.category === timelineCategory;
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activityLogs, timelineCategory, searchQuery]);

  const paginatedTimeline = useMemo(() => {
    const start = (timelinePage - 1) * TIMELINE_PAGE_SIZE;
    return filteredTimeline.slice(start, start + TIMELINE_PAGE_SIZE);
  }, [filteredTimeline, timelinePage]);

  const totalTimelinePages = Math.ceil(filteredTimeline.length / TIMELINE_PAGE_SIZE) || 1;

  // Role Access Guard: Only Administrator
  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 bg-white border border-[#E9DDF1] rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-[#332B40]">
          Institutional Command Centre — Administrator Authorization Required
        </h2>
        <p className="text-sm text-[#71667D] max-w-lg mx-auto leading-relaxed">
          The ILMS Command Centre provides centralized institutional monitoring, cross-departmental oversight, and sensitive operational controls. Access is strictly limited to authorized System Administrators.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-full bg-[#8961D8] text-white font-bold text-sm hover:bg-[#724cb8] transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const resetAllFilters = () => {
    setSelectedDepartment('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setKpiFilter(null);
    setBookingStatusFilter('ALL');
    setTimelineCategory('ALL');
  };

  const chartColors = ['#8961D8', '#BCA0F5', '#FFD2BF', '#4ADE80', '#38BDF8', '#F472B6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HERO HEADER WITH INSTITUTIONAL BADGE */}
      <div className="p-6 sm:p-8 bg-white border border-[#E9DDF1] rounded-3xl text-[#332B40] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/50 font-mono text-xs uppercase font-extrabold tracking-wider">
              {selectedAcademicYear} • Live Enterprise Telemetry
            </span>
            <span className="px-3 py-1 rounded-full bg-[#E8F8F0] text-[#1E7E52] border border-[#A7E7C4] text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator Master Scope
            </span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#332B40] mt-2 tracking-tight flex items-center gap-2.5">
            <span>ILMS Command Centre</span>
            <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#FFF8F2] text-[#8961D8] border border-[#FFD2BF]">
              Central Ops
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[#71667D] mt-1 max-w-2xl leading-relaxed">
            Centralized institutional operations and control tower monitoring all laboratories, academic departments, precision equipment, active reservations, and campus safety incidents in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/resource-intelligence')}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] hover:from-[#a782f0] hover:to-[#774ec7] text-white font-extrabold text-sm flex items-center gap-2 transition active:scale-95 shadow-md"
          >
            <TrendingUp className="w-4 h-4 text-white" />
            <span>Resource Intelligence</span>
          </button>
          <button
            onClick={loadAllData}
            className="px-4 py-2.5 rounded-full bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border border-[#E9DDF1] font-bold text-sm flex items-center gap-2 transition active:scale-95 shadow-xs"
          >
            <RotateCcw className={`w-4 h-4 text-[#8961D8] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW KPI CARDS (Section 2.2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Laboratories */}
        <div
          onClick={() => { setActiveTab('overview'); setKpiFilter(null); }}
          className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-[#8961D8] cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[#71667D]">
            <span className="font-bold">Total Labs</span>
            <div className="w-7 h-7 rounded-xl bg-[#F0E9FF] text-[#8961D8] flex items-center justify-center group-hover:scale-110 transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#332B40]">
              {kpis?.totalLaboratories ?? labs.length}
            </span>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              {kpis?.operationalLaboratories ?? labs.length} Operational
            </div>
          </div>
        </div>

        {/* Card 2: Attention Required */}
        <div
          onClick={() => { setActiveTab('alerts'); }}
          className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-amber-400 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[#71667D]">
            <span className="font-bold">Needs Attention</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-amber-600">
              {alerts.length}
            </span>
            <div className="text-[11px] font-semibold text-[#71667D] mt-0.5">
              Active Institutional Alerts
            </div>
          </div>
        </div>

        {/* Card 3: Registered Equipment */}
        <div
          onClick={() => navigate('/equipment')}
          className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-[#8961D8] cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[#71667D]">
            <span className="font-bold">Total Equipment</span>
            <div className="w-7 h-7 rounded-xl bg-[#F0E9FF] text-[#8961D8] flex items-center justify-center group-hover:scale-110 transition">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#332B40]">
              {kpis?.totalRegisteredEquipment ?? equipment.length}
            </span>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              {kpis?.workingEquipment ?? 0} Working Units
            </div>
          </div>
        </div>

        {/* Card 4: Non-Operational Equipment */}
        <div
          onClick={() => navigate('/maintenance')}
          className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-rose-400 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[#71667D]">
            <span className="font-bold">Non-Operational</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-rose-600">
              {kpis?.nonOperationalEquipment ?? 0}
            </span>
            <div className="text-[11px] font-semibold text-[#71667D] mt-0.5">
              Under Repair / Faulty
            </div>
          </div>
        </div>

        {/* Card 5: Active Reservations */}
        <div
          onClick={() => setActiveTab('bookings')}
          className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-[#8961D8] cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[#71667D]">
            <span className="font-bold">Reservations</span>
            <div className="w-7 h-7 rounded-xl bg-[#FFF8F2] text-[#8961D8] flex items-center justify-center group-hover:scale-110 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#332B40]">
              {kpis?.activeReservations ?? bookings.length}
            </span>
            <div className="text-[11px] font-semibold text-[#8961D8] mt-0.5">
              Confirmed Facility Slots
            </div>
          </div>
        </div>

        {/* Card 6: Low-Stock & Procurement */}
        <div
          onClick={() => navigate('/procurement')}
          className="p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-cyan-400 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[#71667D]">
            <span className="font-bold">Pending Approvals</span>
            <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#332B40]">
              {kpis?.pendingApprovals ?? 0}
            </span>
            <div className="text-[11px] font-semibold text-cyan-700 mt-0.5">
              Requisitions Pending
            </div>
          </div>
        </div>
      </div>

      {/* 3. GLOBAL COMMAND CENTRE FILTER BAR (Section 2.8) */}
      <div className="p-4 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Module Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center space-x-1.5 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-sm'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Campus Laboratories ({filteredLabs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center space-x-1.5 ${
                activeTab === 'departments'
                  ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-sm'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Department Oversight ({departments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center space-x-1.5 ${
                activeTab === 'bookings'
                  ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-sm'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Institutional Bookings ({filteredBookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center space-x-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-sm'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Alerts & Attention ({alerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center space-x-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] text-white shadow-sm'
                  : 'bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Institutional Activity Feed</span>
            </button>
          </div>

          {/* Quick Clear */}
          <button
            onClick={resetAllFilters}
            className="text-xs font-bold text-[#8961D8] hover:underline flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-[#E9DDF1]">
          {/* Live Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#71667D] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search labs, equipment, faculty..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-[#332B40] font-medium outline-none focus:border-[#8961D8]"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-[#332B40] font-semibold outline-none focus:border-[#8961D8]"
          >
            <option value="ALL">🏛️ All Departments (Campus-Wide)</option>
            <option value="dept-cse">Computer Science & Engineering</option>
            <option value="dept-ise">Information Science & Engineering</option>
            <option value="dept-aiml">Artificial Intelligence & ML</option>
            <option value="dept-ece">Electronics & Communication</option>
            <option value="dept-chem">Basic Sciences & Applied Chemistry</option>
          </select>

          {/* Laboratory Category */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-[#332B40] font-semibold outline-none focus:border-[#8961D8]"
          >
            <option value="ALL">🧪 All Laboratory Categories</option>
            <option value="computer_science">Computer Science & AI Labs</option>
            <option value="chemistry">Chemistry & Material Science</option>
            <option value="physics">Physics & Instrumentation</option>
            <option value="electronics">Electronics & VLSI</option>
            <option value="general_research">General Research</option>
          </select>

          {/* Operational Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-[#332B40] font-semibold outline-none focus:border-[#8961D8]"
          >
            <option value="ALL">⚡ All Operational Statuses</option>
            <option value="OPERATIONAL">🟢 Fully Operational</option>
            <option value="ATTENTION">🟡 Attention / Overdue Maintenance</option>
          </select>
        </div>
      </div>

      {/* 4. TAB 1: INSTITUTION-WIDE LABORATORY MONITORING (Section 2.3) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xl text-[#332B40]">
              Institution-Wide Laboratory Inventory & Telemetry
            </h3>
            <span className="text-xs font-semibold text-[#71667D]">
              Displaying {filteredLabs.length} of {labs.length} Laboratories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLabs.map(lab => {
              const labEquip = equipment.filter(e => e.laboratoryId === lab.id);
              const workingEquip = labEquip.filter(e => e.status === 'AVAILABLE' || e.status === 'IN_USE').length;
              const faultyEquip = labEquip.filter(e => e.status === 'UNDER_MAINTENANCE' || e.status === 'FAULTY' || e.status === 'MAINTENANCE_BLOCKED').length;
              const labAlerts = alerts.filter(a => a.laboratoryId === lab.id);
              const labSessions = sessions.filter(s => s.laboratoryId === lab.id);
              const inSession = labSessions.some(s => s.status === 'IN_PROGRESS' || s.status === 'SCHEDULED');

              return (
                <div
                  key={lab.id}
                  className="p-5 bg-white border border-[#E9DDF1] hover:border-[#8961D8] rounded-3xl shadow-sm transition space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F0E9FF] text-[#8961D8] font-mono font-extrabold text-xs uppercase">
                        {lab.code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        labAlerts.length > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {labAlerts.length > 0 ? `${labAlerts.length} Alerts Pending` : '100% Operational'}
                      </span>
                    </div>

                    {/* Laboratory Name */}
                    <h4 className="font-heading font-black text-lg text-[#332B40] mt-2 leading-tight">
                      {lab.name}
                    </h4>
                    <p className="text-xs text-[#71667D] mt-0.5">
                      {lab.building} • Room {lab.roomNumber}
                    </p>
                    <p className="text-xs font-semibold text-[#8961D8] mt-1">
                      Incharge: {lab.managerName || 'Assigned Faculty'}
                    </p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-[#FFF8F2] rounded-2xl mt-3 text-center text-xs">
                      <div>
                        <span className="text-[#71667D] block text-[10px] font-bold uppercase">Working</span>
                        <strong className="text-emerald-600 font-extrabold text-sm">{workingEquip}</strong>
                      </div>
                      <div>
                        <span className="text-[#71667D] block text-[10px] font-bold uppercase">Faulty</span>
                        <strong className={`font-extrabold text-sm ${faultyEquip > 0 ? 'text-rose-600' : 'text-[#71667D]'}`}>
                          {faultyEquip}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#71667D] block text-[10px] font-bold uppercase">Seating</span>
                        <strong className="text-[#8961D8] font-extrabold text-sm">{lab.capacity}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Links */}
                  <div className="pt-3 border-t border-[#E9DDF1] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#71667D] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${inSession ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span>{inSession ? 'Practical In Progress' : 'Facility Available'}</span>
                    </span>

                    <button
                      onClick={() => navigate('/laboratories')}
                      className="text-xs font-extrabold text-[#8961D8] hover:text-[#724cb8] flex items-center gap-1"
                    >
                      <span>Deep Dive</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 2: DEPARTMENT-WISE MONITORING (Section 2.4) */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xl text-[#332B40]">
              Department Resource Comparison & Allocation Metrics
            </h3>
            <span className="text-xs text-[#71667D]">
              Accreditation-grade multi-departmental benchmark
            </span>
          </div>

          {/* Department Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, index) => (
              <div
                key={dept.id}
                className="p-6 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm hover:border-[#8961D8] transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#F0E9FF] text-[#8961D8] font-mono font-extrabold text-xs uppercase">
                    {dept.code}
                  </span>
                  <span className="text-xs font-bold text-[#71667D]">
                    {dept.laboratoriesCount} Laboratories
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-black text-lg text-[#332B40]">
                    {dept.name}
                  </h4>
                  <p className="text-xs text-[#71667D] mt-0.5">
                    Resource Utilization Rate: <strong className="text-[#8961D8]">{dept.resourceUtilizationRate}%</strong>
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E9DDF1] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#71667D]">Operational Hardware:</span>
                    <strong className="text-emerald-600 font-bold">{dept.operationalEquipment} / {dept.totalEquipment} units</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#71667D]">Equipment in Maintenance:</span>
                    <strong className={`font-bold ${dept.equipmentRequiringMaintenance > 0 ? 'text-amber-600' : 'text-[#71667D]'}`}>
                      {dept.equipmentRequiringMaintenance} units
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#71667D]">Active Practical Batches:</span>
                    <strong className="text-[#332B40] font-bold">{dept.activeSessions} Batches</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#71667D]">Maintenance Expenditure:</span>
                    <strong className="text-[#8961D8] font-bold">₹{dept.totalMaintenanceExpenditure.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => { setSelectedDepartment(dept.id); setActiveTab('overview'); }}
                    className="w-full py-2 bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#8961D8] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>View {dept.code} Laboratories</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Department Comparison Chart */}
          <div className="p-6 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-4">
            <h4 className="font-heading font-black text-lg text-[#332B40]">
              Operational Equipment vs Maintenance Workload by Department
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#71667D' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#71667D' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid #E9DDF1' }}
                    formatter={(val: any) => [`${val} Units`, 'Quantity']}
                  />
                  <Legend />
                  <Bar dataKey="operationalEquipment" name="Operational Hardware" fill="#8961D8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="equipmentRequiringMaintenance" name="Needs Maintenance" fill="#F472B6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: INSTITUTIONAL BOOKINGS OVERVIEW (Section 2.7) */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-xl text-[#332B40]">
                Institution-Wide Facility & Equipment Reservations
              </h3>
              <p className="text-xs text-[#71667D]">
                Complete audit trail of all facility allocations, practical sessions, and equipment bookings
              </p>
            </div>

            {/* Status Filter */}
            <select
              value={bookingStatusFilter}
              onChange={e => setBookingStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-[#332B40] font-bold outline-none focus:border-[#8961D8]"
            >
              <option value="ALL">All Reservation Statuses</option>
              <option value="CONFIRMED">Confirmed Slots</option>
              <option value="PENDING">Pending Faculty Approvals</option>
              <option value="CANCELLED">Cancelled / Conflict Slots</option>
            </select>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] border-b border-[#E9DDF1] text-[#71667D] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Facility / Equipment</th>
                    <th className="p-4">Reserved By</th>
                    <th className="p-4">Date & Window</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DDF1]/60 text-[#332B40]">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#71667D] font-medium">
                        No bookings match the selected department and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-[#FFF8F2]/40 transition">
                        <td className="p-4 font-bold text-[#332B40]">
                          <div>{b.equipmentName}</div>
                          <span className="text-[10px] text-[#71667D] font-mono">ID: {b.id}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">{b.userName}</div>
                          <span className="text-[10px] text-[#8961D8] uppercase font-bold">{b.userRole}</span>
                        </td>
                        <td className="p-4">
                          <div>{new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[10px] text-[#71667D]">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4 max-w-xs truncate text-[#71667D]">
                          {b.purpose}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 4: ALERTS AND ATTENTION CENTRE (Section 2.6) */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-xl text-[#332B40]">
                Institutional Alerts & Attention Centre
              </h3>
              <p className="text-xs text-[#71667D]">
                Prioritized queue of critical equipment faults, overdue calibrations, low stocks, and unresolved incidents
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {alerts.length} Pending Actions
            </span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="p-12 text-center bg-white border border-[#E9DDF1] rounded-3xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-heading font-bold text-lg text-[#332B40]">All Institutional Systems Operational</h4>
                <p className="text-xs text-[#71667D]">Zero pending critical equipment faults or overdue safety incidents.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-5 bg-white border rounded-3xl shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    alert.priority === 'CRITICAL'
                      ? 'border-rose-300 bg-rose-50/10'
                      : alert.priority === 'HIGH'
                      ? 'border-amber-300 bg-amber-50/10'
                      : 'border-[#E9DDF1]'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.priority === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700'
                        : alert.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#F0E9FF] text-[#8961D8]'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          alert.priority === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : alert.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {alert.priority} Priority
                        </span>
                        <span className="text-xs font-bold text-[#8961D8]">
                          {alert.laboratoryName}
                        </span>
                        <span className="text-xs text-[#71667D]">
                          • {new Date(alert.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h4 className="font-heading font-black text-base text-[#332B40] mt-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-[#71667D] mt-0.5 max-w-3xl leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => navigate(alert.actionUrl)}
                      className="px-4 py-2 rounded-xl bg-[#8961D8] text-white font-bold text-xs hover:bg-[#724cb8] transition flex items-center gap-1.5"
                    >
                      <span>{alert.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-3 py-2 rounded-xl bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#71667D] hover:text-[#332B40] border border-[#E9DDF1] font-bold text-xs transition"
                      title="Acknowledge alert"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 8. TAB 5: INSTITUTIONAL ACTIVITY TIMELINE (Section 2.5) */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-xl text-[#332B40]">
                Institutional Activity & Event Timeline
              </h3>
              <p className="text-xs text-[#71667D]">
                Immutable chronological ledger of equipment registrations, loans, maintenance tickets, and approvals
              </p>
            </div>

            {/* Category Filter */}
            <select
              value={timelineCategory}
              onChange={e => { setTimelineCategory(e.target.value); setTimelinePage(1); }}
              className="px-3 py-1.5 text-xs bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-[#332B40] font-bold outline-none focus:border-[#8961D8]"
            >
              <option value="ALL">All Event Categories</option>
              <option value="BOOKING">Booking & Allocations</option>
              <option value="MAINTENANCE">Maintenance & Calibration</option>
              <option value="INVENTORY">Inventory & Consumables</option>
              <option value="PROCUREMENT">Vendor & Purchasing</option>
              <option value="ADMIN">Administrative Approvals</option>
              <option value="SAFETY">Safety Incidents</option>
            </select>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-4">
            {paginatedTimeline.length === 0 ? (
              <div className="p-8 text-center text-[#71667D] text-xs font-semibold">
                No activity logs match the selected filter.
              </div>
            ) : (
              <div className="relative border-l-2 border-[#E9DDF1] ml-4 space-y-6">
                {paginatedTimeline.map(log => (
                  <div key={log.id} className="relative pl-6">
                    {/* Timeline bullet */}
                    <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-[#8961D8] border-2 border-white shadow-xs" />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F0E9FF] text-[#8961D8] font-mono text-[10px] font-extrabold uppercase">
                          {log.category}
                        </span>
                        <strong className="text-xs text-[#332B40] font-bold">
                          {log.action.replace(/_/g, ' ')}
                        </strong>
                      </div>

                      <span className="text-[11px] text-[#71667D] font-mono">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <p className="text-xs text-[#71667D] mt-1 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="text-[11px] text-[#8961D8] font-semibold mt-1">
                      Logged by {log.userName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalTimelinePages > 1 && (
              <div className="pt-4 border-t border-[#E9DDF1] flex items-center justify-between text-xs">
                <span className="text-[#71667D] font-medium">
                  Page {timelinePage} of {totalTimelinePages} ({filteredTimeline.length} events)
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={timelinePage === 1}
                    onClick={() => setTimelinePage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-xl bg-[#FFF8F2] border border-[#E9DDF1] font-bold disabled:opacity-50 hover:bg-[#F0E9FF] transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={timelinePage === totalTimelinePages}
                    onClick={() => setTimelinePage(p => Math.min(totalTimelinePages, p + 1))}
                    className="px-3 py-1 rounded-xl bg-[#FFF8F2] border border-[#E9DDF1] font-bold disabled:opacity-50 hover:bg-[#F0E9FF] transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandCentrePage;
