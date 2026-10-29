import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  History,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { AuditLogEntry } from '../types';

export const ReportsPage: React.FC = () => {
  const { activeLab, currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await DataService.getAuditLogs(activeLab?.id);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [activeLab]);

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || l.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Action', 'Category', 'User', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ILMS_Audit_Report_${activeLab?.code || 'All'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <span>Institutional Compliance Reports & Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Tamper-evident ledger of operations and authorizations
          </p>
        </div>

        <div className="flex items-center space-x-2 no-print">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center gap-3 no-print">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action code, user, or operation details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="AUTH">Authentication & Users</option>
            <option value="INVENTORY">Inventory & Stock</option>
            <option value="BOOKING">Equipment Bookings</option>
            <option value="MAINTENANCE">Maintenance & Calibration</option>
            <option value="PROCUREMENT">Procurement & Orders</option>
            <option value="ADMIN">Administrative</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Action Code</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Authorized User</th>
                <th className="py-3 px-4">Operation Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-sans">
                    No audit records matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-sky-400 font-bold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
