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
  Users
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  EquipmentUtilizationMetric,
  ResourceShortage,
  ResourceRecommendation
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
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isFaculty = currentUser.role === 'faculty';

  const loadData = async () => {
    try {
      const [u, s, r] = await Promise.all([
        DataService.getEquipmentUtilizationMetrics(70, 35),
        DataService.getResourceShortages(),
        DataService.getResourceRecommendations()
      ]);

      // If faculty, scope to their assigned department
      if (isFaculty && currentUser.departmentId) {
        setMetrics(u.filter(m => m.departmentId === currentUser.departmentId));
        setShortages(s.filter(st => st.departmentId === currentUser.departmentId));
        setRecommendations(r.filter(rec => rec.affectedDepartment.includes('Computer') || rec.affectedDepartment.includes(currentUser.departmentId || '')));
      } else {
        setMetrics(u);
        setShortages(s);
        setRecommendations(r);
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
    { name: 'Highly Utilized (≥70%)', value: metrics.filter(m => m.utilizationCategory === 'HIGH').length, color: '#10B981' },
    { name: 'Moderate (35-69%)', value: metrics.filter(m => m.utilizationCategory === 'MODERATE').length, color: '#3B82F6' },
    { name: 'Underutilized (<35%)', value: underutilizedCount, color: '#F59E0B' },
    { name: 'Unavailable / In Repair', value: metrics.filter(m => m.utilizationCategory === 'UNAVAILABLE').length, color: '#EF4444' }
  ].filter(d => d.value > 0);

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
      className={`bg-white border border-[#E9DDF1] hover:border-[#8961D8]/60 rounded-3xl p-6 shadow-sm transition space-y-5 ${className}`}
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8961D8] to-[#BCA0F5] text-white shadow-md shadow-[#8961D8]/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading font-black text-lg text-[#332B40]">
                Institutional Resource Intelligence
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] border border-[#E9DDF1] text-[#8961D8] text-[10px] font-black uppercase tracking-wider">
                VTU Live
              </span>
            </div>
            <p className="text-xs text-[#71667D]">
              Real-time equipment utilization analytics, cohort deficit detection, and rule-based optimization.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/resource-intelligence')}
          className="px-4 py-2 rounded-2xl bg-[#FFF8F2] hover:bg-[#FAF5FF] border border-[#E9DDF1] text-xs font-bold text-[#8961D8] flex items-center space-x-1.5 shadow-sm transition shrink-0 group"
        >
          <span>Open Full Intelligence Portal</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4 Interactive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => navigate('/resource-intelligence')}
          className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9DDF1] cursor-pointer hover:border-[#8961D8] transition"
        >
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

        <div
          onClick={() => navigate('/resource-intelligence')}
          className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] cursor-pointer hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Underutilized Assets</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="font-heading font-black text-2xl text-amber-600 mt-1">
            {underutilizedCount}
          </p>
          <p className="text-[10px] text-[#71667D] mt-1.5">Below 35% utilization threshold</p>
        </div>

        <div
          onClick={() => navigate('/resource-intelligence')}
          className="p-4 rounded-2xl bg-white border border-[#E9DDF1] cursor-pointer hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Cohort Deficit</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="font-heading font-black text-2xl text-rose-600 mt-1">
            {totalDeficitUnits > 0 ? `-${totalDeficitUnits}` : '0'}
          </p>
          <p className="text-[10px] text-[#71667D] mt-1.5">
            {shortages.length > 0 ? `${shortages.length} laboratories affected` : 'Sufficient apparatus'}
          </p>
        </div>

        <div
          onClick={() => navigate('/resource-intelligence')}
          className="p-4 rounded-2xl bg-white border border-[#E9DDF1] cursor-pointer hover:border-[#8961D8] transition"
        >
          <div className="flex items-center justify-between text-[#71667D] text-[10px] font-bold uppercase tracking-wider">
            <span>Pending Proposals</span>
            <Sparkles className="w-3.5 h-3.5 text-[#8961D8]" />
          </div>
          <p className="font-heading font-black text-2xl text-[#8961D8] mt-1">
            {pendingRecommendations.length}
          </p>
          <p className="text-[10px] text-[#71667D] mt-1.5">Awaiting administrative approval</p>
        </div>
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
            onClick={() => navigate('/resource-intelligence')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-sm transition"
          >
            Review Shortage
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
                Benefit: {pendingRecommendations[0].expectedOperationalBenefit}
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
