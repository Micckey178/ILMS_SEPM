import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { GuidedOnboardingModal } from './components/GuidedOnboardingModal';
import { QRScannerModal } from './components/QRScannerModal';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { InventoryPage } from './pages/InventoryPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { BookingsPage } from './pages/BookingsPage';
import { IssueReturnPage } from './pages/IssueReturnPage';
import { SpecializedModulesPage } from './pages/SpecializedModulesPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ProcurementPage } from './pages/ProcurementPage';
import { SafetyPage } from './pages/SafetyPage';
import { ReportsPage } from './pages/ReportsPage';
import { LaboratoriesPage } from './pages/LaboratoriesPage';
import { AttendancePage } from './pages/AttendancePage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommandCentrePage } from './pages/CommandCentrePage';
import { ResourceIntelligencePage } from './pages/ResourceIntelligencePage';
import { LoginPage } from './pages/LoginPage';
import { WelcomePage } from './pages/WelcomePage';
import { LabAssistantBot } from './components/LabAssistantBot';
import { InAppNotification, UniversalInventoryItem, EquipmentAsset } from './types';
import { DataService } from './services/dataService';

const AppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const loadNotifications = async () => {
    try {
      const data = await DataService.getNotifications(currentUser);
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  // First-time visit onboarding check
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ilms_tour_completed');
    if (!hasSeenTour) {
      setIsOnboardingOpen(true);
      localStorage.setItem('ilms_tour_completed', 'true');
    }

    const handleOpenQR = () => setIsQRScannerOpen(true);
    const handleOpenCmd = () => setIsCommandPaletteOpen(true);
    window.addEventListener('ilms:open-qr', handleOpenQR);
    window.addEventListener('ilms:open-command', handleOpenCmd);
    return () => {
      window.removeEventListener('ilms:open-qr', handleOpenQR);
      window.removeEventListener('ilms:open-command', handleOpenCmd);
    };
  }, []);

  const handleItemFoundByQR = (
    item: UniversalInventoryItem | EquipmentAsset,
    type: 'inventory' | 'equipment'
  ) => {
    if (type === 'inventory') {
      const inv = item as UniversalInventoryItem;
      navigate(`/inventory?search=${encodeURIComponent(inv.sku || inv.name)}`);
    } else {
      const eq = item as EquipmentAsset;
      navigate(`/equipment?search=${encodeURIComponent(eq.assetTag || eq.name)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[#BCA0F5]/30 selection:text-[#332B40] transition-colors duration-300">
      {/* Top Navigation Bar with Top-Right Lab Selector */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        notifications={notifications}
        onRefreshNotifications={loadNotifications}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible / Drawer Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area — Matching Header Width & Length Exactly */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
          <Routes>
            <Route path="/" element={<DashboardPage onOpenQRScanner={() => setIsQRScannerOpen(true)} />} />
            <Route path="/schedule" element={<CalendarPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/timetable" element={<CalendarPage />} />
            <Route path="/timetables" element={<CalendarPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/issue-return" element={<IssueReturnPage />} />
            <Route path="/specialized" element={<SpecializedModulesPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/laboratories" element={<LaboratoriesPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/command-centre" element={<CommandCentrePage />} />
            <Route path="/command-center" element={<CommandCentrePage />} />
            <Route path="/resource-intelligence" element={<ResourceIntelligencePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Thumb-Friendly Access */}
      <MobileBottomNav
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Global Asset QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onItemFound={handleItemFoundByQR}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
      />

      {/* Guided Onboarding Interactive Walkthrough */}
      <GuidedOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<WelcomePage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
        {/* Interactive Companion Companion throughout entire ILMS */}
        <LabAssistantBot />
      </AuthProvider>
    </Router>
  );
}

export default App;
