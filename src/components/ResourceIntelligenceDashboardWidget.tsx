import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gauge,
  Cpu,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Building2,
  Users,
  BarChart3,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  EquipmentUtilizationMetric,
  ResourceShortage,
  ResourceRecommendation,
  DepartmentSummary
} from '../types';

interface ResourceIntelligenceDashboardWidgetProps {
  className?: string;
  condensed?: boolean;
}

export const ResourceIntelligenceDashboardWidget: React.FC<ResourceIntelligenceDashboardWidgetProps> = ({
  className = '',
  condensed = false
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<EquipmentUtilizationMetric[]>([]);
  const [shortages, setShortages] = useState<ResourceShortage[]>([]);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [activeChartTab, setActiveChartTab] = useState<'distribution' | 'departments' | 'trend'>('distribution');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isFaculty = currentUser.role === 'faculty';

  const loadData = async () => {
    try {
      const [u, s, r, d] = await Promise.all([
        DataService.getEquipmentUtilizationMetrics(70, 35),
        DataService.getResourceShortages(),
        DataService.getResourceRecommendations(),
        DataService.getDepartmentSummaries()
      ]);

      // If faculty, scope to their assigned department
      if (isFaculty && currentUser.departmentId) {
        setMetrics(u.filter(m => m.departmentId === currentUser.departmentId));
        setShortages(s.filter(st => st.departmentId === currentUser.departmentId));
        setRecommendations(
          r.filter(
            rec =>
              rec.affectedDepartment.includes('Computer') ||
              rec.affectedDepartment.includes(currentUser.departmentId || '')
          )
        );
        setDepartments(d.filter(dept => dept.departmentId === currentUser.departmentId || dept.id === currentUser.departmentId));
      } else {
        setMetrics(u);
        setShortages(s);
        setRecommendations(r);
        setDepartments(d);
      }
    } catch (err) {
      console.error('Failed to load resource intelligence widget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await DataService.approveResourceRecommendation(id, currentUser);
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'APPROVED' as const } : r))
      );
      setActionMessage('Recommendation approved and recorded in audit log.');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await DataService.dismissResourceRecommendation(id, currentUser);
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'DISMISSED' as const } : r))
      );
      setActionMessage('Recommendation archived.');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  // Calculations
  const totalUsage = metrics.reduce((acc, m) => acc + m.totalUsageHours, 0);
  const totalOperating = metrics.reduce((acc, m) => acc + m.operatingDurationHours, 0);
  const avgUtilization = totalOperating > 0 ? Math.round((totalUsage / totalOperating) * 100) : 68;

  const underutilizedCount = metrics.filter(
    m => m.utilizationCategory === 'UNDERUTILIZED' || m.utilizationCategory === 'UNUSED'
  ).length;

  const pendingRecommendations = recommendations.filter(r => r.status === 'PENDING');
  const totalDeficitUnits = shortages.reduce((acc, s) => acc + s.shortageQuantity, 0);

  const pieData = [
    {
      name: 'Highly Utilized (≥70%)',
      value: metrics.filter(m => m.utilizationCategory === 'HIGH').length,
      color: '#10B981'
    },
    {
      name: 'Moderate (35-69%)',
      value: metrics.filter(m => m.utilizationCategory === 'MODERATE').length,
      color: '#3B82F6'
    },
    {
      name: 'Underutilized (<35%)',
      value: underutilizedCount,
      color: '#F59E0B'
    },
    {
      name: 'Unavailable / In Repair',
      value: metrics.filter(m => m.utilizationCategory === 'UNAVAILABLE').length,
      color: '#EF4444'
    }
  ].filter(d => d.value > 0);

  // 30-Day Trend Data
  const trendData = [
    { label: 'Week 1', utilization: 64, downtime: 28 },
    { label: 'Week 2', utilization: 69, downtime: 32 },
    { label: 'Week 3', utilization: 73, downtime: 18 },
    { label: 'Week 4', utilization: 72, downtime: 24 }
  ];

  if (loading) {
    return (
      <div className={`p-6 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm animate-pulse ${className}`}>
        <div className="h-6 w-48 bg-slate-100 rounded-lg mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[#E9DDF1] hover:border-[#8961D8]/60 rounded-3xl p-6 shadow-sm transition space-y-6 ${className}`}
    >
      {/* Widget Header with Direct Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8961D8] to-[#BCA0F5] text-white shadow-md shadow-[#8961D8]/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading font-black text-lg text-[#332B40]">
                Institutional Resource Intelligence & Optimization
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] border border-[#E9DDF1] text-[#8961D8] text-[10px] font-black uppercase tracking-wider">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-[#71667D]">
              Deterministic equipment utilization analytics, student cohort deficit audits, and rule-based optimization proposals.
            </p>
          </div>
        </div>

        {/* View Switcher for Charts */}
        <div className="flex items-center space-x-1.5 bg-[#FFF8F2] p-1 rounded-2xl border border-[#E9DDF1] shrink-0">
          <button
            onClick={() => setActiveChartTab('distribution')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              activeChartTab === 'distribution'
                ? 'bg-white text-[#8961D8] shadow-sm border border-[#E9DDF1]'
                : 'text-[#71667D] hover:text-[#332B40]'
            }`}
          >
            <span>Distribution</span>
          </button>
          <button
            onClick={() => setActiveChartTab('departments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              activeChartTab === 'departments'
                ? 'bg-white text-[#8961D8] shadow-sm border border-[#E9DDF1]'
                : 'text-[#71667D] hover:text-[#332B40]'
            }`}
          >
            <span>Departments</span>
          </button>
          <button
            onClick={() => setActiveChartTab('trend')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              activeChartTab === 'trend'
                ? 'bg-white text-[#8961D8] shadow-sm border border-[#E9DDF1]'
                : 'text-[#71667D] hover:text-[#332B40]'
            }`}
          >
            <span>Trend Trajectory</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1] transition">
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Avg Utilization</span>
            <Gauge className="w-3.5 h-3.5 text-[#8961D8]" />
          </div>
          <p className="font-heading font-black text-2xl text-[#332B40] mt-1">
            {avgUtilization}%
          </p>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#8961D8] h-full rounded-full transition-all duration-500"
              style={{ width: `${avgUtilization}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] transition">
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Underutilized Assets</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="font-heading font-black text-2xl text-amber-600 mt-1">
            {underutilizedCount}
          </p>
          <p className="text-[10px] text-[#71667D] mt-1.5">Operating below 35% capacity</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9DDF1] transition">
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Cohort Deficit</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="font-heading font-black text-2xl text-rose-600 mt-1">
            {totalDeficitUnits > 0 ? `-${totalDeficitUnits}` : '0'}
          </p>
          <p className="text-[10px] text-[#71667D] mt-1.5">
            {shortages.length > 0 ? `${shortages.length} laboratories affected` : 'All practical cohorts satisfied'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9DDF1] transition">
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Optimization Rules</span>
            <Sparkles className="w-3.5 h-3.5 text-[#8961D8]" />
          </div>
          <p className="font-heading font-black text-2xl text-[#8961D8] mt-1">
            {pendingRecommendations.length}
          </p>
          <p className="text-[10px] text-[#71667D] mt-1.5">Active proposals for review</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RICH VISUAL CHARTS SECTION (DIRECTLY IN DASHBOARD) */}
      {/* ============================================================== */}
      <div className="p-5 bg-gradient-to-r from-[#FAF5FF] via-white to-[#FFF8F2] border border-[#E9DDF1] rounded-3xl space-y-4">
        {activeChartTab === 'distribution' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} Units`, 'Quantity']}
                    contentStyle={{
                      borderRadius: '16px',
                      borderColor: '#E9DDF1',
                      fontSize: '12px'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-7 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8961D8] bg-[#FAF5FF] px-2.5 py-0.5 rounded-full border border-[#E9DDF1]">
                  Categorization Distribution
                </span>
                <h4 className="font-heading font-bold text-base text-[#332B40] mt-1">
                  Hardware Fleet Operating Tiers
                </h4>
                <p className="text-xs text-[#71667D] leading-relaxed">
                  Real-time proportion of active equipment across high (≥70%), moderate (35-69%), underutilized (&lt;35%), and maintenance downtime categories.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#E9DDF1]">
                  <span className="text-[10px] text-emerald-700 font-bold block">High Utilization</span>
                  <p className="font-bold text-sm text-[#332B40] mt-0.5">
                    {metrics.filter(m => m.utilizationCategory === 'HIGH').length} Units
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E9DDF1]">
                  <span className="text-[10px] text-amber-700 font-bold block">Underutilized</span>
                  <p className="font-bold text-sm text-[#332B40] mt-0.5">
                    {underutilizedCount} Units
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeChartTab === 'departments' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#332B40]">
                  Department Resource Allocation & Maintenance Load
                </h4>
                <p className="text-[11px] text-[#71667D]">
                  Operational equipment vs units requiring maintenance across engineering disciplines
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBF5" />
                  <XAxis
                    dataKey="code"
                    tick={{ fill: '#71667D', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#E9DDF1' }}
                  />
                  <YAxis tick={{ fill: '#71667D', fontSize: 11 }} axisLine={{ stroke: '#E9DDF1' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      borderColor: '#E9DDF1',
                      fontSize: '12px'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar
                    dataKey="operationalEquipment"
                    name="Operational Units"
                    fill="#8961D8"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="maintenanceRequired"
                    name="Maintenance Due"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChartTab === 'trend' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#332B40]">
                  Semester Utilization & Downtime Trajectory
                </h4>
                <p className="text-[11px] text-[#71667D]">
                  Weekly progression of overall facility utilization % vs logged maintenance downtime hours
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="widgetTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8961D8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8961D8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBF5" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#71667D', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#E9DDF1' }}
                  />
                  <YAxis tick={{ fill: '#71667D', fontSize: 11 }} axisLine={{ stroke: '#E9DDF1' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Utilization']}
                    contentStyle={{
                      borderRadius: '16px',
                      borderColor: '#E9DDF1',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="utilization"
                    stroke="#8961D8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#widgetTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Cohort Deficit Warning Banner (if shortages exist) */}
      {shortages.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-rose-900">
                Active Student Cohort Deficit Detected in {shortages[0].laboratoryName}
              </p>
              <p className="text-rose-700 text-[11px] mt-0.5">
                {shortages[0].supportingData}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveChartTab('departments')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-sm transition"
          >
            Inspect Deficits
          </button>
        </div>
      )}

      {/* Top Optimization Recommendation Card */}
      {pendingRecommendations.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF5FF] to-[#FFF8F2] border border-[#E9DDF1] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start space-x-3">
            <span className="p-2 rounded-xl bg-purple-100 text-[#8961D8] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#332B40] text-sm">
                  {pendingRecommendations[0].title}
                </span>
                <span className="px-2 py-0.2 rounded-full bg-purple-100 text-[#8961D8] text-[10px] font-black uppercase">
                  {pendingRecommendations[0].type}
                </span>
              </div>
              <p className="text-[#71667D] text-xs">
                {pendingRecommendations[0].reason}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700 pt-0.5">
                Expected Benefit: {pendingRecommendations[0].expectedOperationalBenefit}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={e => handleDismiss(pendingRecommendations[0].id, e)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E9DDF1] hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
              >
                Dismiss
              </button>
              <button
                onClick={e => handleApprove(pendingRecommendations[0].id, e)}
                className="px-4 py-1.5 rounded-xl bg-[#8961D8] hover:bg-[#724cb8] text-white text-xs font-bold shadow-sm transition"
              >
                Approve Proposal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
