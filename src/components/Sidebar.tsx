import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Cpu,
  CalendarCheck,
  ArrowRightLeft,
  FlaskConical,
  Wrench,
  ShoppingCart,
  ShieldAlert,
  FileSpreadsheet,
  Building,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeLab } = useAuth();

  const navLinks = [
    {
      group: 'Overview',
      items: [
        { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      group: 'Shared Platform',
      items: [
        { to: '/inventory', label: 'Universal Inventory', icon: Boxes },
        { to: '/equipment', label: 'Equipment Assets', icon: Cpu },
        { to: '/bookings', label: 'Booking Calendar', icon: CalendarCheck },
        { to: '/issue-return', label: 'Issue & Return Loans', icon: ArrowRightLeft },
      ]
    },
    {
      group: 'Specialized Labs',
      items: [
        { to: '/specialized', label: 'Specialized Modules', icon: FlaskConical },
      ]
    },
    {
      group: 'Operations & Safety',
      items: [
        { to: '/maintenance', label: 'Maintenance & Calibration', icon: Wrench },
        { to: '/procurement', label: 'Procurement & Orders', icon: ShoppingCart },
        { to: '/safety', label: 'Safety & Incidents', icon: ShieldAlert },
        { to: '/reports', label: 'Reports & Audit Logs', icon: FileSpreadsheet },
      ]
    },
    {
      group: 'Administration',
      items: [
        ...(currentUser.role === 'admin'
          ? [{ to: '/laboratories', label: 'Laboratory Registry', icon: Building }]
          : []),
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[53px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-53px)] w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } no-print`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm text-slate-100">ILMS Navigation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navLinks.map((section, idx) => {
            if (section.items.length === 0) return null;
            return (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.group}
                </h4>
                <div className="space-y-0.5 pt-1">
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
                          `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                            isActive
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
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
          <div className="p-3 m-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="truncate">{activeLab.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1"></span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Code: {activeLab.code}</span>
              <span>Cap: {activeLab.capacity}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>Safety: {activeLab.safetyLevel}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
