import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Boxes,
  Search,
  Building,
  UserCheck,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  onOpenQRScanner: () => void;
  onOpenCommandPalette: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenQRScanner,
  onOpenCommandPalette
}) => {
  const { currentUser } = useAuth();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-[#E9DDF1] dark:border-slate-800 lg:hidden px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl no-print select-none"
    >
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
            isActive
              ? 'text-[#8961D8] dark:text-[#BCA0F5]'
              : 'text-[#71667D] hover:text-[#332B40] dark:text-slate-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>

      {/* Second Tab: Role Adaptive */}
      {currentUser.role === 'faculty' ? (
        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
              isActive
                ? 'text-[#8961D8] dark:text-[#BCA0F5]'
                : 'text-[#71667D] hover:text-[#332B40] dark:text-slate-400'
            }`
          }
        >
          <UserCheck className="w-5 h-5 mb-0.5" />
          <span>Attendance</span>
        </NavLink>
      ) : currentUser.role === 'student' ? (
        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
              isActive
                ? 'text-[#8961D8] dark:text-[#BCA0F5]'
                : 'text-[#71667D] hover:text-[#332B40] dark:text-slate-400'
            }`
          }
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span>Bookings</span>
        </NavLink>
      ) : (
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
              isActive
                ? 'text-[#8961D8] dark:text-[#BCA0F5]'
                : 'text-[#71667D] hover:text-[#332B40] dark:text-slate-400'
            }`
          }
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span>Calendar</span>
        </NavLink>
      )}

      {/* Central Floating QR Scanner Action — Easy Thumb Reach */}
      <button
        type="button"
        onClick={onOpenQRScanner}
        className="-mt-5 w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#8961D8] to-[#FFD2BF] text-white flex items-center justify-center shadow-lg shadow-[#8961D8]/40 hover:scale-105 active:scale-90 transition p-2.5 focus:outline-none focus:ring-4 focus:ring-[#8961D8]/30"
        aria-label="Scan Laboratory Asset QR Code"
      >
        <QrCode className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* Global Search Shortcut */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold text-[#71667D] hover:text-[#332B40] dark:text-slate-400 transition active:scale-95"
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span>Search</span>
      </button>

      {/* Fourth Tab: Role Adaptive */}
      {currentUser.role === 'admin' ? (
        <NavLink
          to="/laboratories"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
              isActive
                ? 'text-[#8961D8] dark:text-[#BCA0F5]'
                : 'text-[#71667D] hover:text-[#332B40] dark:text-slate-400'
            }`
          }
        >
          <Building className="w-5 h-5 mb-0.5" />
          <span>Labs</span>
        </NavLink>
      ) : (
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
              isActive
                ? 'text-[#8961D8] dark:text-[#BCA0F5]'
                : 'text-[#71667D] hover:text-[#332B40] dark:text-slate-400'
            }`
          }
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span>Stock</span>
        </NavLink>
      )}
    </nav>
  );
};
