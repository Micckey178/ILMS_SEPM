import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Cpu,
  Boxes,
  CalendarCheck,
  AlertTriangle,
  Activity,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { SmartLabHealthScoreCard } from '../../components/SmartLabHealthScoreCard';
import { ResourceIntelligenceDashboardWidget } from '../../components/ResourceIntelligenceDashboardWidget';
import {
  Laboratory,
  UniversalInventoryItem,
  EquipmentAsset,
  EquipmentBooking,
  MaintenanceRecord,
  IncidentTicket,
  SmartHealthScore,
  ComputerWorkstation
} from '../../types';

interface AdminDashboardProps {
  onOpenQRScanner: () => void;
  onOpenLiveAvailability: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenQRScanner,
  onOpenLiveAvailability
}) => {
  const navigate = useNavigate();
  const { laboratories, activeLab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [inventory, setInventory] = useState<UniversalInventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [workstations, setWorkstations] = useState<ComputerWorkstation[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentTicket[]>([]);
  const [healthScore, setHealthScore] = useState<SmartHealthScore | null>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [inv, eq, bk, ws, mn, inc, hs] = await Promise.all([
          DataService.getInventory(),
          DataService.getEquipment(),
          DataService.getBookings(),
          DataService.getWorkstations(),
          DataService.getMaintenanceRecords(),
          DataService.getIncidents(),
          DataService.calculateLabHealthScore(activeLab?.id)
        ]);
        setInventory(inv);
        setEquipment(eq);
        setBookings(bk);
        setWorkstations(ws);
        setMaintenances(mn);
        setIncidents(inc);
        setHealthScore(hs);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, [activeLab]);

  if (loading || !healthScore) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-base font-bold text-foreground">
          Aggregating institution-wide metrics from database...
        </p>
      </div>
    );
  }

  // Calculate live operational metrics
  const totalLabs = laboratories.length;
  const activeLabsCount = laboratories.filter(l => l.status === 'active').length;
  const totalStudents = 1420;

  const totalEquipmentCount = equipment.length;
  const availableEquipmentCount = equipment.filter(e => e.status === 'AVAILABLE').length;
  const workingSystemsCount = workstations.filter(w => w.status === 'WORKING').length;
  const nonWorkingSystemsCount = workstations.filter(w => w.status === 'FAULTY' || w.status === 'UNDER_MAINTENANCE').length;

  const lowStockCount = inventory.filter(i => i.isLowStock || i.quantity <= i.minStock).length;
  const todayBookingsCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingApprovalsCount = bookings.filter(b => b.status === 'PENDING').length;
  const openIncidentsCount = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

  // Laboratory-wise comparison dataset
  const labComparisonData = laboratories.map(lab => {
    const labEq = equipment.filter(e => e.laboratoryId === lab.id);
    const labInv = inventory.filter(i => i.laboratoryId === lab.id);
    return {
      name: lab.name.replace('Laboratory', 'Lab').substring(0, 16),
      equipment: labEq.length,
      inventory: labInv.length,
      capacity: lab.capacity || 30
    };
  });

  // Equipment condition distribution
  const conditionData = [
    { name: 'Optimal (Ready)', value: equipment.filter(e => e.status === 'AVAILABLE').length, color: '#16A34A' },
    { name: 'Active / In Use', value: equipment.filter(e => e.status === 'IN_USE' || e.status === 'RESERVED').length, color: '#3B82F6' },
    { name: 'Maintenance / Fault', value: equipment.filter(e => e.status === 'UNDER_MAINTENANCE' || e.status === 'MAINTENANCE_BLOCKED' || e.status === 'OUT_OF_SERVICE').length, color: '#EF4444' },
  ];

  // Inventory consumption trends
  const consumptionTrends = [
    { month: 'May', consumables: 420, reagents: 280 },
    { month: 'Jun', consumables: 510, reagents: 340 },
    { month: 'Jul', consumables: 390, reagents: 210 },
    { month: 'Aug', consumables: 680, reagents: 490 },
    { month: 'Sep', consumables: 840, reagents: 620 },
    { month: 'Oct', consumables: 920, reagents: 710 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Institutional Command Center
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">University Multi-Facility Oversight</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Administrator Executive Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-2xl leading-relaxed">
            Real-time multi-laboratory health, equipment readiness, inventory consumption, and safety compliance across all scientific and engineering campuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/timetable')}
            className="px-4 py-2.5 rounded-2xl bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border border-[#E9DDF1] font-bold text-sm transition shadow-xs flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-[#8961D8]" />
            <span>Master Timetables (12 Labs)</span>
          </button>
          <button
            onClick={onOpenLiveAvailability}
            className="px-4 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold text-sm transition shadow-md flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-[#172033]" />
            <span>Live Resource Matrix</span>
          </button>
          <button
            onClick={onOpenQRScanner}
            className="px-4 py-2.5 rounded-2xl bg-[#F5F6FC] hover:bg-slate-100 text-[#172033] border border-[#E4E7F0] font-bold text-sm transition flex items-center gap-2"
          >
            <span>Scan Asset QR</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-foreground">
            <Filter className="w-4 h-4 text-purple-600" />
            <span>Campus Filters:</span>
          </div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Laboratory Disciplines ({laboratories.length})</option>
            <option value="chemistry">Chemistry & Materials</option>
            <option value="physics">Physics & Instrumentation</option>
            <option value="computer_science">Computer Science & AI</option>
            <option value="electronics">Electronics & Embedded</option>
          </select>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold text-muted-foreground">
          <span>Active Facilities: <strong>{activeLabsCount} / {totalLabs}</strong></span>
          <span>•</span>
          <span>Enrolled Scholars: <strong>{totalStudents}</strong></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div
          onClick={() => navigate('/timetable')}
          className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card transition hover:shadow-card-hover hover:border-purple-400 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-600 transition">
              Class Timetables
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl sm:text-4xl text-foreground dark:text-white">
              12 Labs
            </span>
            <p className="text-xs text-purple-600 font-bold mt-1 flex items-center gap-1">
              <span>All Classes & Faculty</span>
              <span className="text-muted-foreground">• Odd Sem 26-27</span>
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/laboratories')}
          className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card transition hover:shadow-card-hover hover:border-purple-400 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-purple-600 transition">
              Total Laboratories
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl sm:text-4xl text-foreground dark:text-white">
              {totalLabs}
            </span>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <span>{activeLabsCount} Operational</span>
              <span className="text-muted-foreground">• 1 Scheduled Maintenance</span>
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/equipment')}
          className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card transition hover:shadow-card-hover hover:border-blue-400 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-600 transition">
              Equipment Assets
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl sm:text-4xl text-foreground dark:text-white">
              {totalEquipmentCount}
            </span>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              <strong className="text-emerald-600">{availableEquipmentCount} Ready</strong> • {totalEquipmentCount - availableEquipmentCount} In Use/Cal
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/specialized')}
          className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card transition hover:shadow-card-hover hover:border-indigo-400 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-indigo-600 transition">
              Workstation Fleet
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl sm:text-4xl text-foreground dark:text-white">
              {workingSystemsCount}
            </span>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              <strong className="text-emerald-600">{workingSystemsCount} Working</strong> • <strong className="text-rose-600">{nonWorkingSystemsCount} Faulty</strong>
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/bookings')}
          className="p-5 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card transition hover:shadow-card-hover hover:border-amber-400 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-amber-600 transition">
              Safety & Approvals
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-black text-3xl sm:text-4xl text-foreground dark:text-white">
              {pendingApprovalsCount}
            </span>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              <strong className="text-amber-600">{pendingApprovalsCount} Bookings Due</strong> • {openIncidentsCount} Open Incidents
            </p>
          </div>
        </div>
      </div>

      {/* Smart Health Score Component */}
      <SmartLabHealthScoreCard score={healthScore} labName="Consolidated University Facilities" />

      {/* Institutional Resource Intelligence Live Matrix */}
      <ResourceIntelligenceDashboardWidget />

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab-wise Resource Comparison Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
                Facility Resource Allocation
              </h3>
              <p className="text-xs text-muted-foreground">
                Distribution of hardware assets and chemical/consumable items per laboratory
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 font-mono">Live Telemetry</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '1rem',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                />
                <Legend />
                <Bar dataKey="equipment" fill="#9333EA" name="Equipment Assets" radius={[8, 8, 0, 0]} />
                <Bar dataKey="inventory" fill="#4F7DFF" name="Stock Items" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Condition Breakdown */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Equipment Condition Health
            </h3>
            <p className="text-xs text-muted-foreground">
              Functional status distribution of technical instrumentation
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-border dark:border-slate-800">
            {conditionData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="text-muted-foreground">{d.name}</span>
                </span>
                <span className="font-bold text-foreground dark:text-white">{d.value} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Consumption Trends */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-foreground dark:text-white">
              Inventory & Material Consumption Velocity
            </h3>
            <p className="text-xs text-muted-foreground">
              Six-month historical trajectory of scientific consumables and chemical reagents
            </p>
          </div>
          <span className="text-xs font-bold text-purple-600">Departmental Audit</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={consumptionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConsumables" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReagents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F7DFF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4F7DFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1b4b',
                  borderRadius: '1rem',
                  border: 'none',
                  color: '#fff'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="consumables" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorConsumables)" name="General Consumables" />
              <Area type="monotone" dataKey="reagents" stroke="#4F7DFF" strokeWidth={2} fillOpacity={1} fill="url(#colorReagents)" name="Chemical Reagents" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
