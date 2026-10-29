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
  switchUser: (userId: string) => void;
  switchLaboratory: (labId: string) => void;
  can: (action: string, entity?: string) => boolean;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const users = localStore.getUsers();
    return users[0] || {
      id: 'usr-admin-01',
      email: 'admin@institution.edu',
      displayName: 'Dr. Sarah Jenkins (Admin)',
      role: 'admin',
      organizationId: 'org-main-01',
      assignedLabs: ['lab-chem-01', 'lab-phys-01'],
      assignedLabId: 'lab-chem-01'
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
          const profile = await DataService.getCurrentUser(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const switchUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
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
      // Check if user is allowed to access lab or is admin
      if (currentUser.role === 'admin' || currentUser.assignedLabs?.includes(labId)) {
        setActiveLab(lab);
        // Persist preferred lab for user
        const updatedUser = { ...currentUser, assignedLabId: labId };
        setCurrentUser(updatedUser);
        DataService.updateUser(updatedUser);
      } else {
        alert(`Access Restricted: You are not assigned to ${lab.name}.`);
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
    if (isFirebaseActive && auth) {
      await fbSignOut(auth);
    }
    // Switch to default student demo user to demonstrate restricted view or landing page
    const studentUser = allUsers.find(u => u.role === 'student') || allUsers[0];
    if (studentUser) setCurrentUser(studentUser);
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
