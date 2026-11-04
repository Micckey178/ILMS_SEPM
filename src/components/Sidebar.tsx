import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Cpu,
  CalendarCheck,
  Calendar,
  ArrowRightLeft,
  FlaskConical,
  Wrench,
  ShoppingCart,
  ShieldAlert,
  FileSpreadsheet,
  Building,
  X,
  Layers,
  Sparkles,
  BookOpen,
  UserCheck,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeLab } = useAuth();

  // Navigation configured by role
  const getNavLinks = () => {
    const role = currentUser.role;

    const sections = [
      {
        group: 'Overview',
        items: [
          { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
          { to: '/schedule', label: 'Department Timetables & Schedule', icon: Calendar },
        ]
      },
      {
        group: 'Academic & Practicals',
        items: [
          {
            to: '/attendance',
            label: role === 'student'
              ? 'My Practical Attendance'
              : (role === 'technician' || role === 'labManager')
              ? 'Technical Work Orders'
              : 'Faculty Attendance',
            icon: (role === 'technician' || role === 'labManager') ? Wrench : UserCheck
          },
          { to: '/bookings', label: 'Booking Reservations', icon: CalendarCheck },
          ...(role !== 'student'
            ? [{ to: '/issue-return', label: 'Issue & Return Loans', icon: ArrowRightLeft }]
            : [{ to: '/issue-return', label: 'My Loaned Items', icon: ArrowRightLeft }]),
        ]
      },
      {
        group: 'Laboratories & Assets',
        items: [
          { to: '/inventory', label: 'Universal Inventory', icon: Boxes },
          { to: '/equipment', label: 'Equipment Assets', icon: Cpu },
          { to: '/specialized', label: 'Domain Modules', icon: FlaskConical },
        ]
      },
      ...(role !== 'student'
        ? [
            {
              group: 'Operations & Maintenance',
              items: [
                { to: '/maintenance', label: 'Maintenance & Calibration', icon: Wrench },
                ...(role === 'admin' || role === 'labManager' || role === 'technician'
                  ? [{ to: '/procurement', label: 'Vendor & Procurement', icon: ShoppingCart }]
                  : []),
                { to: '/safety', label: 'Safety & Incidents', icon: ShieldAlert },
                { to: '/reports', label: 'Reports & Audit Logs', icon: FileSpreadsheet },
              ]
            }
          ]
        : []),
      ...(role === 'admin'
        ? [
            {
              group: 'Administration',
              items: [
                { to: '/users', label: 'User Management', icon: Users },
                { to: '/laboratories', label: 'Facility Management', icon: Building }
              ]
            }
          ]
        : [])
    ];

    return sections;
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[65px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-65px)] w-72 bg-white border-r border-[#E9DDF1] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } no-print`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-[#E9DDF1] lg:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#BCA0F5] to-[#FFD2BF] text-white flex items-center justify-center font-bold text-sm">
              ILMS
            </div>
            <span className="font-heading font-extrabold text-base text-[#332B40]">Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-[#FFF8F2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navLinks.map((section, idx) => {
            if (section.items.length === 0) return null;
            return (
              <div key={idx} className="space-y-1.5">
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#71667D]">
                  {section.group}
                </h4>
                <div className="space-y-1 pt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/50 shadow-sm font-bold'
                              : 'text-[#71667D] hover:text-[#332B40] hover:bg-[#FFF8F2]'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Lab Card Footer */}
        {activeLab && (
          <div className="p-4 m-4 bg-[#FFF8F2] border border-[#E9DDF1] rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#71667D]">
              <span className="uppercase tracking-wider">Active Workspace</span>
              <span className="font-mono text-[10px] bg-white text-[#8961D8] border border-[#E9DDF1] px-2 py-0.5 rounded-full font-bold">
                {activeLab.code}
              </span>
            </div>
            <p className="font-heading font-extrabold text-sm text-[#332B40] mt-1 truncate">
              {activeLab.name}
            </p>
            <p className="text-xs text-[#71667D] truncate">
              {activeLab.building} • Rm {activeLab.roomNumber}
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
