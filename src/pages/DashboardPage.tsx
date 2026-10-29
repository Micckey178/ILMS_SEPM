import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Cpu,
  CalendarCheck,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Sparkles,
  QrCode
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
import { DataService } from '../services/dataService';
import { AuditLogEntry, UniversalInventoryItem } from '../types';

interface DashboardPageProps {
  onOpenQRScanner: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenQRScanner }) => {
  const { activeLab, currentUser } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogEntry[]>([]);
  const [lowStockItems, setLowStockItems] = useState<UniversalInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getDashboardMetrics(activeLab?.id);
      const audits = await DataService.getAuditLogs(activeLab?.id);
      const inv = await DataService.getInventory(activeLab?.id);

      setMetrics(data);
      setRecentAudits(audits.slice(0, 5));
      setLowStockItems(inv.filter(i => i.isLowStock || i.quantity <= i.minStock));
    } catch (err) {
      console.error('Dashboard data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLab]);

  const COLORS = ['#0284c7', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-sky-400">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Aggregating laboratory metrics from Firestore...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Welcome Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-sky-950/40 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] uppercase font-bold tracking-wider border border-sky-500/30">
              {activeLab ? activeLab.code : 'ORGANIZATION WIDE'}
            </span>
            <span className="text-xs text-slate-400">
              {activeLab ? `${activeLab.building} • Room ${activeLab.roomNumber}` : 'Consolidated Campus View'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white mt-1">
            {activeLab ? activeLab.name : 'Multi-Laboratory Command Center'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry, stock levels, equipment bookings, and safety audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenQRScanner}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-sky-600/30 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Asset Label</span>
          </button>
        </div>
      </div>

      {/* Critical Low Stock Alert Banner (if any) */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-100">Low Stock Notification:</span>{' '}
              {lowStockItems.map(i => `${i.name} (${i.quantity} ${i.unit} left)`).join('; ')}.
              <p className="text-amber-300/80 mt-0.5">Reorder requests should be placed to prevent experiment interruptions.</p>
            </div>
          </div>
          <a
            href="/inventory"
            className="shrink-0 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold transition"
          >
            View Inventory
          </a>
        </div>
      )}

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Inventory Items */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inventory Items</span>
            <Boxes className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalInventoryItems}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>Est. Val: <strong className="text-slate-200">${metrics.totalInventoryValue.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Equipment Assets */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Equipment</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalEquipment}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-medium">{metrics.availableEquipment} Available</span>
            {metrics.blockedEquipment > 0 && (
              <span className="text-rose-400 font-medium">{metrics.blockedEquipment} Blocked</span>
            )}
          </div>
        </div>

        {/* Active Bookings */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Reservations</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.activeBookings}</div>
          <div className="text-[11px] text-slate-400">
            {metrics.overdueLoans > 0 ? (
              <span className="text-rose-400 font-medium">{metrics.overdueLoans} Overdue Returns</span>
            ) : (
              <span className="text-slate-400">No overdue loans</span>
            )}
          </div>
        </div>

        {/* Safety & Governance */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Open Incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.openIncidents}</div>
          <div className="text-[11px] text-slate-400">
            <span>Pending Purchases: <strong className="text-slate-200">{metrics.pendingPurchases}</strong></span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Category Breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Inventory Distribution by Category</h3>
              <p className="text-xs text-slate-400">Item counts across laboratory classifications</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.categoryChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Operational Status */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Equipment Operational Status</h3>
              <p className="text-xs text-slate-400">Availability, reservations, and maintenance locks</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentStatusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {metrics.equipmentStatusChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audit History Ledger */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-sm text-slate-100">Live Multi-Lab Audit Ledger</h3>
            <p className="text-xs text-slate-400">Chronological history of immutable transactions and operations</p>
          </div>
          <a
            href="/reports"
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <span>Full Audit Trail</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentAudits.map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sky-400">{log.action}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                    {log.category}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">{log.details}</p>
                <span className="text-[10px] text-slate-500">
                  By {log.userName} • {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
