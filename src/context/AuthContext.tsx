import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Laboratory, UserRole } from '../types';
import { DataService, localStore } from '../services/dataService';
import { auth, isFirebaseConfigured } from '../lib/firebase/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile;
  activeLab: Laboratory | null;
  laboratories: Laboratory[];
  allUsers: UserProfile[];
  isLoading: boolean;
  isFirebaseActive: boolean;
  switchUser: (userOrId: string | UserProfile) => Promise<void> | void;
  switchLaboratory: (labId: string) => void;
  can: (action: string, entity?: string) => boolean;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ilms_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.displayName && !parsed.displayName.includes('Sarah Jenkins')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading saved user session from localStorage', e);
    }
    const users = localStore.getUsers();
    return users[0] || {
      id: 'usr-admin-01',
      email: 'mehikac702@gmail.com',
      displayName: 'Mehekha C (Lead System Architect & Admin)',
      role: 'admin',
      organizationId: 'org-sjbit-01',
      assignedLabs: ['lab-atl-01', 'lab-atl-02', 'lab-atl-03', 'lab-sll-01', 'lab-sll-02', 'lab-bfl-01', 'lab-bfl-02', 'lab-bfl-03', 'lab-vin-01', 'lab-cbl-01', 'lab-cbl-02', 'lab-chem-01'],
      assignedLabId: 'lab-atl-01'
    };
  });

  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [activeLab, setActiveLab] = useState<Laboratory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isFirebaseActive = isFirebaseConfigured();

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [users, labs] = await Promise.all([
        DataService.getAllUsers(),
        DataService.getLaboratories()
      ]);
      setAllUsers(users);
      setLaboratories(labs);

      // Select active lab based on user's assigned lab
      const userLab = labs.find(l => l.id === currentUser.assignedLabId) || labs[0] || null;
      setActiveLab(userLab);
    } catch (err) {
      console.error('Failed to load auth initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // If Firebase Auth is active, subscribe to auth state changes
    if (isFirebaseActive && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          let profile = await DataService.getCurrentUser(fbUser.uid);
          if (!profile && fbUser.email) {
            profile = await DataService.getCurrentUser(fbUser.email);
          }
          if (profile) {
            setCurrentUser(profile);
            try {
              localStorage.setItem('ilms_active_user', JSON.stringify(profile));
            } catch (e) {}
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const switchUser = async (userOrId: string | UserProfile) => {
    let target: UserProfile | null = null;

    if (typeof userOrId === 'object' && userOrId !== null && userOrId.id) {
      target = userOrId;
    } else if (typeof userOrId === 'string') {
      const clean = userOrId.trim();
      const cleanLower = clean.toLowerCase();

      // 1. Look in current allUsers state
      target = allUsers.find(u => u.id === clean || u.email?.toLowerCase() === cleanLower) || null;

      // 2. Look in localStore
      if (!target) {
        const localList = localStore.getUsers();
        target = localList.find(u => u.id === clean || u.email?.toLowerCase() === cleanLower) || null;
      }

      // 3. Query Firestore / DataService
      if (!target) {
        target = await DataService.getCurrentUser(clean);
      }
    }

    if (target) {
      setCurrentUser(target);
      try {
        localStorage.setItem('ilms_active_user', JSON.stringify(target));
      } catch (e) {
        console.warn('Failed to persist active user in localStorage', e);
      }

      // Ensure target is tracked in allUsers
      setAllUsers(prev => {
        if (!prev.some(u => u.id === target!.id)) {
          return [...prev, target!];
        }
        return prev;
      });

      // Auto-switch to authorized laboratory
      if (target.assignedLabId) {
        const lab = laboratories.find(l => l.id === target.assignedLabId);
        if (lab) setActiveLab(lab);
      } else if (target.assignedLabs?.length > 0) {
        const lab = laboratories.find(l => l.id === target.assignedLabs[0]);
        if (lab) setActiveLab(lab);
      }
    }
  };

  const switchLaboratory = (labId: string) => {
    const lab = laboratories.find(l => l.id === labId);
    if (lab) {
      setActiveLab(lab);
      const updatedUser = { ...currentUser, assignedLabId: labId };
      setCurrentUser(updatedUser);
      DataService.updateUser(updatedUser);
      try {
        localStorage.setItem('ilms_active_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn('Failed to persist active user in localStorage', e);
      }
    }
  };

  /**
   * Role-Based Access Control (RBAC) Checker
   */
  const can = (action: string, entity?: string): boolean => {
    const role: UserRole = currentUser.role;

    if (role === 'admin') return true; // Admins have full access

    switch (action) {
      case 'manage_laboratories':
        return false;

      case 'create_inventory':
      case 'edit_inventory':
      case 'delete_inventory':
        return role === 'labManager' || role === 'technician';

      case 'record_stock_movement':
        return role === 'labManager' || role === 'technician';

      case 'manage_equipment':
      case 'block_equipment':
        return role === 'labManager' || role === 'technician';

      case 'issue_return_items':
        return role === 'labManager' || role === 'technician';

      case 'book_equipment':
        return true; // All authenticated roles can request/book equipment

      case 'approve_booking':
        return role === 'labManager' || role === 'technician';

      case 'approve_procurement':
        return role === 'labManager';

      case 'close_incident':
        return role === 'labManager' || role === 'technician';

      case 'view_audit_logs':
        return role === 'labManager';

      default:
        return true;
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseActive && auth) {
        await fbSignOut(auth);
      }
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    // Complete purge of user-specific session, cached sensitive data, and active lab
    sessionStorage.clear();
    localStorage.removeItem('ilms_active_user');
    localStorage.removeItem('ilms_active_lab');
    localStorage.removeItem('ilms_cached_query');
    const defaultStudent = allUsers.find(u => u.role === 'student') || allUsers[0];
    if (defaultStudent) setCurrentUser(defaultStudent);
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeLab,
        laboratories,
        allUsers,
        isLoading,
        isFirebaseActive,
        switchUser,
        switchLaboratory,
        can,
        logout,
        refreshData: loadInitialData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
