import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Cpu,
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Wrench,
  ShoppingCart,
  Users,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
  Clock,
  Building2,
  Calendar,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  FileText,
  DollarSign,
  Download,
  Check,
  X,
  Gauge
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
  Area,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DataService, localStore } from '../services/dataService';
import {
  Laboratory,
  EquipmentAsset,
  MaintenanceRecord,
  PurchaseRequest,
  DepartmentSummary,
  EquipmentUtilizationMetric,
  ResourceShortage,
  ResourceRecommendation,
  CapacityMetric
} from '../types';

export const ResourceIntelligencePage: React.FC = () => {
  const { currentUser, laboratories } = useAuth();
  const navigate = useNavigate();

  // Active sub-navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'utilization' | 'shortages' | 'departments' | 'capacity' | 'recommendations' | 'procurement' | 'trends'
  >('overview');

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Configurable thresholds for utilization classification (Defaults: High >= 70%, Moderate >= 35%)
  const [highThreshold, setHighThreshold] = useState<number>(70);
  const [modThreshold, setModThreshold] = useState<number>(35);

  // Primary analytical metrics
  const [utilizationMetrics, setUtilizationMetrics] = useState<EquipmentUtilizationMetric[]>([]);
  const [shortages, setShortages] = useState<ResourceShortage[]>([]);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetric[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentAsset[]>([]);

  // Trend timeframe selection
  const [trendPeriod, setTrendPeriod] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');
  const [trendMetric, setTrendMetric] = useState<'utilization' | 'downtime' | 'expenditure'>('utilization');

  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Action status message
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Role permissions
  const isFaculty = currentUser.role === 'faculty';
  const isAdmin = currentUser.role === 'admin';
  const isStudent = currentUser.role === 'student';

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s, r, d, c, pr, m, eq] = await Promise.all([
        DataService.getEquipmentUtilizationMetrics(highThreshold, modThreshold),
        DataService.getResourceShortages(),
        DataService.getResourceRecommendations(),
        DataService.getDepartmentSummaries(),
        DataService.getCapacityMetrics(),
        DataService.getPurchaseRequests(),
        DataService.getMaintenanceRecords(),
        DataService.getEquipment()
      ]);

      setUtilizationMetrics(u);
      setShortages(s);
      setRecommendations(r);
      setDepartments(d);
      setCapacityMetrics(c);
      setPurchaseRequests(pr);
      setMaintenanceRecords(m);
      setEquipmentList(eq);
    } catch (err) {
      console.error('Failed to load Resource Intelligence metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [highThreshold, modThreshold]);

  // Handle recommendation approval
  const handleApproveRecommendation = async (id: string) => {
    try {
      await DataService.approveResourceRecommendation(id, currentUser);
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'APPROVED' as const } : r))
      );
      setActionSuccess('Recommendation successfully approved. Formal audit entry generated.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
    }
  };

  // Handle recommendation dismissal
  const handleDismissRecommendation = async (id: string) => {
    try {
      await DataService.dismissResourceRecommendation(id, currentUser);
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'DISMISSED' as const } : r))
      );
      setActionSuccess('Recommendation marked as reviewed and archived.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  // Filtered metrics based on search, department, and role scoping
  const filteredMetrics = useMemo(() => {
    return utilizationMetrics.filter(m => {
      // Faculty scoping: show their assigned department / lab
      if (isFaculty && currentUser.departmentId && m.departmentId !== currentUser.departmentId) {
        return false;
      }
      const matchesSearch =
        m.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.laboratoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || m.departmentId === selectedDept;
      const matchesCategory = selectedCategory === 'ALL' || m.utilizationCategory === selectedCategory;

      return matchesSearch && matchesDept && matchesCategory;
    });
  }, [utilizationMetrics, searchQuery, selectedDept, selectedCategory, isFaculty, currentUser]);

  // Overall KPI summaries
  const overallKPIs = useMemo(() => {
    if (utilizationMetrics.length === 0) {
      return {
        avgUtilization: 0,
        totalResources: 0,
        underutilizedCount: 0,
        frequentlyUsedCount: 0,
        totalShortages: 0,
        totalDowntimeHours: 0,
        avgCapacityPct: 0,
        totalMaintenanceCost: 0
      };
    }

    const totalUsage = utilizationMetrics.reduce((sum, m) => sum + m.totalUsageHours, 0);
    const totalOperating = utilizationMetrics.reduce((sum, m) => sum + m.operatingDurationHours, 0);
    const avgUtil = totalOperating > 0 ? Math.round((totalUsage / totalOperating) * 100) : 0;

    const underutilized = utilizationMetrics.filter(
      m => m.utilizationCategory === 'UNDERUTILIZED' || m.utilizationCategory === 'UNUSED'
    ).length;
    const frequentlyUsed = utilizationMetrics.filter(m => m.utilizationCategory === 'HIGH').length;
    const totalDowntime = utilizationMetrics.reduce((sum, m) => sum + m.downtimeHours, 0);

    const totalShortageQty = shortages.reduce((sum, s) => sum + s.shortageQuantity, 0);

    const avgCap =
      capacityMetrics.length > 0
        ? Math.round(
            capacityMetrics.reduce((sum, c) => sum + c.capacityUtilizationPct, 0) /
              capacityMetrics.length
          )
        : 0;

    const totalMaintCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      avgUtilization: avgUtil,
      totalResources: utilizationMetrics.length,
      underutilizedCount: underutilized,
      frequentlyUsedCount: frequentlyUsed,
      totalShortages: totalShortageQty,
      totalDowntimeHours: totalDowntime,
      avgCapacityPct: avgCap,
      totalMaintenanceCost: totalMaintCost
    };
  }, [utilizationMetrics, shortages, capacityMetrics, maintenanceRecords]);

  // Category distribution for Pie Chart
  const utilizationDistribution = useMemo(() => {
    const counts = { HIGH: 0, MODERATE: 0, UNDERUTILIZED: 0, UNUSED: 0, UNAVAILABLE: 0 };
    utilizationMetrics.forEach(m => {
      counts[m.utilizationCategory] = (counts[m.utilizationCategory] || 0) + 1;
    });

    return [
      { name: 'Highly Utilized (≥70%)', value: counts.HIGH, color: '#10B981' },
      { name: 'Moderately Utilized (35-69%)', value: counts.MODERATE, color: '#3B82F6' },
      { name: 'Underutilized (<35%)', value: counts.UNDERUTILIZED, color: '#F59E0B' },
      { name: 'Unused (0 hrs)', value: counts.UNUSED, color: '#8B5CF6' },
      { name: 'Unavailable / In Repair', value: counts.UNAVAILABLE, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [utilizationMetrics]);

  // Historical Trends Mock Series (Deterministic based on period)
  const historicalTrendData = useMemo(() => {
    if (trendPeriod === '7D') {
      return [
        { label: 'Day 1', utilization: 62, downtime: 4, expenditure: 2400 },
        { label: 'Day 2', utilization: 68, downtime: 6, expenditure: 1800 },
        { label: 'Day 3', utilization: 74, downtime: 8, expenditure: 3200 },
        { label: 'Day 4', utilization: 71, downtime: 2, expenditure: 1500 },
        { label: 'Day 5', utilization: 79, downtime: 4, expenditure: 4100 },
        { label: 'Day 6', utilization: 55, downtime: 12, expenditure: 8000 },
        { label: 'Today', utilization: 73, downtime: 6, expenditure: 2900 }
      ];
    } else if (trendPeriod === '30D') {
      return [
        { label: 'Week 1', utilization: 64, downtime: 28, expenditure: 14500 },
        { label: 'Week 2', utilization: 69, downtime: 32, expenditure: 18200 },
        { label: 'Week 3', utilization: 73, downtime: 18, expenditure: 9400 },
        { label: 'Week 4', utilization: 72, downtime: 24, expenditure: 16800 }
      ];
    } else if (trendPeriod === '3M') {
      return [
        { label: 'Month 1', utilization: 61, downtime: 94, expenditure: 48000 },
        { label: 'Month 2', utilization: 67, downtime: 82, expenditure: 39500 },
        { label: 'Month 3', utilization: 73, downtime: 68, expenditure: 52000 }
      ];
    } else if (trendPeriod === '6M') {
      return [
        { label: 'Sem Month 1', utilization: 54, downtime: 110, expenditure: 62000 },
        { label: 'Sem Month 2', utilization: 63, downtime: 98, expenditure: 44000 },
        { label: 'Sem Month 3', utilization: 71, downtime: 76, expenditure: 51000 },
        { label: 'Sem Month 4', utilization: 76, downtime: 64, expenditure: 38000 },
        { label: 'Sem Month 5', utilization: 78, downtime: 52, expenditure: 29000 },
        { label: 'Sem Month 6', utilization: 68, downtime: 46, expenditure: 34000 }
      ];
    } else {
      return [
        { label: 'Odd Sem 2025', utilization: 62, downtime: 380, expenditure: 185000 },
        { label: 'Even Sem 2025', utilization: 67, downtime: 320, expenditure: 210000 },
        { label: 'Odd Sem 2026', utilization: 73, downtime: 275, expenditure: 194000 }
      ];
    }
  }, [trendPeriod]);

  // Unauthorized guard for Student role
  if (isStudent) {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 bg-white border border-[#E9DDF1] rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-[#332B40]">
          Institutional Resource Intelligence — Restricted Access
        </h2>
        <p className="text-sm text-[#71667D] max-w-lg mx-auto leading-relaxed">
          Institutional Resource Intelligence provides operational analytics, departmental resource comparisons, and administrative allocation metrics. Students may access their practical schedules, personal attendance, and authorized equipment booking via the student workspace.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-full bg-[#8961D8] text-white font-bold text-sm hover:bg-[#724cb8] transition"
          >
            Return to Student Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-white via-[#FFF8F2] to-[#F5EFFF] border border-[#E9DDF1] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-2xl bg-[#8961D8] text-white shadow-md shadow-[#8961D8]/20">
                <Gauge className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#332B40] tracking-tight">
                    Institutional Resource Intelligence
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EADDFF] text-[#5527A0] text-xs font-black uppercase tracking-wider">
                    VTU Verified
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#71667D] font-medium">
                  Deterministic analytics, workstation cohort deficit audits, utilization categorization, and rule-based recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Refresh & Scope Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            {isFaculty && (
              <span className="px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Department Scoped View</span>
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-2xl bg-white border border-[#E9DDF1] hover:bg-[#FBF8FF] text-xs font-bold text-[#332B40] flex items-center space-x-1.5 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8961D8] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {actionSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-1.5 mt-6 border-b border-[#E9DDF1] pb-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Intelligence Overview', icon: BarChart3 },
            { id: 'utilization', label: 'Equipment Utilization', icon: Cpu },
            { id: 'shortages', label: 'Shortages & Deficits', icon: AlertTriangle },
            { id: 'departments', label: 'Department Comparisons', icon: Building2 },
            { id: 'capacity', label: 'Laboratory Capacity', icon: Users },
            { id: 'recommendations', label: 'Resource Recommendations', icon: Sparkles },
            ...(isAdmin ? [{ id: 'procurement', label: 'Procurement Intelligence', icon: ShoppingCart }] : []),
            { id: 'trends', label: 'Historical Trends', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#8961D8] text-white shadow-sm shadow-[#8961D8]/20'
                    : 'text-[#71667D] hover:text-[#332B40] hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'shortages' && shortages.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {shortages.length}
                  </span>
                )}
                {tab.id === 'recommendations' &&
                  recommendations.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                      {recommendations.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top 6 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm">
              <div className="flex items-center justify-between text-[#71667D]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Avg Utilization</span>
                <Gauge className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-heading font-black text-2xl text-[#332B40] mt-1.5">
                {overallKPIs.avgUtilization}%
              </p>
              <p className="text-[10px] text-[#71667D] mt-0.5">Across active laboratories</p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm">
              <div className="flex items-center justify-between text-[#71667D]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Resources</span>
                <Cpu className="w-4 h-4 text-[#8961D8]" />
              </div>
              <p className="font-heading font-black text-2xl text-[#332B40] mt-1.5">
                {overallKPIs.totalResources}
              </p>
              <p className="text-[10px] text-[#71667D] mt-0.5">Registered instrument assets</p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm">
              <div className="flex items-center justify-between text-[#71667D]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Underutilized</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="font-heading font-black text-2xl text-amber-600 mt-1.5">
                {overallKPIs.underutilizedCount}
              </p>
              <p className="text-[10px] text-[#71667D] mt-0.5">Operating below {modThreshold}%</p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm">
              <div className="flex items-center justify-between text-[#71667D]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Cohort Shortage</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="font-heading font-black text-2xl text-rose-600 mt-1.5">
                {overallKPIs.totalShortages}
              </p>
              <p className="text-[10px] text-[#71667D] mt-0.5">Deficit equipment units</p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm">
              <div className="flex items-center justify-between text-[#71667D]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Downtime</span>
                <Wrench className="w-4 h-4 text-purple-600" />
              </div>
              <p className="font-heading font-black text-2xl text-[#332B40] mt-1.5">
                {overallKPIs.totalDowntimeHours} <span className="text-xs font-semibold">hrs</span>
              </p>
              <p className="text-[10px] text-[#71667D] mt-0.5">Repair & maintenance log</p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm">
              <div className="flex items-center justify-between text-[#71667D]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Capacity Load</span>
                <Users className="w-4 h-4 text-cyan-600" />
              </div>
              <p className="font-heading font-black text-2xl text-[#332B40] mt-1.5">
                {overallKPIs.avgCapacityPct}%
              </p>
              <p className="text-[10px] text-[#71667D] mt-0.5">Average lab occupancy</p>
            </div>
          </div>

          {/* Analytical Calculation Definition Callout */}
          <div className="p-4 bg-white border border-[#E9DDF1] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-purple-50 text-[#8961D8]">
                <Info className="w-5 h-5 shrink-0" />
              </span>
              <div>
                <p className="font-bold text-[#332B40]">
                  Deterministic Equipment Utilization Formulation
                </p>
                <p className="text-[#71667D] font-mono text-[11px] mt-0.5">
                  Utilization (%) = (Actual Usage Hours / Available Academic Operating Hours [208 hrs]) × 100
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-[#FAF5FF] border border-[#E9DDF1] text-[#8961D8] font-bold text-[11px]">
                High Threshold: ≥{highThreshold}%
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FFF8F2] border border-[#E9DDF1] text-amber-700 font-bold text-[11px]">
                Moderate: ≥{modThreshold}%
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Equipment Utilization Breakdown (Donut) */}
            <div className="lg:col-span-5 bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#332B40]">
                    Equipment Categorization Distribution
                  </h3>
                  <p className="text-xs text-[#71667D]">
                    Proportion of assets across utilization tiers
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('utilization')}
                  className="text-xs font-bold text-[#8961D8] hover:underline flex items-center space-x-1"
                >
                  <span>Adjust Sliders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={utilizationDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {utilizationDistribution.map((entry, index) => (
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
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Utilization Comparison Bar Chart */}
            <div className="lg:col-span-7 bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#332B40]">
                    Departmental Utilization vs Shortages
                  </h3>
                  <p className="text-xs text-[#71667D]">
                    Operational equipment units vs calculated student cohort deficit
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('departments')}
                  className="text-xs font-bold text-[#8961D8] hover:underline flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBF5" />
                    <XAxis
                      dataKey="code"
                      tick={{ fill: '#71667D', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#E9DDF1' }}
                    />
                    <YAxis
                      tick={{ fill: '#71667D', fontSize: 11 }}
                      axisLine={{ stroke: '#E9DDF1' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        borderColor: '#E9DDF1',
                        fontSize: '12px'
                      }}
                    />
                    <Bar
                      dataKey="operationalEquipment"
                      name="Operational Equipment"
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
          </div>

          {/* Quick Shortages & Pending Recommendations summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shortages Alert Card */}
            <div className="bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#332B40]">
                    Verified Laboratory Shortages ({shortages.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('shortages')}
                  className="text-xs font-bold text-[#8961D8] hover:underline"
                >
                  Inspect All
                </button>
              </div>

              {shortages.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#71667D]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  All practical batches possess sufficient operational apparatus.
                </div>
              ) : (
                <div className="space-y-2">
                  {shortages.slice(0, 3).map(st => (
                    <div
                      key={st.id}
                      className="p-3 rounded-2xl bg-[#FFF8F2] border border-amber-200 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5 font-bold text-[#332B40]">
                          <span>{st.laboratoryName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                            Deficit: {st.shortageQuantity} units
                          </span>
                        </div>
                        <p className="text-[11px] text-[#71667D] mt-0.5">{st.supportingData}</p>
                      </div>
                      <span className="shrink-0 px-2 py-1 rounded-xl bg-white border border-[#E9DDF1] font-bold text-[10px] text-[#8961D8]">
                        {st.departmentName.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations Action Card */}
            <div className="bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-xl bg-purple-50 text-[#8961D8]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#332B40]">
                    Pending Optimization Proposals ({recommendations.filter(r => r.status === 'PENDING').length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="text-xs font-bold text-[#8961D8] hover:underline"
                >
                  Review Engine
                </button>
              </div>

              <div className="space-y-2">
                {recommendations
                  .filter(r => r.status === 'PENDING')
                  .slice(0, 3)
                  .map(rec => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#332B40] truncate max-w-sm">{rec.title}</p>
                        <p className="text-[11px] text-[#71667D] line-clamp-1">{rec.reason}</p>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isAdmin && (
                          <button
                            onClick={() => handleApproveRecommendation(rec.id)}
                            className="px-2.5 py-1 rounded-xl bg-[#8961D8] text-white text-[11px] font-bold hover:bg-[#724cb8]"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTab('recommendations')}
                          className="p-1 rounded-lg text-[#71667D] hover:text-[#332B40]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EQUIPMENT UTILIZATION ANALYSIS */}
      {/* ============================================================== */}
      {activeTab === 'utilization' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Configurable Threshold Bar */}
          <div className="p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-base text-[#332B40] flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#8961D8]" />
                  <span>Configurable Utilization Threshold Parameters</span>
                </h3>
                <p className="text-xs text-[#71667D]">
                  Dynamically adjust institutional benchmarks to reclassify assets across tiers
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-[#332B40]">
                    <span>High Utilization Threshold:</span>
                    <span className="text-emerald-600 ml-2">{highThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={90}
                    value={highThreshold}
                    onChange={e => setHighThreshold(Number(e.target.value))}
                    className="w-44 accent-[#8961D8] cursor-pointer"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-[#332B40]">
                    <span>Moderate Threshold:</span>
                    <span className="text-blue-600 ml-2">{modThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={50}
                    value={modThreshold}
                    onChange={e => setModThreshold(Number(e.target.value))}
                    className="w-44 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E9DDF1]">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#71667D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search equipment, tag, lab..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] text-xs font-semibold focus:outline-none focus:border-[#8961D8]"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="px-3 py-2 rounded-2xl bg-white border border-[#E9DDF1] text-xs font-bold text-[#332B40] focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="dept-cse">Computer Science</option>
                  <option value="dept-ise">Information Science</option>
                  <option value="dept-aiml">AI & ML</option>
                  <option value="dept-ece">Electronics & Comm</option>
                  <option value="dept-chem">Chemistry</option>
                  <option value="dept-mech">Mechanical</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-2xl bg-white border border-[#E9DDF1] text-xs font-bold text-[#332B40] focus:outline-none"
                >
                  <option value="ALL">All Status Tiers</option>
                  <option value="HIGH">Highly Utilized (≥{highThreshold}%)</option>
                  <option value="MODERATE">Moderately Utilized</option>
                  <option value="UNDERUTILIZED">Underutilized (&lt;{modThreshold}%)</option>
                  <option value="UNUSED">Unused (0 hrs)</option>
                  <option value="UNAVAILABLE">Unavailable / Faulty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detailed Utilization Data Table */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5FF] border-b border-[#E9DDF1] text-[#71667D] uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Equipment & Tag</th>
                    <th className="py-3 px-4">Laboratory / Dept</th>
                    <th className="py-3 px-4 text-center">Actual Usage</th>
                    <th className="py-3 px-4 text-center">Operating Cap</th>
                    <th className="py-3 px-4 text-center">Utilization (%)</th>
                    <th className="py-3 px-4 text-center">Downtime</th>
                    <th className="py-3 px-4 text-center">Tier Category</th>
                    <th className="py-3 px-4 text-right">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DDF1]">
                  {filteredMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#71667D]">
                        No matching equipment utilization records found.
                      </td>
                    </tr>
                  ) : (
                    filteredMetrics.map(m => {
                      const tierBadges: Record<string, { bg: string; text: string; label: string }> = {
                        HIGH: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Highly Utilized' },
                        MODERATE: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Moderate' },
                        UNDERUTILIZED: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Underutilized' },
                        UNUSED: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Unused' },
                        UNAVAILABLE: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Unavailable' }
                      };
                      const badge = tierBadges[m.utilizationCategory] || tierBadges.MODERATE;

                      return (
                        <tr key={m.equipmentId} className="hover:bg-[#FFF8F2]/50 transition">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#332B40]">{m.equipmentName}</p>
                            <span className="font-mono text-[10px] text-[#71667D]">{m.assetTag}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#332B40]">{m.laboratoryName}</p>
                            <p className="text-[10px] text-[#71667D]">{m.departmentName}</p>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-[#332B40]">
                            {m.totalUsageHours} <span className="text-[10px] font-normal text-[#71667D]">hrs</span>
                          </td>
                          <td className="py-3 px-4 text-center text-[#71667D] font-mono">
                            {m.operatingDurationHours} hrs
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <span className="font-black text-sm text-[#332B40]">
                                {m.utilizationPercentage}%
                              </span>
                              <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    m.utilizationPercentage >= highThreshold
                                      ? 'bg-emerald-500'
                                      : m.utilizationPercentage >= modThreshold
                                      ? 'bg-blue-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, m.utilizationPercentage)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {m.downtimeHours > 0 ? (
                              <span className="text-rose-600 font-bold">{m.downtimeHours} hrs</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">0 hrs</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[#71667D] font-mono text-[11px]">
                            {m.lastUsedDate}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SHORTAGES & COHORT DEFICITS */}
      {/* ============================================================== */}
      {activeTab === 'shortages' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-white border border-[#E9DDF1] rounded-3xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </span>
              <div>
                <p className="font-bold text-[#332B40]">
                  Cohort Batch Deficit Detection Model
                </p>
                <p className="text-[#71667D] mt-0.5">
                  Calculated by contrasting scheduled student strength per practical slot with confirmed working equipment & workstations.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs">
              {shortages.length} Deficits Detected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortages.map(st => (
              <div
                key={st.id}
                className="p-5 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm space-y-4 hover:border-rose-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                      {st.severity} DEFICIT
                    </span>
                    <h3 className="font-heading font-bold text-base text-[#332B40] mt-1.5">
                      {st.laboratoryName}
                    </h3>
                    <p className="text-xs text-[#71667D]">{st.equipmentCategory}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-heading font-black text-2xl text-rose-600">
                      -{st.shortageQuantity}
                    </span>
                    <p className="text-[10px] font-bold text-[#71667D] uppercase">Shortage Units</p>
                  </div>
                </div>

                {/* Quantitative Comparison Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1]">
                    <span className="text-[10px] text-[#71667D] font-bold uppercase">Required Strength</span>
                    <p className="font-black text-sm text-[#332B40] mt-0.5">
                      {st.requiredQuantity} Students / Workstations
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1]">
                    <span className="text-[10px] text-[#71667D] font-bold uppercase">Available Operational</span>
                    <p className="font-black text-sm text-emerald-600 mt-0.5">
                      {st.availableOperationalQuantity} Units Active
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5">
                  <p className="text-[#332B40] font-semibold">{st.supportingData}</p>
                  <p className="text-[#71667D] text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-[#332B40]">Suggested Action: </span>
                    {st.suggestedAction}
                  </p>
                </div>

                {isAdmin && (
                  <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#E9DDF1]">
                    <button
                      onClick={() => navigate('/equipment')}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E9DDF1] text-xs font-bold text-[#332B40] hover:bg-[#FFF8F2]"
                    >
                      Inspect Inventory
                    </button>
                    <button
                      onClick={() => navigate('/procurement')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#8961D8] text-white text-xs font-bold hover:bg-[#724cb8]"
                    >
                      Create Requisition
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Underutilized Assets Ready for Inter-Lab Reallocation */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[#332B40]">
                Underutilized Resources Available for Reallocation
              </h3>
              <p className="text-xs text-[#71667D]">
                These verified operational units have low semester usage and can be transferred to deficit laboratories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {utilizationMetrics
                .filter(m => m.utilizationCategory === 'UNDERUTILIZED' || m.utilizationCategory === 'UNUSED')
                .slice(0, 6)
                .map(item => (
                  <div
                    key={item.equipmentId}
                    className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#332B40] truncate">{item.equipmentName}</span>
                      <span className="font-mono text-[10px] text-[#8961D8] bg-white px-2 py-0.5 rounded-full border border-[#E9DDF1]">
                        {item.utilizationPercentage}% Util
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71667D]">{item.laboratoryName}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#E9DDF1] text-[10px]">
                      <span className="text-slate-500">Usage: {item.totalUsageHours} hrs</span>
                      <span className="font-bold text-emerald-700">Ready for Transfer</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: DEPARTMENT COMPARISONS */}
      {/* ============================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Comparison Bar Chart */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[#332B40]">
                Cross-Department Resource & Maintenance Expenditure Comparison
              </h3>
              <p className="text-xs text-[#71667D]">
                Comparative metrics of operational assets, lab counts, and maintenance expenditure in INR (₹)
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBF5" />
                  <XAxis
                    dataKey="name"
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="operationalEquipment"
                    name="Operational Equipment"
                    fill="#8961D8"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="totalLaboratories"
                    name="Total Laboratories"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="resourceUtilizationPct"
                    name="Utilization (%)"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Comparative Table */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5FF] border-b border-[#E9DDF1] text-[#71667D] uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Laboratories</th>
                    <th className="py-3 px-4 text-center">Total Equipment</th>
                    <th className="py-3 px-4 text-center">Operational</th>
                    <th className="py-3 px-4 text-center">Maintenance Due</th>
                    <th className="py-3 px-4 text-center">Avg Utilization</th>
                    <th className="py-3 px-4 text-right">Maintenance Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DDF1]">
                  {departments.map(dept => (
                    <tr key={dept.departmentId} className="hover:bg-[#FFF8F2]/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-[#332B40]">{dept.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#71667D]">
                            {dept.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#332B40]">
                        {dept.totalLaboratories}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-[#332B40]">
                        {dept.totalEquipment}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        {dept.operationalEquipment}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(dept.maintenanceRequired || 0) > 0 ? (
                          <span className="text-amber-600 font-bold">{dept.maintenanceRequired}</span>
                        ) : (
                          <span className="text-[#71667D]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-[#8961D8]">
                          {dept.resourceUtilizationPct || dept.resourceUtilizationRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#332B40]">
                        ₹{(dept.estimatedMaintenanceCost ?? dept.totalMaintenanceExpenditure ?? 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: LABORATORY CAPACITY ANALYSIS */}
      {/* ============================================================== */}
      {activeTab === 'capacity' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-white border border-[#E9DDF1] rounded-3xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <Users className="w-5 h-5 shrink-0" />
              </span>
              <div>
                <p className="font-bold text-[#332B40]">
                  Practical Laboratory Seating & Occupancy Metrics
                </p>
                <p className="text-[#71667D] mt-0.5">
                  Distinguishing registered safety seating ceilings, scheduled practical batch counts, and verified RFID/QR check-in rates.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FAF5FF] border border-[#E9DDF1] text-[#8961D8] font-bold text-xs">
              {capacityMetrics.length} Active Laboratories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capacityMetrics.map(cap => (
              <div
                key={cap.laboratoryId}
                className="p-5 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm space-y-4 hover:border-[#8961D8] transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#8961D8] font-bold bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-[#E9DDF1]">
                      {cap.code}
                    </span>
                    <h3 className="font-heading font-bold text-base text-[#332B40] mt-1.5">
                      {cap.laboratoryName}
                    </h3>
                    <p className="text-xs text-[#71667D]">
                      {cap.building} • Rm {cap.roomNumber}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      cap.capacityUtilizationPct > 85
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {cap.capacityUtilizationPct}% Cap Load
                  </span>
                </div>

                {/* Quantitative Capacity Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-[#71667D] font-bold uppercase">Ceiling</span>
                    <p className="font-black text-sm text-[#332B40] mt-0.5">
                      {cap.registeredCapacity}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FFF8F2] border border-[#E9DDF1]">
                    <span className="text-[10px] text-[#71667D] font-bold uppercase">Scheduled</span>
                    <p className="font-black text-sm text-blue-600 mt-0.5">
                      {cap.scheduledStudentCount}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF5FF] border border-[#E9DDF1]">
                    <span className="text-[10px] text-[#71667D] font-bold uppercase">Checked-In</span>
                    <p className="font-black text-sm text-emerald-600 mt-0.5">
                      {cap.checkedInStudentCount}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#71667D]">
                    <span>Remaining Safe Capacity:</span>
                    <span className="font-bold text-[#332B40]">{cap.remainingCapacity} seats</span>
                  </div>
                  <div className="flex justify-between text-[#71667D]">
                    <span>Peak Slot:</span>
                    <span className="font-mono text-[11px] font-semibold text-[#8961D8]">
                      {cap.peakPeriod}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#71667D]">
                    <span>Trend Trajectory:</span>
                    <span className="font-bold text-[#332B40]">{cap.occupancyTrend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: RULE-BASED RECOMMENDATIONS ENGINE */}
      {/* ============================================================== */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-white border border-[#E9DDF1] rounded-3xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-purple-50 text-[#8961D8]">
                <Sparkles className="w-5 h-5 shrink-0" />
              </span>
              <div>
                <p className="font-bold text-[#332B40]">
                  Predefined Deterministic Optimization Engine
                </p>
                <p className="text-[#71667D] mt-0.5">
                  Formulates 5 distinct actionable strategies (Reallocation, Overhaul, Capital Procurement, Stock Replenishment, and Capacity Balancing) without probabilistic external APIs.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FAF5FF] border border-[#E9DDF1] text-[#8961D8] font-bold text-xs">
              {recommendations.length} Formulated Rules
            </span>
          </div>

          <div className="space-y-4">
            {recommendations.map(rec => {
              const typeIcons: Record<string, { icon: any; color: string; label: string }> = {
                TRANSFER: { icon: ArrowRightLeft, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Inter-Lab Asset Reallocation' },
                MAINTENANCE: { icon: Wrench, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Preventive Overhaul' },
                PROCUREMENT: { icon: ShoppingCart, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Capital Requisition' },
                STOCK_REPLENISHMENT: { icon: RefreshCw, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Consumable Auto-Replenish' },
                CAPACITY_REVIEW: { icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Cohort Load Re-balancing' }
              };
              const config = typeIcons[rec.type] || typeIcons.TRANSFER;
              const Icon = config.icon;

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-3xl bg-white border border-[#E9DDF1] shadow-sm space-y-4 hover:border-[#8961D8] transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <span className={`p-2 rounded-2xl border ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#71667D]">
                            {config.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'DISMISSED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                        <h3 className="font-heading font-black text-base text-[#332B40]">
                          {rec.title}
                        </h3>
                        <p className="text-xs text-[#71667D]">{rec.reason}</p>
                      </div>
                    </div>

                    {/* Action Buttons for Administrator */}
                    {isAdmin && rec.status === 'PENDING' && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleDismissRecommendation(rec.id)}
                          className="px-3.5 py-1.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleApproveRecommendation(rec.id)}
                          className="px-4 py-1.5 rounded-2xl bg-[#8961D8] text-white text-xs font-bold hover:bg-[#724cb8] shadow-sm transition"
                        >
                          Approve Proposal
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Supporting Analysis Box */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1] space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[#332B40]">Supporting Empirical Data: </span>
                      <span className="text-[#71667D]">{rec.supportingData}</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">Expected Operational Benefit: </span>
                      <span className="text-[#71667D]">{rec.expectedOperationalBenefit}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#8961D8]">Suggested Implementation: </span>
                      <span className="text-[#71667D]">{rec.suggestedAction}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#71667D] pt-1">
                    <span>Target: {rec.affectedLaboratory}</span>
                    <span>Generated: {rec.createdAt.split('T')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: PROCUREMENT INTELLIGENCE (Admin Only) */}
      {/* ============================================================== */}
      {activeTab === 'procurement' && isAdmin && (
        <div className="space-y-6 animate-in fade-in">
          {/* Repair vs Replace Cost Analyzer */}
          <div className="p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[#332B40] flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-[#8961D8]" />
                <span>Maintenance vs Replacement Capital Decision Matrix</span>
              </h3>
              <p className="text-xs text-[#71667D]">
                Evaluates cumulative repair expenditures against estimated new replacement costs in INR (₹)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71667D]">
                  SMPS & Power Systems (CSE / ISE)
                </span>
                <p className="font-bold text-sm text-[#332B40]">Repair vs Replace Ratio: 28%</p>
                <p className="text-[#71667D] text-[11px]">
                  Cumulative repair: ₹4,200 vs New SMPS: ₹1,500. Decision: Replace degraded units to eliminate recurring labor calls.
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  Recommended: Replace
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1] space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71667D]">
                  Digital Storage Oscilloscopes (ECE)
                </span>
                <p className="font-bold text-sm text-[#332B40]">Repair vs Replace Ratio: 14%</p>
                <p className="text-[#71667D] text-[11px]">
                  NABL calibration & probe repair: ₹6,500 vs New DSO: ₹45,000. Decision: Authorize certified calibration.
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Recommended: Calibrate
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71667D]">
                  UV-Vis Spectrophotometer (CHEM)
                </span>
                <p className="font-bold text-sm text-[#332B40]">Repair vs Replace Ratio: 18%</p>
                <p className="text-[#71667D] text-[11px]">
                  Tungsten lamp replacement: ₹12,000 vs New Instrument: ₹65,000. Decision: Requisition optical lamp.
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Recommended: Component Repair
                </span>
              </div>
            </div>
          </div>

          {/* Active Purchase Requisitions Table */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E9DDF1] flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-[#332B40]">
                Pending Capital Requisitions ({purchaseRequests.length})
              </h3>
              <button
                onClick={() => navigate('/procurement')}
                className="text-xs font-bold text-[#8961D8] hover:underline"
              >
                Open Procurement Portal
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5FF] border-b border-[#E9DDF1] text-[#71667D] uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Title & Item</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Estimated Cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DDF1]">
                  {purchaseRequests.map(pr => (
                    <tr key={pr.id} className="hover:bg-[#FFF8F2]/50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#332B40]">{pr.title}</p>
                        <p className="text-[10px] text-[#71667D]">{pr.items[0]?.category || 'Capital Equipment'}</p>
                      </td>
                      <td className="py-3 px-4 text-[#332B40]">{pr.requestedByName}</td>
                      <td className="py-3 px-4 text-[#71667D]">{pr.items[0]?.supplier || 'OEM Certified'}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#332B40]">
                        {pr.items.reduce((sum, i) => sum + i.quantity, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#332B40]">
                        ₹{pr.totalEstimatedCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 8: HISTORICAL TRENDS */}
      {/* ============================================================== */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Timeframe & Metric Selector */}
          <div className="p-4 bg-white border border-[#E9DDF1] rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#71667D]">Trend Variable:</span>
              {(['utilization', 'downtime', 'expenditure'] as const).map(met => (
                <button
                  key={met}
                  onClick={() => setTrendMetric(met)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition capitalize ${
                    trendMetric === met
                      ? 'bg-[#8961D8] text-white shadow-sm'
                      : 'bg-[#FAF5FF] text-[#71667D] hover:bg-[#F0E9FF]'
                  }`}
                >
                  {met === 'expenditure' ? 'Expenditure (₹)' : met}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5">
              {(['7D', '30D', '3M', '6M', '1Y'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
                    trendPeriod === period
                      ? 'bg-[#332B40] text-white shadow-sm'
                      : 'bg-white border border-[#E9DDF1] text-[#71667D] hover:bg-[#FFF8F2]'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart Visualization */}
          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-[#332B40] capitalize">
                {trendMetric} Longitudinal Trajectory ({trendPeriod})
              </h3>
              <p className="text-xs text-[#71667D]">
                Visualizing recorded historical variations across academic terms
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <YAxis
                    tick={{ fill: '#71667D', fontSize: 11 }}
                    axisLine={{ stroke: '#E9DDF1' }}
                    tickFormatter={val =>
                      trendMetric === 'expenditure' ? `₹${(val / 1000).toFixed(0)}k` : `${val}`
                    }
                  />
                  <Tooltip
                    formatter={(val: any) => [
                      trendMetric === 'expenditure' ? `₹${Number(val).toLocaleString('en-IN')}` : `${val}`,
                      trendMetric.toUpperCase()
                    ]}
                    contentStyle={{
                      borderRadius: '16px',
                      borderColor: '#E9DDF1',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={trendMetric}
                    stroke="#8961D8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#trendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
