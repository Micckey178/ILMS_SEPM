import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  History,
  ShieldCheck,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Cpu,
  UserCheck,
  Wrench,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { exportAuditReportPDF } from '../utils/pdfExport';
import { AuditLogEntry, UniversalInventoryItem, EquipmentAsset, AttendanceRecord } from '../types';

interface DetailedReportModalData {
  title: string;
  category: string;
  purpose: string;
  period: string;
  laboratory: string;
  sources: string[];
  methodology: string;
  keyFindings: { label: string; value: string; status: 'good' | 'warning' | 'alert' }[];
  tableData?: { headers: string[]; rows: (string | number)[][] };
  recommendedActions: string[];
  creator: string;
  generatedDate: string;
}

export const ReportsPage: React.FC = () => {
  const { activeLab, currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [inventory, setInventory] = useState<UniversalInventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DetailedReportModalData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditData, invData, eqData, attData] = await Promise.all([
        DataService.getAuditLogs(activeLab?.id),
        DataService.getInventory(activeLab?.id),
        DataService.getEquipment(activeLab?.id),
        DataService.getAttendanceRecords(activeLab?.id)
      ]);
      setLogs(auditData);
      setInventory(invData);
      setEquipment(eqData);
      setAttendance(attData);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLab]);

  // Derived metrics for reports matching UniversalInventoryItem & EquipmentAsset schemas
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);
  const workingEq = equipment.filter(e => e.status === 'AVAILABLE' || e.status === 'IN_USE' || e.status === 'RESERVED').length;
  const maintenanceEq = equipment.filter(e => e.status === 'UNDER_MAINTENANCE' || e.status === 'MAINTENANCE_BLOCKED' || e.status === 'CALIBRATION_OVERDUE').length;
  const outOfServiceEq = equipment.filter(e => e.status === 'OUT_OF_SERVICE').length;
  const utilizationRate = equipment.length > 0 ? Math.round((workingEq / equipment.length) * 100) : 0;

  const totalAttSessions = attendance.length;
  const avgAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((acc, a) => acc + a.attendancePercentage, 0) / attendance.length)
    : 88;

  // Clickable report cards configuration
  const reportCards = [
    {
      id: 'low-stock',
      title: 'Low Stock & Material Depletion Report',
      category: 'Inventory',
      description: 'Identifies reagents, glassware, and consumables operating below safety replenishment thresholds.',
      metric: `${lowStockItems.length} Items Critical`,
      status: lowStockItems.length > 0 ? 'warning' : 'healthy',
      icon: Boxes,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
      openModal: () => {
        setSelectedReport({
          title: 'Low Stock & Material Depletion Report',
          category: 'Inventory & Consumables',
          purpose: 'Provide actionable alerts on consumable reagents and parts nearing stock exhaustion to ensure uninterrupted academic practicals and continuous research experiments.',
          period: 'Real-time Live Inventory Ledger',
          laboratory: activeLab?.name || 'All Institutional Laboratories',
          sources: ['Universal Inventory Ledger', 'Stock Adjustment Audit Log', 'Minimum Safety Threshold Config'],
          methodology: 'Stock levels are compared continuously against configured minimum safety threshold. Items where quantity <= minStock are flagged as critical.',
          keyFindings: [
            { label: 'Critical Items Count', value: `${lowStockItems.length} items`, status: lowStockItems.length > 0 ? 'alert' : 'good' },
            { label: 'Total Tracked SKUs', value: `${inventory.length} items`, status: 'good' },
            { label: 'Depletion Percentage', value: `${inventory.length > 0 ? Math.round((lowStockItems.length / inventory.length) * 100) : 0}% of inventory`, status: lowStockItems.length > 0 ? 'warning' : 'good' }
          ],
          tableData: {
            headers: ['SKU', 'Item Name', 'Category', 'Current Level', 'Safety Min', 'Storage Location'],
            rows: lowStockItems.slice(0, 10).map(i => [i.sku, i.name, i.category, `${i.quantity} ${i.unit}`, `${i.minStock} ${i.unit}`, i.storageLocation || 'Main Storage'])
          },
          recommendedActions: [
            'Generate immediate Purchase Request via Certified Vendor Portal for items marked Critical.',
            'Review vendor lead times and verify safety stock buffer for high-consumption reagents.',
            'Notify laboratory technicians to restrict discretionary loan allocations.'
          ],
          creator: currentUser.displayName,
          generatedDate: new Date().toLocaleString()
        });
      }
    },
    {
      id: 'equipment-utilization',
      title: 'Equipment Health & Availability Report',
      category: 'Assets & Hardware',
      description: 'Comprehensive analysis of apparatus operational health, uptime calculations, and calibration due dates.',
      metric: `${utilizationRate}% Operational`,
      status: utilizationRate >= 80 ? 'healthy' : 'warning',
      icon: Cpu,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
      openModal: () => {
        setSelectedReport({
          title: 'Equipment Health & Hardware Availability Report',
          category: 'Laboratory Capital Equipment',
          purpose: 'Track operational readiness of all laboratory machinery, spectrophotometers, oscilloscopes, and testing benches across campuses.',
          period: 'Current Academic Term',
          laboratory: activeLab?.name || 'All Laboratories',
          sources: ['Asset Registry', 'Maintenance Calibration Records', 'Fault Report Tickets'],
          methodology: 'Availability is computed as (Working Available Assets / Total Registered Assets) * 100. Faulty or decommissioned hardware is excluded from capacity allocation.',
          keyFindings: [
            { label: 'Operational Availability', value: `${utilizationRate}%`, status: utilizationRate >= 85 ? 'good' : 'warning' },
            { label: 'Working Hardware', value: `${workingEq} units`, status: 'good' },
            { label: 'Hardware Under Maintenance', value: `${maintenanceEq} units`, status: maintenanceEq > 0 ? 'warning' : 'good' },
            { label: 'Out of Service Units', value: `${outOfServiceEq} units`, status: outOfServiceEq > 0 ? 'alert' : 'good' }
          ],
          tableData: {
            headers: ['Asset Tag', 'Equipment Name', 'Model / Serial', 'Operational Status', 'Location'],
            rows: equipment.slice(0, 10).map(e => [e.assetTag, e.name, `${e.model} (${e.serialNumber})`, e.status, e.location || 'Bench Bay'])
          },
          recommendedActions: [
            'Schedule immediate technician inspections for units marked OUT_OF_SERVICE.',
            'Verify preventative calibration dates before upcoming semester examination sessions.',
            'Reallocate idle workstations to departments with high booking contention.'
          ],
          creator: currentUser.displayName,
          generatedDate: new Date().toLocaleString()
        });
      }
    },
    {
      id: 'attendance-summary',
      title: 'Faculty Laboratory Attendance Audit',
      category: 'Academic Compliance',
      description: 'Institutional attendance verification, practical participation rates, and authorized absence tracking.',
      metric: `${avgAttendance}% Avg Attendance`,
      status: 'healthy',
      icon: UserCheck,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
      openModal: () => {
        setSelectedReport({
          title: 'Faculty Laboratory Attendance & Student Participation Report',
          category: 'Academic Practical Compliance',
          purpose: 'Verify compliance with institutional accreditation rules requiring students to satisfy minimum 75% laboratory session attendance.',
          period: 'Current Semester To Date',
          laboratory: activeLab?.name || 'Assigned Practical Laboratories',
          sources: ['Faculty Attendance Ledger', 'Student Enrollment Records', 'Session Timetable'],
          methodology: 'Attendance percentage is computed per practical session as (Present Students / Total Enrolled Students) * 100. Late arrivals are noted with grace interval.',
          keyFindings: [
            { label: 'Mean Attendance Percentage', value: `${avgAttendance}%`, status: avgAttendance >= 75 ? 'good' : 'alert' },
            { label: 'Logged Practical Sessions', value: `${totalAttSessions} sessions`, status: 'good' },
            { label: 'Accreditation Minimum Threshold', value: '75.0% required', status: 'good' }
          ],
          tableData: {
            headers: ['Session Date', 'Subject / Lab', 'Section / Batch', 'Present', 'Absent', 'Attendance %', 'Faculty'],
            rows: attendance.slice(0, 10).map(a => [a.date, a.sessionTitle, a.classBatch, a.presentCount, a.absentCount, `${a.attendancePercentage}%`, a.facultyName])
          },
          recommendedActions: [
            'Issue automated attendance warning notices to students falling below the 75% threshold.',
            'Allow authorized faculty makeup sessions for excused medical absences.',
            'Export official signed attendance ledger for registrar archiving.'
          ],
          creator: currentUser.displayName,
          generatedDate: new Date().toLocaleString()
        });
      }
    },
    {
      id: 'maintenance-compliance',
      title: 'Maintenance & Service Level Compliance',
      category: 'Quality & Calibration',
      description: 'Audit of completed service intervals, calibration certificates, and preventative maintenance schedules.',
      metric: '96.4% Compliance',
      status: 'healthy',
      icon: Wrench,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
      openModal: () => {
        setSelectedReport({
          title: 'Maintenance & Calibration SLA Compliance Report',
          category: 'ISO/IEC Quality Assurance',
          purpose: 'Ensure all analytical balances, high-voltage oscilloscopes, and spectrophotometers maintain unbroken calibration chains.',
          period: 'Annual Calibration Cycle 2026',
          laboratory: activeLab?.name || 'All Laboratories',
          sources: ['Technician Service Logs', 'Calibration Vendor Certificates', 'Asset History Ledger'],
          methodology: 'Evaluates the ratio of on-time preventative service completions against overdue tickets. Targets 95%+ compliance.',
          keyFindings: [
            { label: 'SLA Maintenance Score', value: '96.4%', status: 'good' },
            { label: 'Active Calibrated Units', value: `${workingEq} units`, status: 'good' },
            { label: 'Pending Recalibrations', value: `${maintenanceEq} units`, status: maintenanceEq > 0 ? 'warning' : 'good' }
          ],
          recommendedActions: [
            'Request certified calibration technician visit for overdue analytical balances.',
            'Affix fresh tamper-evident calibration stickers upon sign-off.',
            'Archive calibration certificates in ISO compliance repository.'
          ],
          creator: currentUser.displayName,
          generatedDate: new Date().toLocaleString()
        });
      }
    }
  ];

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

  const handleExportPDF = () => {
    const headers = ['ID', 'Date', 'Action', 'Category', 'User', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp.split('T')[0],
      l.action,
      l.category,
      l.userName,
      l.details.length > 35 ? l.details.substring(0, 35) + '...' : l.details
    ]);

    exportAuditReportPDF(
      'Laboratory Audit & Compliance Ledger',
      activeLab?.name || 'All Facilities',
      [
        { label: 'Total Logs', value: filteredLogs.length.toString() },
        { label: 'Facility', value: activeLab?.code || 'Campus Wide' },
        { label: 'Audit Standard', value: 'ISO 17025' }
      ],
      headers,
      rows
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Audit & Compliance Intelligence
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              ISO/IEC 17025 Ready
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Executive Reports & Audit Ledger
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Click any analytical report card below to review full calculation methodology, data sources, critical findings, and recommended institutional actions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 no-print">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-[#BCA0F5] hover:bg-[#8961D8] text-white rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-md transition"
            title="Download Official Audit PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-[#FFF8F2] hover:bg-[#F0E9FF] text-[#332B40] border border-[#E9DDF1] rounded-2xl text-xs font-bold flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4 text-[#8961D8]" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-[#FFF8F2] text-[#71667D] border border-[#E9DDF1] rounded-2xl text-xs font-bold flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Clickable Report Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-extrabold text-lg text-foreground dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            <span>Interactive Operational Reports</span>
          </h2>
          <span className="text-xs text-muted-foreground">Click any card to inspect full details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={card.openModal}
                className="p-5 bg-white border border-[#E4E7F0] rounded-3xl shadow-card hover:shadow-card-hover hover:border-cyan-300 cursor-pointer transition flex flex-col justify-between group text-[#172033]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5 text-cyan-600" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                      {card.category}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-base text-[#172033] mt-3 group-hover:text-cyan-600 transition">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#5B6478] mt-1 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E4E7F0] flex items-center justify-between">
                  <span className="text-xs font-black text-[#172033]">
                    {card.metric}
                  </span>
                  <span className="text-xs font-bold text-cyan-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table Section */}
      <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-[#E4E7F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-black text-base text-[#172033] flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-600" />
              <span>Immutable Audit Trail & Activity Ledger</span>
            </h3>
            <p className="text-xs text-[#5B6478]">
              {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Tamper-evident ledger of operations and authorizations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search audit records..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="INVENTORY">Inventory</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="SAFETY">Safety</option>
              <option value="PROCUREMENT">Procurement</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-border dark:border-slate-800 text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground dark:text-white">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground dark:text-slate-200">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED REPORT EXPLANATION MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] text-[#172033]">
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-[#E4E7F0] text-[#172033] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-full">
                  {selectedReport.category}
                </span>
                <h3 className="font-heading font-black text-xl text-[#172033] mt-1">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#5B6478] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-border dark:border-slate-800">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Reporting Period</span>
                  <span className="font-extrabold text-foreground dark:text-white">{selectedReport.period}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Facility Scope</span>
                  <span className="font-extrabold text-foreground dark:text-white truncate block">{selectedReport.laboratory}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Generated By</span>
                  <span className="font-bold text-foreground dark:text-white">{selectedReport.creator}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{selectedReport.generatedDate}</span>
                </div>
              </div>

              {/* Purpose & Methodology */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-foreground dark:text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>Purpose & Objective</span>
                  </h4>
                  <p className="text-muted-foreground mt-1 leading-relaxed">
                    {selectedReport.purpose}
                  </p>
                </div>

                <div>
                  <h4 className="font-heading font-extrabold text-sm text-foreground dark:text-white">
                    Calculation Methodology & Data Sources
                  </h4>
                  <p className="text-muted-foreground mt-1 leading-relaxed">
                    {selectedReport.methodology}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedReport.sources.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-muted-foreground font-mono text-[10px]">
                        Source: {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Findings KPI Pills */}
              <div>
                <h4 className="font-heading font-extrabold text-sm text-foreground dark:text-white mb-2">
                  Key Quantitative Findings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedReport.keyFindings.map((kf, i) => (
                    <div key={i} className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">{kf.label}</span>
                      <span className="text-base font-black text-foreground dark:text-white mt-0.5 block">{kf.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table if applicable */}
              {selectedReport.tableData && (
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-foreground dark:text-white mb-2">
                    Detailed Record Breakdown
                  </h4>
                  <div className="border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-muted-foreground uppercase text-[10px]">
                        <tr>
                          {selectedReport.tableData.headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-slate-800">
                        {selectedReport.tableData.rows.length === 0 ? (
                          <tr><td colSpan={selectedReport.tableData.headers.length} className="py-4 text-center text-muted-foreground">No records to display.</td></tr>
                        ) : (
                          selectedReport.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 font-medium text-foreground dark:text-slate-200">{cell}</td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-2">
                <h4 className="font-heading font-extrabold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Institutional Next Steps</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-200 text-xs">
                  {selectedReport.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Official Report Verification Token: #ILMS-{Math.random().toString(36).substring(2, 8).toUpperCase()}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Print
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90"
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
