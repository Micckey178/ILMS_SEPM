import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { LabManagerDashboard } from './dashboards/LabManagerDashboard';
import { FacultyDashboard } from './dashboards/FacultyDashboard';
import { TechnicianDashboard } from './dashboards/TechnicianDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { LiveResourceAvailabilityModal } from '../components/LiveResourceAvailabilityModal';
import { FaultReportingModal } from '../components/FaultReportingModal';
import {
  Building2,
  Boxes,
  CalendarCheck,
  UserCheck,
  Wrench,
  ShoppingCart,
  ShieldAlert,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  QrCode,
  LayoutGrid,
  Activity,
  Layers,
  Calendar,
  Gauge
} from 'lucide-react';
import { localStore } from '../services/dataService';
import { ResourceIntelligencePage } from './ResourceIntelligencePage';

interface DashboardPageProps {
  onOpenQRScanner: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenQRScanner }) => {
  const { currentUser, activeLab } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'workspace' | 'intelligence' | 'modules'>('workspace');
  const [isLiveMatrixOpen, setIsLiveMatrixOpen] = useState(false);
  const [isFaultReportOpen, setIsFaultReportOpen] = useState(false);

  // Live counts
  const inventoryCount = localStore.getInventory().length;
  const equipmentCount = localStore.getEquipment().length;
  const bookingsCount = localStore.getBookings().length;

  const practicalSessionsCount = localStore.getPracticalSessions().length;

  const lunaModules = [
    {
      id: 'intelligence',
      title: 'Resource Intelligence',
      desc: 'Deterministic equipment utilization, workstation cohort deficits, and rule-based optimization proposals.',
      status: 'Live Analytics & Shortage Engine',
      badge: 'Resource Optimization',
      icon: Gauge,
      path: '/resource-intelligence',
      accent: 'border-[#8961D8] bg-[#F5EFFF] text-[#8961D8]'
    },
    {
      id: 'timetable',
      title: 'Department Timetables',
      desc: 'Official Odd Sem 2026-27 timetables across 11 CSE labs. Track who is taking which class at what time.',
      status: `11 Labs • ${practicalSessionsCount} Scheduled Batches`,
      badge: 'Official Timetable',
      icon: Calendar,
      path: '/schedule',
      accent: 'border-[#BCA0F5] bg-[#F0E9FF] text-[#8961D8]'
    },
    {
      id: 'lab',
      title: 'My Laboratory',
      desc: 'Active academic lab, workstation availability, room details, and floor capacity.',
      status: `${activeLab?.code || 'FAC-01'} • ${activeLab?.name || 'General Facility'}`,
      badge: 'Active Workspace',
      icon: Building2,
      path: '/laboratories',
      accent: 'border-[#BCA0F5] bg-[#F0E9FF] text-[#8961D8]'
    },
    {
      id: 'inventory',
      title: 'Inventory & Equipment',
      desc: 'Reagents, hazardous chemical stocks, precision instruments, and batch expiry tracking.',
      status: `${inventoryCount} Reagents • ${equipmentCount} Assets`,
      badge: 'Real-Time Sync',
      icon: Boxes,
      path: '/inventory',
      accent: 'border-[#FFD2BF] bg-[#FFF8F2] text-[#8961D8]'
    },
    {
      id: 'bookings',
      title: 'Laboratory Bookings',
      desc: 'Conflict-free bench scheduling, apparatus slots, and real-time reservations.',
      status: `${bookingsCount} Active Reservations`,
      badge: 'Instant Concurrency',
      icon: CalendarCheck,
      path: '/bookings',
      accent: 'border-[#E9DDF1] bg-[#FBE5EF] text-[#8961D8]'
    },
    {
      id: 'attendance',
      title: 'Faculty Attendance',
      desc: 'Student cohort participation, practical batch verification, and syllabus hours.',
      status: 'Live Biometric & Practical Logs',
      badge: 'Accreditation Ready',
      icon: UserCheck,
      path: '/attendance',
      accent: 'border-[#BCA0F5] bg-[#F0E9FF] text-[#8961D8]'
    },
    {
      id: 'maintenance',
      title: 'Maintenance & Calibration',
      desc: 'Equipment maintenance schedules, recalibration dates, and fault tracking.',
      status: 'ISO 17025 Compliance Active',
      badge: 'Zero Overdue',
      icon: Wrench,
      path: '/maintenance',
      accent: 'border-[#FFD2BF] bg-[#FFF8F2] text-[#8961D8]'
    },
    {
      id: 'procurement',
      title: 'Procurement & Vendors',
      desc: 'Multi-tier purchase approvals, catalog items in Indian Rupees (₹), and Dean sign-offs.',
      status: 'Tiered Dean Approvals in ₹',
      badge: 'Certified Vendors',
      icon: ShoppingCart,
      path: '/procurement',
      accent: 'border-[#E9DDF1] bg-[#FBE5EF] text-[#8961D8]'
    },
    {
      id: 'safety',
      title: 'Safety & Incidents',
      desc: 'Chemical spill logs, eyewash station checklists, hazard protocols, and emergency guidelines.',
      status: 'EHS Protocol: Grade A Safe',
      badge: 'Inspected Today',
      icon: ShieldAlert,
      path: '/safety',
      accent: 'border-[#BCA0F5] bg-[#F0E9FF] text-[#8961D8]'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      desc: 'Accreditation-ready utilization metrics, CSV exports, attendance rates, and spending audits.',
      status: 'Audit Export: Instant CSV',
      badge: 'Complete Audit Trail',
      icon: FileSpreadsheet,
      path: '/reports',
      accent: 'border-[#FFD2BF] bg-[#FFF8F2] text-[#8961D8]'
    }
  ];

  // Render role-specific dashboard experience
  const renderRoleDashboard = () => {
    switch (currentUser.role) {
      case 'admin':
        return (
          <AdminDashboard
            onOpenQRScanner={onOpenQRScanner}
            onOpenLiveAvailability={() => setIsLiveMatrixOpen(true)}
          />
        );
      case 'labManager':
        return (
          <LabManagerDashboard
            onOpenQRScanner={onOpenQRScanner}
            onOpenLiveAvailability={() => setIsLiveMatrixOpen(true)}
          />
        );
      case 'faculty':
        return (
          <FacultyDashboard
            onOpenQRScanner={onOpenQRScanner}
            onOpenLiveAvailability={() => setIsLiveMatrixOpen(true)}
          />
        );
      case 'technician':
        return (
          <TechnicianDashboard
            onOpenQRScanner={onOpenQRScanner}
            onOpenFaultReport={() => setIsFaultReportOpen(true)}
          />
        );
      case 'student':
      default:
        return (
          <StudentDashboard
            onOpenQRScanner={onOpenQRScanner}
            onOpenFaultReport={() => setIsFaultReportOpen(true)}
          />
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Luna Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white border border-[#E9DDF1] rounded-3xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#BCA0F5] to-[#FFD2BF] overflow-hidden flex items-center justify-center shadow-sm">
            <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain scale-120" />
          </div>
          <div>
            <h2 className="font-heading font-black text-base text-[#332B40]">
              Academic Laboratory Dashboard
            </h2>
            <p className="text-xs text-[#71667D]">
              Welcome back, <strong className="text-[#332B40]">{currentUser.displayName}</strong> ({currentUser.role})
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#FFF8F2] p-1 rounded-2xl border border-[#E9DDF1] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'workspace'
                ? 'bg-white text-[#8961D8] shadow-sm border border-[#E9DDF1]'
                : 'text-[#71667D] hover:text-[#332B40]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Role Workspace</span>
          </button>
          {(currentUser.role === 'admin' || currentUser.role === 'faculty') && (
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'intelligence'
                  ? 'bg-white text-[#8961D8] shadow-sm border border-[#E9DDF1]'
                  : 'text-[#71667D] hover:text-[#332B40]'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Resource Intelligence</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'modules'
                ? 'bg-white text-[#8961D8] shadow-sm border border-[#E9DDF1]'
                : 'text-[#71667D] hover:text-[#332B40]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Featured Modules Grid</span>
          </button>
        </div>
      </div>

      {/* VIEW CONDITIONAL RENDERING */}
      {activeTab === 'intelligence' ? (
        <div className="space-y-6 animate-in fade-in">
          <ResourceIntelligencePage />
        </div>
      ) : activeTab === 'modules' ? (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-2xl text-[#332B40]">
                Featured Laboratory Modules
              </h3>
              <p className="text-xs text-[#71667D]">
                Interactive core modules styled after Luna's rounded aesthetic. Click any card to open.
              </p>
            </div>
            <button
              onClick={onOpenQRScanner}
              className="px-4 py-2 bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-bold rounded-2xl text-xs transition shadow-md flex items-center space-x-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Asset QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lunaModules.map(mod => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.path)}
                  className="bg-white border border-[#E9DDF1] hover:border-[#BCA0F5] rounded-3xl p-6 shadow-sm hover:shadow-xl transition duration-300 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl border ${mod.accent}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF8F2] border border-[#E9DDF1] text-[#71667D]">
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading font-black text-lg text-[#332B40] group-hover:text-[#8961D8] transition">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-[#71667D] leading-relaxed mt-1">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E9DDF1] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#71667D] truncate max-w-[160px]">
                      {mod.status}
                    </span>
                    <span className="text-xs font-black text-[#8961D8] group-hover:translate-x-1 transition flex items-center space-x-1">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW B: ROLE WORKSPACE (Role-specific telemetry & tables) */
        renderRoleDashboard()
      )}

      {/* Global Live Resource Availability Modal */}
      <LiveResourceAvailabilityModal
        isOpen={isLiveMatrixOpen}
        onClose={() => setIsLiveMatrixOpen(false)}
      />

      {/* Fault Reporting Modal */}
      <FaultReportingModal
        isOpen={isFaultReportOpen}
        onClose={() => setIsFaultReportOpen(false)}
      />
    </div>
  );
};
