import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QRScannerModal } from './components/QRScannerModal';
import { DashboardPage } from './pages/DashboardPage';
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
import { InAppNotification, UniversalInventoryItem, EquipmentAsset } from './types';
import { DataService } from './services/dataService';

const AppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
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

  const handleItemFoundByQR = (
    item: UniversalInventoryItem | EquipmentAsset,
    type: 'inventory' | 'equipment'
  ) => {
    if (type === 'inventory') {
      navigate('/inventory');
    } else {
      navigate('/equipment');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/20 selection:text-sky-300">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        notifications={notifications}
        onRefreshNotifications={loadNotifications}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible / Drawer Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<DashboardPage onOpenQRScanner={() => setIsQRScannerOpen(true)} />} />
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
          </Routes>
        </main>
      </div>

      {/* Global Asset QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onItemFound={handleItemFoundByQR}
      />
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
