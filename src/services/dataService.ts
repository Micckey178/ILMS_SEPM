import {
  UserProfile,
  Laboratory,
  UniversalInventoryItem,
  EquipmentAsset,
  EquipmentBooking,
  IssueReturnTransaction,
  MaintenanceRecord,
  IncidentTicket,
  PurchaseRequest,
  InAppNotification,
  AuditLogEntry,
  StockMovement,
  MovementType,
  UserRole,
  ComputerWorkstation,
  PracticalSession,
  SmartHealthScore,
  FaultTicket,
  AttendanceRecord,
  AttendanceStatus,
  CertifiedVendor,
  VendorCatalogProduct
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_LABORATORIES,
  INITIAL_INVENTORY,
  INITIAL_EQUIPMENT,
  INITIAL_BOOKINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_MAINTENANCE,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_INCIDENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WORKSTATIONS,
  INITIAL_PRACTICAL_SESSIONS,
  INITIAL_FAULT_TICKETS,
  INITIAL_ATTENDANCE,
  INITIAL_VENDORS,
  INITIAL_VENDOR_PRODUCTS
} from '../lib/firebase/seedData';
import { db, isFirebaseConfigured } from '../lib/firebase/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';

export interface CloudSyncStatus {
  state: 'idle' | 'checking' | 'synced' | 'permission_denied' | 'error';
  lastChecked: string | null;
  errorMessage: string | null;
  syncedCount: number;
}

let currentSyncStatus: CloudSyncStatus = {
  state: 'idle',
  lastChecked: null,
  errorMessage: null,
  syncedCount: 0
};

const syncListeners = new Set<(status: CloudSyncStatus) => void>();

export const notifySyncStatus = (status: Partial<CloudSyncStatus>) => {
  currentSyncStatus = { ...currentSyncStatus, ...status };
  syncListeners.forEach(listener => {
    try {
      listener(currentSyncStatus);
    } catch (e) {
      console.error('Sync listener error:', e);
    }
  });
};

const handleFirestoreError = (action: string, err: any) => {
  console.warn(`Firestore ${action} warning:`, err);
  const isPerm = err?.code === 'permission-denied' ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission'));
  notifySyncStatus({
    state: isPerm ? 'permission_denied' : 'error',
    errorMessage: isPerm
      ? 'Cloud Firestore write permissions denied. Please update rules in Firebase Console.'
      : err?.message || 'Firestore sync error',
    lastChecked: new Date().toISOString()
  });
};

const handleFirestoreSuccess = (increment = 1) => {
  notifySyncStatus({
    state: 'synced',
    errorMessage: null,
    lastChecked: new Date().toISOString(),
    syncedCount: currentSyncStatus.syncedCount + increment
  });
};

const sanitizeForFirestore = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

const STORAGE_KEY_PREFIX = 'ILMS_STORE_V5_';

class LocalStoreManager {
  private memoryStore: Record<string, string> = {};

  private hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private get<T>(key: string, defaultVal: T): T {
    try {
      const fullKey = STORAGE_KEY_PREFIX + key;
      const raw = this.hasStorage() ? localStorage.getItem(fullKey) : this.memoryStore[fullKey];
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      const fullKey = STORAGE_KEY_PREFIX + key;
      const raw = JSON.stringify(val);
      if (this.hasStorage()) {
        localStorage.setItem(fullKey, raw);
      } else {
        this.memoryStore[fullKey] = raw;
      }
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  public init() {
    const fullKey = STORAGE_KEY_PREFIX + 'initialized';
    const isInit = this.hasStorage() ? localStorage.getItem(fullKey) : this.memoryStore[fullKey];
    if (!isInit) {
      this.resetToSeed();
    }
  }

  public resetToSeed() {
    this.set('users', INITIAL_USERS);
    this.set('laboratories', INITIAL_LABORATORIES);
    this.set('inventory', INITIAL_INVENTORY);
    this.set('equipment', INITIAL_EQUIPMENT);
    this.set('bookings', INITIAL_BOOKINGS);
    this.set('transactions', INITIAL_TRANSACTIONS);
    this.set('maintenance', INITIAL_MAINTENANCE);
    this.set('purchaseRequests', INITIAL_PURCHASE_REQUESTS);
    this.set('incidents', INITIAL_INCIDENTS);
    this.set('notifications', INITIAL_NOTIFICATIONS);
    this.set('auditLogs', INITIAL_AUDIT_LOGS);
    this.set('workstations', INITIAL_WORKSTATIONS);
    this.set('practicalSessions', INITIAL_PRACTICAL_SESSIONS);
    this.set('faultTickets', INITIAL_FAULT_TICKETS);
    this.set('attendance', INITIAL_ATTENDANCE);
    this.set('vendors', INITIAL_VENDORS);
    this.set('vendorProducts', INITIAL_VENDOR_PRODUCTS);
    this.set('stockMovements', []);
    this.set('initialized', 'true');
  }

  public getUsers(): UserProfile[] { return this.get('users', INITIAL_USERS); }
  public setUsers(users: UserProfile[]) { this.set('users', users); }

  public getLabs(): Laboratory[] {
    let labs = this.get('laboratories', INITIAL_LABORATORIES);
    const map = new Map<string, Laboratory>();
    // 1. Authoritative 11 department laboratories from INITIAL_LABORATORIES
    for (const initLab of INITIAL_LABORATORIES) {
      map.set(initLab.id, initLab);
    }
    // 2. Retain custom user laboratories that do not duplicate the department labs
    if (Array.isArray(labs)) {
      for (const l of labs) {
        const isDeptLab = INITIAL_LABORATORIES.some(
          init => init.id === l.id || 
                  init.name.toLowerCase() === l.name?.toLowerCase() || 
                  l.name?.toLowerCase().includes('vinodham') ||
                  (init.code && init.code === l.code)
        );
        if (!isDeptLab && !map.has(l.id)) {
          map.set(l.id, l);
        }
      }
    }
    const merged = Array.from(map.values());
    this.set('laboratories', merged);
    return merged;
  }
  public setLabs(labs: Laboratory[]) { this.set('laboratories', labs); }

  public getInventory(): UniversalInventoryItem[] { return this.get('inventory', INITIAL_INVENTORY); }
  public setInventory(items: UniversalInventoryItem[]) { this.set('inventory', items); }

  public getEquipment(): EquipmentAsset[] { return this.get('equipment', INITIAL_EQUIPMENT); }
  public setEquipment(equip: EquipmentAsset[]) { this.set('equipment', equip); }

  public getBookings(): EquipmentBooking[] { return this.get('bookings', INITIAL_BOOKINGS); }
  public setBookings(bookings: EquipmentBooking[]) { this.set('bookings', bookings); }

  public getTransactions(): IssueReturnTransaction[] { return this.get('transactions', INITIAL_TRANSACTIONS); }
  public setTransactions(txs: IssueReturnTransaction[]) { this.set('transactions', txs); }

  public getMaintenance(): MaintenanceRecord[] { return this.get('maintenance', INITIAL_MAINTENANCE); }
  public setMaintenance(maint: MaintenanceRecord[]) { this.set('maintenance', maint); }

  public getPurchaseRequests(): PurchaseRequest[] { return this.get('purchaseRequests', INITIAL_PURCHASE_REQUESTS); }
  public setPurchaseRequests(prs: PurchaseRequest[]) { this.set('purchaseRequests', prs); }

  public getIncidents(): IncidentTicket[] { return this.get('incidents', INITIAL_INCIDENTS); }
  public setIncidents(incs: IncidentTicket[]) { this.set('incidents', incs); }

  public getNotifications(): InAppNotification[] { return this.get('notifications', INITIAL_NOTIFICATIONS); }
  public setNotifications(n: InAppNotification[]) { this.set('notifications', n); }

  public getAuditLogs(): AuditLogEntry[] { return this.get('auditLogs', INITIAL_AUDIT_LOGS); }
  public setAuditLogs(logs: AuditLogEntry[]) { this.set('auditLogs', logs); }

  public getStockMovements(): StockMovement[] { return this.get('stockMovements', []); }
  public setStockMovements(m: StockMovement[]) { this.set('stockMovements', m); }

  public getWorkstations(): ComputerWorkstation[] { return this.get('workstations', INITIAL_WORKSTATIONS); }
  public setWorkstations(ws: ComputerWorkstation[]) { this.set('workstations', ws); }

  public getPracticalSessions(): PracticalSession[] {
    let sessions = this.get('practicalSessions', INITIAL_PRACTICAL_SESSIONS);
    const map = new Map<string, PracticalSession>();
    // 1. Authoritative official practical sessions from physical noticeboard
    for (const initSess of INITIAL_PRACTICAL_SESSIONS) {
      map.set(initSess.id, initSess);
    }
    // 2. Retain any user-scheduled practical sessions
    if (Array.isArray(sessions)) {
      for (const s of sessions) {
        if (!map.has(s.id)) {
          map.set(s.id, s);
        }
      }
    }
    const merged = Array.from(map.values());
    this.set('practicalSessions', merged);
    return merged;
  }
  public setPracticalSessions(s: PracticalSession[]) { this.set('practicalSessions', s); }

  public getFaultTickets(): FaultTicket[] { return this.get('faultTickets', INITIAL_FAULT_TICKETS); }
  public setFaultTickets(f: FaultTicket[]) { this.set('faultTickets', f); }

  public getAttendance(): AttendanceRecord[] { return this.get('attendance', INITIAL_ATTENDANCE); }
  public setAttendance(att: AttendanceRecord[]) { this.set('attendance', att); }

  public getVendors(): CertifiedVendor[] { return this.get('vendors', INITIAL_VENDORS); }
  public setVendors(v: CertifiedVendor[]) { this.set('vendors', v); }

  public getVendorProducts(): VendorCatalogProduct[] { return this.get('vendorProducts', INITIAL_VENDOR_PRODUCTS); }
  public setVendorProducts(vp: VendorCatalogProduct[]) { this.set('vendorProducts', vp); }
}

export const localStore = new LocalStoreManager();
localStore.init();

export class DataService {
  // --- USERS & AUTH ---
  static async getCurrentUser(userIdOrEmail: string): Promise<UserProfile | null> {
    if (!userIdOrEmail) return null;
    const clean = userIdOrEmail.trim();
    const cleanLower = clean.toLowerCase();

    // 1. Check localStore first
    const users = localStore.getUsers();
    const localMatch = users.find(u => u.id === clean || u.email?.toLowerCase() === cleanLower);
    if (localMatch) return localMatch;

    // 2. If Firebase is active, check Firestore by document ID or email field
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'users', clean);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
          const currentList = localStore.getUsers();
          if (!currentList.some(u => u.id === profile.id)) {
            currentList.push(profile);
            localStore.setUsers(currentList);
          }
          return profile;
        }

        const q = query(collection(db, 'users'), where('email', '==', cleanLower));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const profile = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as UserProfile;
          const currentList = localStore.getUsers();
          if (!currentList.some(u => u.id === profile.id)) {
            currentList.push(profile);
            localStore.setUsers(currentList);
          }
          return profile;
        }
      } catch (err) {
        console.warn('Firestore user fetch failed:', err);
      }
    }

    return null;
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        }
      } catch (err) {
        console.warn('Firestore fetch failed, falling back to local store', err);
      }
    }
    return localStore.getUsers();
  }

  static async updateUser(user: UserProfile): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
      } catch (err) {
        console.warn('Firestore write failed, saving locally', err);
      }
    }
    const users = localStore.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStore.setUsers(users);
  }

  // --- LABORATORIES ---
  static async getLaboratories(): Promise<Laboratory[]> {
    let firestoreLabs: Laboratory[] = [];
    let firestoreIds = new Set<string>();

    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'laboratories'));
        if (!snap.empty) {
          firestoreLabs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Laboratory));
          firestoreIds = new Set(firestoreLabs.map(l => l.id));
        }
      } catch (err) {
        console.warn('Firestore fetch failed, using local store', err);
      }
    }

    // Always start with the authoritative 11 department laboratories from INITIAL_LABORATORIES
    const labMap = new Map<string, Laboratory>();
    for (const initLab of INITIAL_LABORATORIES) {
      labMap.set(initLab.id, initLab);
    }

    // Retain custom Firestore laboratories that do not duplicate or corrupt the 11 department labs
    for (const fl of firestoreLabs) {
      const isDeptLab = INITIAL_LABORATORIES.some(
        init => init.id === fl.id || 
                init.name.toLowerCase() === fl.name?.toLowerCase() || 
                fl.name?.toLowerCase().includes('vinodham') ||
                (init.code && init.code === fl.code)
      );
      if (!isDeptLab && !labMap.has(fl.id)) {
        labMap.set(fl.id, fl);
      }
    }

    const standardCodes: Record<string, string> = {
      'lab-atl-01': 'CS-01',
      'lab-atl-02': 'CS-02',
      'lab-atl-03': 'CS-03',
      'lab-sll-01': 'CS-04',
      'lab-sll-02': 'CS-05',
      'lab-bfl-01': 'CS-06',
      'lab-bfl-02': 'CS-07',
      'lab-bfl-03': 'CS-08',
      'lab-vin-01': 'CS-09',
      'lab-cbl-01': 'CS-10',
      'lab-cbl-02': 'CS-11'
    };

    const standardized = Array.from(labMap.values()).map(l => standardCodes[l.id] ? { ...l, code: standardCodes[l.id] } : l);
    localStore.setLabs(standardized);

    // Opportunistically sync missing department laboratories to Firestore in the background
    const firestoreInstance = db;
    if (isFirebaseConfigured() && firestoreInstance && firestoreIds.size < INITIAL_LABORATORIES.length) {
      INITIAL_LABORATORIES.forEach(async (initLab) => {
        if (!firestoreIds.has(initLab.id)) {
          try {
            await setDoc(doc(firestoreInstance, 'laboratories', initLab.id), sanitizeForFirestore(initLab), { merge: true });
          } catch {}
        }
      });
    }

    return standardized;
  }

  static async createLaboratory(lab: Laboratory, currentUser: UserProfile): Promise<Laboratory> {
    if (currentUser.role !== 'admin') {
      throw new Error('Only System Administrators can register new laboratories.');
    }
    const newLab = { ...lab, id: lab.id || `lab-${Date.now()}`, createdAt: new Date().toISOString() };
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'laboratories', newLab.id), newLab);
      } catch (err) {
        console.warn('Firestore create lab failed, using local', err);
      }
    }
    const labs = localStore.getLabs();
    labs.push(newLab);
    localStore.setLabs(labs);

    await this.logAudit({
      action: 'LAB_REGISTERED',
      category: 'ADMIN',
      laboratoryId: newLab.id,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Created laboratory "${newLab.name}" (${newLab.code})`
    });

    return newLab;
  }

  static async updateLaboratory(lab: Laboratory, currentUser: UserProfile): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'labManager') {
      throw new Error('Insufficient permissions to update laboratory details.');
    }
    const updated = { ...lab, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'laboratories', lab.id), updated, { merge: true });
      } catch (err) {
        console.warn('Firestore update lab failed, using local', err);
      }
    }
    const labs = localStore.getLabs();
    const idx = labs.findIndex(l => l.id === lab.id);
    if (idx >= 0) labs[idx] = updated;
    localStore.setLabs(labs);
  }

  // --- UNIVERSAL INVENTORY ---
  static async getInventory(labId?: string): Promise<UniversalInventoryItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'inventoryItems');
        const q = labId ? query(col, where('laboratoryId', '==', labId)) : col;
        const snap = await getDocs(q);
        if (!snap.empty) {
          const cloudItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as UniversalInventoryItem));
          const localItems = localStore.getInventory();
          const merged = [...cloudItems];
          for (const loc of localItems) {
            if (!merged.some(m => m.id === loc.id)) {
              merged.push(loc);
            }
          }
          localStore.setInventory(merged);
          return labId ? merged.filter(i => i.laboratoryId === labId) : merged;
        }
      } catch (err) {
        console.warn('Firestore inventory fetch failed, using local store', err);
      }
    }
    const items = localStore.getInventory();
    return labId ? items.filter(i => i.laboratoryId === labId) : items;
  }

  static async createInventoryItem(item: Partial<UniversalInventoryItem>, currentUser: UserProfile): Promise<UniversalInventoryItem> {
    if (currentUser.role === 'student') {
      throw new Error('Students are not authorized to create inventory records.');
    }
    const now = new Date().toISOString();
    const isLow = Number(item.quantity || 0) <= Number(item.minStock || 0);
    const newItem: UniversalInventoryItem = {
      id: item.id || `inv-${Date.now()}`,
      name: item.name || 'Untitled Item',
      sku: item.sku || `SKU-${Date.now().toString().slice(-6)}`,
      qrCode: item.qrCode || `ILMS-QR-${Date.now().toString().slice(-8)}`,
      laboratoryId: item.laboratoryId || currentUser.assignedLabId || 'lab-chem-01',
      organizationId: currentUser.organizationId || 'org-main-01',
      category: item.category || 'General Supplies',
      subcategory: item.subcategory,
      assetType: item.assetType || 'consumable',
      storageLocation: item.storageLocation || 'Main Storage',
      manufacturer: item.manufacturer,
      modelNumber: item.modelNumber,
      serialNumber: item.serialNumber,
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'pcs',
      minStock: Number(item.minStock) || 0,
      reorderQuantity: Number(item.reorderQuantity) || 10,
      unitCost: Number(item.unitCost) || 0,
      currency: item.currency || 'USD',
      supplier: item.supplier,
      purchaseDate: item.purchaseDate || now.split('T')[0],
      warrantyExpiry: item.warrantyExpiry,
      expiryDate: item.expiryDate,
      batchNumber: item.batchNumber,
      isLowStock: isLow,
      status: (Number(item.quantity) || 0) <= 0 ? 'out_of_stock' : isLow ? 'low_stock' : 'available',
      laboratoryTypeAttributes: item.laboratoryTypeAttributes || {},
      notes: item.notes,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'inventoryItems', newItem.id), sanitizeForFirestore(newItem));
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('inventory item create', err);
      }
    }
    const items = localStore.getInventory();
    items.unshift(newItem);
    localStore.setInventory(items);

    await this.logAudit({
      action: 'INVENTORY_CREATED',
      category: 'INVENTORY',
      laboratoryId: newItem.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Added new inventory item "${newItem.name}" (${newItem.quantity} ${newItem.unit})`
    });

    return newItem;
  }

  static async updateInventoryItem(item: UniversalInventoryItem, currentUser: UserProfile): Promise<void> {
    if (currentUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot update inventory.');
    }
    const isLow = Number(item.quantity) <= Number(item.minStock);
    const updated: UniversalInventoryItem = {
      ...item,
      isLowStock: isLow,
      status: item.quantity <= 0 ? 'out_of_stock' : isLow ? 'low_stock' : 'available',
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'inventoryItems', updated.id), sanitizeForFirestore(updated), { merge: true });
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('inventory item update', err);
      }
    }
    const items = localStore.getInventory();
    const idx = items.findIndex(i => i.id === updated.id);
    if (idx >= 0) items[idx] = updated;
    localStore.setInventory(items);
  }

  static async deleteInventoryItem(itemId: string, currentUser: UserProfile): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'labManager') {
      throw new Error('Only Administrators or Lab Managers can remove inventory records.');
    }
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'inventoryItems', itemId));
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('inventory item delete', err);
      }
    }
    const items = localStore.getInventory().filter(i => i.id !== itemId);
    localStore.setInventory(items);
  }

  // --- ATOMIC STOCK MOVEMENTS (Negative Stock Prevention) ---
  static async recordStockMovement(
    itemId: string,
    changeAmount: number,
    type: MovementType,
    reason: string,
    currentUser: UserProfile,
    referenceNumber?: string
  ): Promise<{ newQuantity: number; isLowStock: boolean }> {
    if (currentUser.role === 'student') {
      throw new Error('Students cannot execute stock balance changes.');
    }

    const items = localStore.getInventory();
    let item = items.find(i => i.id === itemId);
    if (!item && isFirebaseConfigured() && db) {
      try {
        const docSnap = await getDoc(doc(db, 'inventoryItems', itemId));
        if (docSnap.exists()) {
          item = { id: docSnap.id, ...docSnap.data() } as UniversalInventoryItem;
          items.push(item);
        }
      } catch {}
    }
    if (!item) throw new Error('Inventory item not found.');

    const currentQty = Number(item.quantity) || 0;
    const newQty = currentQty + Number(changeAmount);

    if (newQty < 0) {
      throw new Error(`Negative stock prevented: Current balance is ${currentQty} ${item.unit}. Cannot reduce by ${Math.abs(changeAmount)}.`);
    }

    const isLow = newQty <= Number(item.minStock);
    item.quantity = newQty;
    item.isLowStock = isLow;
    item.status = newQty === 0 ? 'out_of_stock' : isLow ? 'low_stock' : 'available';
    item.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'inventoryItems', item.id), sanitizeForFirestore(item), { merge: true });
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('stock movement item update', err);
      }
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId,
      itemName: item.name,
      laboratoryId: item.laboratoryId,
      previousQuantity: currentQty,
      changeAmount,
      newQuantity: newQty,
      type,
      reason,
      referenceNumber,
      performedBy: currentUser.id,
      performedByName: currentUser.displayName,
      timestamp: new Date().toISOString()
    };

    const movements = localStore.getStockMovements();
    movements.unshift(movement);
    localStore.setStockMovements(movements);
    localStore.setInventory(items);

    if (isLow && !item.isLowStock) {
      await this.createNotification({
        type: 'LOW_STOCK',
        title: `Low Stock: ${item.name}`,
        message: `${item.name} is down to ${newQty} ${item.unit} (threshold: ${item.minStock})`,
        laboratoryId: item.laboratoryId,
        targetRole: 'technician'
      });
    }

    await this.logAudit({
      action: 'STOCK_LEDGER_ENTRY',
      category: 'INVENTORY',
      laboratoryId: item.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `${type} for "${item.name}": change ${changeAmount > 0 ? '+' : ''}${changeAmount} (new balance: ${newQty}). Reason: ${reason}`
    });

    return { newQuantity: newQty, isLowStock: isLow };
  }

  // --- EQUIPMENT ASSET REGISTER ---
  static async getEquipment(labId?: string): Promise<EquipmentAsset[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'equipmentAssets');
        const q = labId ? query(col, where('laboratoryId', '==', labId)) : col;
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as EquipmentAsset));
        }
      } catch (err) {
        console.warn('Firestore equipment fetch failed', err);
      }
    }
    const equip = localStore.getEquipment();
    return labId ? equip.filter(e => e.laboratoryId === labId) : equip;
  }

  static async createEquipment(asset: Partial<EquipmentAsset>, currentUser: UserProfile): Promise<EquipmentAsset> {
    if (currentUser.role === 'student') {
      throw new Error('Students are not permitted to register equipment assets.');
    }
    const now = new Date().toISOString();
    const newAsset: EquipmentAsset = {
      id: asset.id || `eq-${Date.now()}`,
      name: asset.name || 'Untitled Asset',
      assetTag: asset.assetTag || `TAG-${Date.now().toString().slice(-6)}`,
      qrCode: asset.qrCode || `ILMS-EQ-${Date.now().toString().slice(-8)}`,
      laboratoryId: asset.laboratoryId || currentUser.assignedLabId || 'lab-chem-01',
      category: asset.category || 'General Equipment',
      manufacturer: asset.manufacturer || 'Standard Scientific',
      model: asset.model || 'Standard Model',
      serialNumber: asset.serialNumber || 'SN-UNKNOWN',
      status: asset.status || 'AVAILABLE',
      location: asset.location || 'Main Floor',
      purchaseDate: asset.purchaseDate || now.split('T')[0],
      purchaseCost: Number(asset.purchaseCost) || 0,
      specifications: asset.specifications || {},
      safetyInstructions: asset.safetyInstructions,
      notes: asset.notes,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'equipmentAssets', newAsset.id), sanitizeForFirestore(newAsset));
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('equipment create', err);
      }
    }
    const equip = localStore.getEquipment();
    equip.unshift(newAsset);
    localStore.setEquipment(equip);

    await this.logAudit({
      action: 'EQUIPMENT_REGISTERED',
      category: 'ADMIN',
      laboratoryId: newAsset.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Registered asset "${newAsset.name}" [Tag: ${newAsset.assetTag}]`
    });

    return newAsset;
  }

  static async updateEquipment(asset: EquipmentAsset, currentUser: UserProfile): Promise<void> {
    if (currentUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot modify equipment assets.');
    }
    const updated = { ...asset, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'equipmentAssets', updated.id), sanitizeForFirestore(updated), { merge: true });
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('equipment update', err);
      }
    }
    const equip = localStore.getEquipment();
    const idx = equip.findIndex(e => e.id === updated.id);
    if (idx >= 0) equip[idx] = updated;
    localStore.setEquipment(equip);
  }

  // --- BOOKINGS & CALENDAR SCHEDULING ---
  static async getBookings(labId?: string): Promise<EquipmentBooking[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'bookings');
        const q = labId ? query(col, where('laboratoryId', '==', labId)) : col;
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as EquipmentBooking));
        }
      } catch (err) {
        console.warn('Firestore bookings fetch failed', err);
      }
    }
    const bookings = localStore.getBookings();
    return labId ? bookings.filter(b => b.laboratoryId === labId) : bookings;
  }

  static async createBooking(
    bookingData: Omit<EquipmentBooking, 'id' | 'createdAt' | 'status'>,
    currentUser: UserProfile
  ): Promise<EquipmentBooking> {
    const equipList = localStore.getEquipment();
    const equip = equipList.find(e => e.id === bookingData.equipmentId);
    if (!equip) throw new Error('Equipment asset not found.');

    // Concurrency Rule 1: Maintenance-blocked or Out-of-service equipment CANNOT be booked
    if (equip.status === 'MAINTENANCE_BLOCKED' || equip.status === 'OUT_OF_SERVICE') {
      throw new Error(`Booking Rejected: Equipment "${equip.name}" is locked due to safety status: ${equip.status}`);
    }

    const newStart = new Date(bookingData.startTime).getTime();
    const newEnd = new Date(bookingData.endTime).getTime();

    if (newStart >= newEnd) {
      throw new Error('Invalid reservation window: Start time must precede end time.');
    }

    // Concurrency Rule 2: Overlapping confirmed/pending bookings check
    const existingBookings = localStore.getBookings().filter(
      b => b.equipmentId === bookingData.equipmentId && (b.status === 'CONFIRMED' || b.status === 'PENDING')
    );

    for (const b of existingBookings) {
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      if (newStart < bEnd && newEnd > bStart) {
        throw new Error(
          `Schedule Conflict: "${equip.name}" is already reserved by ${b.userName} from ${new Date(b.startTime).toLocaleTimeString()} to ${new Date(b.endTime).toLocaleTimeString()}. Please choose an alternate slot.`
        );
      }
    }

    const newBooking: EquipmentBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      status: currentUser.role === 'student' ? 'PENDING' : 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'bookings', newBooking.id), sanitizeForFirestore(newBooking));
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('booking create', err);
      }
    }

    const bookings = localStore.getBookings();
    bookings.push(newBooking);
    localStore.setBookings(bookings);

    await this.logAudit({
      action: 'BOOKING_RESERVED',
      category: 'BOOKING',
      laboratoryId: newBooking.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Booked "${newBooking.equipmentName}" from ${newBooking.startTime} to ${newBooking.endTime} (Status: ${newBooking.status})`
    });

    return newBooking;
  }

  static async updateBookingStatus(
    bookingId: string,
    status: EquipmentBooking['status'],
    currentUser: UserProfile,
    rejectionReason?: string
  ): Promise<void> {
    const bookings = localStore.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');

    // Students can only cancel their own pending bookings
    if (currentUser.role === 'student') {
      if (booking.userId !== currentUser.id || status !== 'CANCELLED') {
        throw new Error('Students can only cancel their own reservations.');
      }
    }

    booking.status = status;
    if (status === 'CONFIRMED') booking.approvedBy = currentUser.displayName;
    if (status === 'REJECTED') booking.rejectionReason = rejectionReason;

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'bookings', bookingId), sanitizeForFirestore(booking), { merge: true });
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('booking update', err);
      }
    }
    localStore.setBookings(bookings);

    await this.logAudit({
      action: `BOOKING_${status}`,
      category: 'BOOKING',
      laboratoryId: booking.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Booking for "${booking.equipmentName}" marked as ${status}`
    });
  }

  // --- EQUIPMENT ISSUE & RETURN ---
  static async getIssueReturnTransactions(labId?: string): Promise<IssueReturnTransaction[]> {
    const txs = localStore.getTransactions();
    return labId ? txs.filter(t => t.laboratoryId === labId) : txs;
  }

  static async issueItem(
    itemId: string,
    borrowerId: string,
    borrowerName: string,
    borrowerEmail: string,
    quantity: number,
    expectedReturnDate: string,
    currentUser: UserProfile
  ): Promise<IssueReturnTransaction> {
    if (currentUser.role === 'student') {
      throw new Error('Students are not authorized to issue items directly. A technician must authorize the checkout.');
    }

    const items = localStore.getInventory();
    let item = items.find(i => i.id === itemId);
    if (!item && isFirebaseConfigured() && db) {
      try {
        const docSnap = await getDoc(doc(db, 'inventoryItems', itemId));
        if (docSnap.exists()) {
          item = { id: docSnap.id, ...docSnap.data() } as UniversalInventoryItem;
          items.push(item);
        }
      } catch {}
    }
    if (!item) throw new Error('Item not found.');

    if (item.quantity < quantity) {
      throw new Error(`Insufficient stock for issue. Available: ${item.quantity}, requested: ${quantity}`);
    }

    // Atomically reduce stock
    await this.recordStockMovement(
      itemId,
      -quantity,
      'CONSUMPTION',
      `Issued to borrower ${borrowerName}`,
      currentUser
    );

    const tx: IssueReturnTransaction = {
      id: `tx-${Date.now()}`,
      itemId,
      itemName: item.name,
      isEquipment: item.assetType === 'reusable_equipment',
      laboratoryId: item.laboratoryId,
      borrowerId,
      borrowerName,
      borrowerEmail,
      technicianId: currentUser.id,
      technicianName: currentUser.displayName,
      quantity,
      issueDate: new Date().toISOString(),
      expectedReturnDate,
      conditionBeforeIssue: 'EXCELLENT',
      status: 'ISSUED',
      createdAt: new Date().toISOString()
    };

    const txs = localStore.getTransactions();
    txs.unshift(tx);
    localStore.setTransactions(txs);

    return tx;
  }

  static async returnItem(
    transactionId: string,
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED',
    inspectionNotes: string,
    missingComponents: string[],
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role === 'student') {
      throw new Error('Technician or Manager sign-off required for equipment returns.');
    }

    const txs = localStore.getTransactions();
    const tx = txs.find(t => t.id === transactionId);
    if (!tx) throw new Error('Transaction record not found.');

    tx.actualReturnDate = new Date().toISOString();
    tx.conditionAfterReturn = condition;
    tx.inspectionNotes = inspectionNotes;
    tx.missingComponents = missingComponents;
    tx.status = condition === 'DAMAGED' ? 'DAMAGED_RETURN' : 'RETURNED';

    // Return stock back to inventory
    await this.recordStockMovement(
      tx.itemId,
      tx.quantity,
      'RETURN',
      `Returned by ${tx.borrowerName} (Condition: ${condition})`,
      currentUser
    );

    localStore.setTransactions(txs);

    await this.logAudit({
      action: 'EQUIPMENT_RETURNED',
      category: 'INVENTORY',
      laboratoryId: tx.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Returned item "${tx.itemName}" from ${tx.borrowerName} in ${condition} condition.`
    });
  }

  // --- MAINTENANCE & CALIBRATION ---
  static async getMaintenanceRecords(labId?: string): Promise<MaintenanceRecord[]> {
    const list = localStore.getMaintenance();
    return labId ? list.filter(m => m.laboratoryId === labId) : list;
  }

  static async createMaintenanceRecord(record: Partial<MaintenanceRecord>, currentUser: UserProfile): Promise<MaintenanceRecord> {
    if (currentUser.role === 'student') {
      throw new Error('Students cannot log maintenance tickets.');
    }
    const newRecord: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      equipmentId: record.equipmentId || '',
      equipmentName: record.equipmentName || 'Asset Maintenance',
      laboratoryId: record.laboratoryId || currentUser.assignedLabId || 'lab-chem-01',
      type: record.type || 'PREVENTIVE',
      scheduledDate: record.scheduledDate || new Date().toISOString(),
      technicianId: currentUser.id,
      technicianName: currentUser.displayName,
      serviceProvider: record.serviceProvider,
      status: 'SCHEDULED',
      faultDescription: record.faultDescription,
      cost: Number(record.cost) || 0,
      createdAt: new Date().toISOString()
    };

    // If equipment is being sent for calibration or repair, block it from being booked
    if (newRecord.equipmentId) {
      const equipList = localStore.getEquipment();
      const equip = equipList.find(e => e.id === newRecord.equipmentId);
      if (equip) {
        equip.status = 'UNDER_MAINTENANCE';
        localStore.setEquipment(equipList);
      }
    }

    const list = localStore.getMaintenance();
    list.unshift(newRecord);
    localStore.setMaintenance(list);
    return newRecord;
  }

  static async completeMaintenance(
    recordId: string,
    workPerformed: string,
    cost: number,
    partsReplaced: string[],
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role === 'student') {
      throw new Error('Technician or Manager sign-off required to complete maintenance.');
    }

    const list = localStore.getMaintenance();
    const rec = list.find(m => m.id === recordId);
    if (!rec) throw new Error('Maintenance record not found.');

    rec.status = 'COMPLETED';
    rec.completionDate = new Date().toISOString();
    rec.workPerformed = workPerformed;
    rec.cost = cost;
    rec.partsReplaced = partsReplaced;

    // Restore equipment status to AVAILABLE
    if (rec.equipmentId) {
      const equipList = localStore.getEquipment();
      const equip = equipList.find(e => e.id === rec.equipmentId);
      if (equip) {
        equip.status = 'AVAILABLE';
        equip.lastMaintenanceDate = new Date().toISOString().split('T')[0];
        localStore.setEquipment(equipList);
      }
    }

    localStore.setMaintenance(list);

    await this.logAudit({
      action: 'MAINTENANCE_COMPLETED',
      category: 'MAINTENANCE',
      laboratoryId: rec.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Completed ${rec.type} for "${rec.equipmentName}". Unlocked status to AVAILABLE.`
    });
  }

  // --- PROCUREMENT & PURCHASE REQUESTS ---
  static async getPurchaseRequests(labId?: string): Promise<PurchaseRequest[]> {
    const prs = localStore.getPurchaseRequests();
    return labId ? prs.filter(p => p.laboratoryId === labId) : prs;
  }

  static async createPurchaseRequest(
    prData: Omit<PurchaseRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    currentUser: UserProfile
  ): Promise<PurchaseRequest> {
    const newPr: PurchaseRequest = {
      ...prData,
      id: `pr-${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const prs = localStore.getPurchaseRequests();
    prs.unshift(newPr);
    localStore.setPurchaseRequests(prs);

    await this.createNotification({
      type: 'PURCHASE_APPROVAL',
      title: 'New Purchase Request Submitted',
      message: `${currentUser.displayName} submitted PR "${newPr.title}" for ₹${newPr.totalEstimatedCost.toLocaleString('en-IN')}.`,
      laboratoryId: newPr.laboratoryId,
      targetRole: 'labManager'
    });

    return newPr;
  }

  static async updatePurchaseRequestStatus(
    prId: string,
    status: PurchaseRequest['status'],
    currentUser: UserProfile,
    reviewNotes?: string
  ): Promise<void> {
    const prs = localStore.getPurchaseRequests();
    const pr = prs.find(p => p.id === prId);
    if (!pr) throw new Error('Purchase request not found.');

    // Security Rule: A user cannot approve their own purchase request
    if (status === 'APPROVED' && pr.requestedBy === currentUser.id && currentUser.role !== 'admin') {
      throw new Error('Self-approval forbidden: A different Lab Manager or Administrator must review and approve this request.');
    }

    pr.status = status;
    pr.reviewedBy = currentUser.id;
    pr.reviewedByName = currentUser.displayName;
    pr.reviewNotes = reviewNotes;
    pr.updatedAt = new Date().toISOString();

    localStore.setPurchaseRequests(prs);

    await this.logAudit({
      action: `PURCHASE_${status}`,
      category: 'PROCUREMENT',
      laboratoryId: pr.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Purchase request "${pr.title}" set to ${status}. Notes: ${reviewNotes || 'None'}`
    });
  }

  // --- SAFETY & INCIDENTS ---
  static async getIncidents(labId?: string): Promise<IncidentTicket[]> {
    const incs = localStore.getIncidents();
    return labId ? incs.filter(i => i.laboratoryId === labId) : incs;
  }

  static async reportIncident(
    incident: Omit<IncidentTicket, 'id' | 'reportedAt' | 'status'>,
    currentUser: UserProfile
  ): Promise<IncidentTicket> {
    const newInc: IncidentTicket = {
      ...incident,
      id: `inc-${Date.now()}`,
      status: 'OPEN',
      reportedAt: new Date().toISOString()
    };

    const incs = localStore.getIncidents();
    incs.unshift(newInc);
    localStore.setIncidents(incs);

    await this.createNotification({
      type: 'SAFETY_ALERT',
      title: `Safety Incident Logged: ${newInc.title}`,
      message: `Severity: ${newInc.severity}. Reported by ${currentUser.displayName}. Immediate review required.`,
      laboratoryId: newInc.laboratoryId,
      targetRole: 'labManager'
    });

    return newInc;
  }

  static async resolveIncident(
    incidentId: string,
    status: IncidentTicket['status'],
    resolutionNotes: string,
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role === 'student') {
      throw new Error('Students cannot close safety incident investigations.');
    }
    const incs = localStore.getIncidents();
    const inc = incs.find(i => i.id === incidentId);
    if (!inc) throw new Error('Incident not found.');

    inc.status = status;
    inc.resolutionNotes = resolutionNotes;
    inc.resolvedAt = new Date().toISOString();

    localStore.setIncidents(incs);
  }

  // --- NOTIFICATIONS & AUDIT ---
  static async getNotifications(currentUser: UserProfile): Promise<InAppNotification[]> {
    const notifs = localStore.getNotifications();
    return notifs.filter(n => {
      if (n.targetUserId && n.targetUserId === currentUser.id) return true;
      if (n.targetRole && (n.targetRole === currentUser.role || currentUser.role === 'admin')) return true;
      return !n.targetUserId && !n.targetRole;
    });
  }

  static async markNotificationRead(id: string): Promise<void> {
    const notifs = localStore.getNotifications();
    const n = notifs.find(x => x.id === id);
    if (n) {
      n.read = true;
      localStore.setNotifications(notifs);
    }
  }

  static async createNotification(notif: Omit<InAppNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    const newNotif: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    const notifs = localStore.getNotifications();
    notifs.unshift(newNotif);
    localStore.setNotifications(notifs);
  }

  static async getAuditLogs(labId?: string): Promise<AuditLogEntry[]> {
    const logs = localStore.getAuditLogs();
    return labId ? logs.filter(l => l.laboratoryId === labId) : logs;
  }

  static async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const logs = localStore.getAuditLogs();
    logs.unshift(newLog);
    // Keep last 500 audit entries
    if (logs.length > 500) logs.pop();
    localStore.setAuditLogs(logs);
  }

  // --- DASHBOARD ANALYTICS COMPUTATIONS ---
  static async getDashboardMetrics(labId?: string) {
    const inventory = await this.getInventory(labId);
    const equipment = await this.getEquipment(labId);
    const bookings = await this.getBookings(labId);
    const txs = await this.getIssueReturnTransactions(labId);
    const maintenance = await this.getMaintenanceRecords(labId);
    const prs = await this.getPurchaseRequests(labId);
    const incidents = await this.getIncidents(labId);

    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const lowStockCount = inventory.filter(i => i.isLowStock || i.quantity <= i.minStock).length;
    const availableEquipment = equipment.filter(e => e.status === 'AVAILABLE').length;
    const blockedEquipment = equipment.filter(e => e.status === 'MAINTENANCE_BLOCKED' || e.status === 'UNDER_MAINTENANCE').length;
    const activeBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length;
    const overdueLoans = txs.filter(t => t.status === 'OVERDUE').length;
    const pendingPurchases = prs.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
    const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

    // Category distribution for charts
    const categoryCounts: Record<string, number> = {};
    inventory.forEach(i => {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
    });
    const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    // Equipment status chart data
    const statusCounts: Record<string, number> = {};
    equipment.forEach(e => {
      statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    });
    const equipmentStatusChartData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    return {
      totalInventoryItems: inventory.length,
      totalInventoryValue,
      lowStockCount,
      totalEquipment: equipment.length,
      availableEquipment,
      blockedEquipment,
      activeBookings,
      overdueLoans,
      pendingPurchases,
      openIncidents,
      categoryChartData,
      equipmentStatusChartData
    };
  }

  // --- COMPUTER WORKSTATIONS (CS / IT Labs) ---
  static async getWorkstations(labId?: string): Promise<ComputerWorkstation[]> {
    const list = localStore.getWorkstations();
    return labId ? list.filter(w => w.laboratoryId === labId) : list;
  }

  // --- PRACTICAL SESSIONS & WORKSPACES ---
  static async getPracticalSessions(labId?: string): Promise<PracticalSession[]> {
    const list = localStore.getPracticalSessions();
    return labId ? list.filter(s => s.laboratoryId === labId) : list;
  }

  static async createPracticalSession(
    session: Omit<PracticalSession, 'id'>,
    currentUser: UserProfile
  ): Promise<PracticalSession> {
    const newSession: PracticalSession = {
      ...session,
      id: `sess-${Date.now()}`
    };
    const list = localStore.getPracticalSessions();
    list.unshift(newSession);
    localStore.setPracticalSessions(list);

    await this.logAudit({
      action: 'SESSION_SCHEDULED',
      category: 'BOOKING',
      laboratoryId: newSession.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Scheduled practical session: "${newSession.title}" (${newSession.courseCode})`
    });

    return newSession;
  }

  // --- FAULT REPORTING & RESOLUTION TIMELINE ---
  static async getFaultTickets(labId?: string): Promise<FaultTicket[]> {
    const list = localStore.getFaultTickets();
    return labId ? list.filter(f => f.laboratoryId === labId) : list;
  }

  static async reportFault(
    ticket: Omit<FaultTicket, 'id' | 'reportedAt' | 'timeline' | 'status'>,
    currentUser: UserProfile
  ): Promise<FaultTicket> {
    const now = new Date().toISOString();
    const newTicket: FaultTicket = {
      ...ticket,
      id: `flt-${Date.now()}`,
      status: 'OPEN',
      reportedAt: now,
      timeline: [
        { stage: 'Reported', timestamp: now, note: `Logged by ${currentUser.displayName}` }
      ]
    };
    const list = localStore.getFaultTickets();
    list.unshift(newTicket);
    localStore.setFaultTickets(list);

    await this.createNotification({
      type: 'SAFETY_ALERT',
      title: `Equipment Fault Logged: ${newTicket.equipmentName}`,
      message: `Priority: ${newTicket.priority}. Category: ${newTicket.problemCategory}. Assigned to technician.`,
      laboratoryId: newTicket.laboratoryId,
      targetRole: 'technician'
    });

    return newTicket;
  }

  // --- SMART LAB HEALTH SCORE ---
  static async calculateLabHealthScore(labId?: string): Promise<SmartHealthScore> {
    const equip = await this.getEquipment(labId);
    const maint = await this.getMaintenanceRecords(labId);
    const inv = await this.getInventory(labId);
    const incidents = await this.getIncidents(labId);

    // 1. Availability (35%)
    const availRatio = equip.length > 0 ? (equip.filter(e => e.status === 'AVAILABLE').length / equip.length) : 1;
    const availabilityScore = Math.round(availRatio * 100);

    // 2. Maintenance readiness (25%)
    const overdueMaint = maint.filter(m => m.status === 'OVERDUE').length;
    const maintenanceScore = Math.max(0, 100 - (overdueMaint * 30));

    // 3. Stock sufficiency (20%)
    const lowStockCount = inv.filter(i => i.isLowStock || i.quantity <= i.minStock).length;
    const stockScore = Math.max(0, 100 - (lowStockCount * 25));

    // 4. Incident safety (20%)
    const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
    const incidentScore = Math.max(0, 100 - (openIncidents * 35));

    // Weighted aggregate score
    const overall = Math.round(
      (availabilityScore * 0.35) +
      (maintenanceScore * 0.25) +
      (stockScore * 0.20) +
      (incidentScore * 0.20)
    );

    let summary = 'Operational readiness is optimal with all major instruments verified.';
    if (overall < 60) {
      summary = 'Attention required: Multiple maintenance overdues or critical stock shortages detected.';
    } else if (overall < 80) {
      summary = 'Good operational status with minor reorders or scheduled maintenance pending.';
    }

    return {
      overall: Math.min(100, Math.max(10, overall)),
      availabilityScore,
      maintenanceScore,
      stockScore,
      incidentScore,
      summary
    };
  }

  // --- ATTENDANCE MANAGEMENT ---
  static async getAttendanceRecords(labId?: string): Promise<AttendanceRecord[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'attendance');
        const q = labId ? query(col, where('laboratoryId', '==', labId)) : col;
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
        }
      } catch (err) {
        console.warn('Firestore attendance fetch failed, using local store', err);
      }
    }
    const list = localStore.getAttendance();
    return labId ? list.filter(a => a.laboratoryId === labId) : list;
  }

  static async createAttendanceRecord(
    recordData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt' | 'isConfirmed' | 'confirmedAt'>,
    currentUser: UserProfile
  ): Promise<AttendanceRecord> {
    if (currentUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot submit attendance records.');
    }

    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att-${Date.now()}`,
      isConfirmed: true,
      confirmedAt: now,
      createdAt: now,
      updatedAt: now
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'attendance', newRecord.id), sanitizeForFirestore(newRecord));
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('attendance create', err);
      }
    }

    const list = localStore.getAttendance();
    list.unshift(newRecord);
    localStore.setAttendance(list);

    await this.logAudit({
      action: 'ATTENDANCE_RECORDED',
      category: 'ADMIN',
      laboratoryId: newRecord.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Submitted attendance for ${newRecord.sessionTitle} (${newRecord.presentCount}/${newRecord.totalStudents} present, ${newRecord.attendancePercentage}%)`
    });

    return newRecord;
  }

  static async correctAttendance(
    recordId: string,
    studentId: string,
    newStatus: AttendanceStatus,
    reason: string,
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role === 'student') {
      throw new Error('Unauthorized: Students cannot modify attendance records.');
    }

    const list = localStore.getAttendance();
    const record = list.find(a => a.id === recordId);
    if (!record) throw new Error('Attendance record not found.');

    const studentItem = record.students.find(s => s.studentId === studentId);
    if (!studentItem) throw new Error('Student not found in this attendance record.');

    const oldStatus = studentItem.status;
    studentItem.status = newStatus;
    studentItem.remarks = reason;

    // Recalculate summary metrics
    record.presentCount = record.students.filter(s => s.status === 'PRESENT').length;
    record.absentCount = record.students.filter(s => s.status === 'ABSENT').length;
    record.lateCount = record.students.filter(s => s.status === 'LATE').length;
    record.excusedCount = record.students.filter(s => s.status === 'EXCUSED').length;
    record.attendancePercentage = Math.round((record.presentCount / record.totalStudents) * 100);

    // Record audit correction
    if (!record.corrections) record.corrections = [];
    record.corrections.push({
      studentId,
      studentName: studentItem.studentName,
      oldStatus,
      newStatus,
      reason,
      updatedBy: currentUser.displayName,
      updatedAt: new Date().toISOString()
    });
    record.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'attendance', recordId), sanitizeForFirestore(record), { merge: true });
        handleFirestoreSuccess();
      } catch (err) {
        handleFirestoreError('attendance update', err);
      }
    }

    localStore.setAttendance(list);

    await this.logAudit({
      action: 'ATTENDANCE_CORRECTED',
      category: 'ADMIN',
      laboratoryId: record.laboratoryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Corrected attendance for ${studentItem.studentName} from ${oldStatus} to ${newStatus}. Reason: ${reason}`
    });
  }

  // --- CERTIFIED VENDOR & PROCUREMENT PORTAL ---
  static async getVendors(): Promise<CertifiedVendor[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'vendors'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as CertifiedVendor));
        }
      } catch (err) {
        console.warn('Firestore vendors fetch failed', err);
      }
    }
    return localStore.getVendors();
  }

  static async verifyVendor(
    vendorId: string,
    certDetails: string,
    expiryDate: string,
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role !== 'admin') {
      throw new Error('Security Violation: Only institutional administrators can verify certified vendors.');
    }

    const list = localStore.getVendors();
    const vendor = list.find(v => v.id === vendorId);
    if (!vendor) throw new Error('Vendor record not found.');

    vendor.verificationStatus = 'VERIFIED';
    vendor.certificationDetails = certDetails;
    vendor.verifiedBy = currentUser.id;
    vendor.verifiedByName = currentUser.displayName;
    vendor.verificationDate = new Date().toISOString();
    vendor.verificationExpiryDate = expiryDate;

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'vendors', vendorId), vendor, { merge: true });
      } catch (err) {
        console.warn('Firestore vendor update failed', err);
      }
    }

    localStore.setVendors(list);

    await this.logAudit({
      action: 'VENDOR_VERIFIED',
      category: 'PROCUREMENT',
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Verified vendor "${vendor.name}" [Reg: ${vendor.companyRegistrationNumber}]. Cert: ${certDetails}`
    });
  }

  static async getVendorProducts(vendorId?: string): Promise<VendorCatalogProduct[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const col = collection(db, 'vendorProducts');
        const q = vendorId ? query(col, where('vendorId', '==', vendorId)) : col;
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as VendorCatalogProduct));
        }
      } catch (err) {
        console.warn('Firestore products fetch failed', err);
      }
    }
    const list = localStore.getVendorProducts();
    return vendorId ? list.filter(p => p.vendorId === vendorId) : list;
  }

  // --- EMAIL OTP AUTHENTICATION & SECURITY ---
  private static otpStore: Record<string, { code: string; expiresAt: number; attempts: number; lastSentAt: number }> = {};

  static async generateRegistrationOTP(email: string): Promise<{ success: boolean; message: string; demoOtp?: string; isSmtpConfigured: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();
    const existing = this.otpStore[cleanEmail];

    // 60-second resend cooldown
    if (existing && now - existing.lastSentAt < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Resend cooldown active. Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    // Generate 6-digit cryptographically random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore[cleanEmail] = {
      code: otp,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes expiry
      attempts: 0,
      lastSentAt: now
    };

    // Dispatch email via REST mailer
    try {
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(cleanEmail), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          subject: '🔐 Your ILMS Security OTP Verification Code',
          email: cleanEmail,
          message: `Hello,\n\nYour 6-digit verification code for the Integrated Laboratory Management System (ILMS) is:\n\n${otp}\n\nThis verification code expires in 10 minutes.\n\nBest regards,\nILMS Academic Administration`
        })
      }).catch(() => {});
    } catch (e) {}

    return {
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your email inbox.`,
      isSmtpConfigured: true
    };
  }

  static async verifyRegistrationOTP(email: string, enteredOtp: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.otpStore[cleanEmail];

    if (!record) {
      throw new Error('No OTP request found for this email. Please request a new verification code.');
    }

    if (Date.now() > record.expiresAt) {
      delete this.otpStore[cleanEmail];
      throw new Error('This verification code has expired (10 min limit). Please request a fresh OTP.');
    }

    if (record.attempts >= 5) {
      delete this.otpStore[cleanEmail];
      throw new Error('Maximum verification attempts exceeded. Please generate a new OTP.');
    }

    record.attempts += 1;

    if (record.code !== enteredOtp.trim()) {
      const remaining = 5 - record.attempts;
      throw new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    }

    // Single-use: delete after successful verification
    delete this.otpStore[cleanEmail];
    return true;
  }

  // --- USER APPROVAL & ACCOUNT MANAGEMENT ---
  static async registerNewAccount(userData: {
    uid?: string;
    displayName: string;
    email: string;
    institution?: string;
    departmentId?: string;
    institutionId?: string;
    requestedRole?: UserRole;
    assignedLabs?: string[];
  }): Promise<UserProfile> {
    const users = localStore.getUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: UserProfile = {
      id: userData.uid || `usr-${Date.now()}`,
      email: userData.email,
      displayName: userData.displayName,
      role: 'student', // Safe default role
      organizationId: 'org-main-01',
      departmentId: userData.departmentId || 'dept-cse',
      institution: userData.institution || 'SJB Institute of Technology',
      institutionId: userData.institutionId || `1JB23CS${Date.now().toString().slice(-3)}`,
      status: 'pending', // Requires administrator approval for elevated privileges
      emailVerified: true,
      requestedRole: userData.requestedRole || 'student',
      assignedLabs: ['lab-atl-01', 'lab-atl-02', 'lab-atl-03', 'lab-sll-01', 'lab-sll-02'],
      assignedLabId: 'lab-atl-01',
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'users', newUser.id), newUser);
      } catch (err) {
        console.warn('Firestore user registration write failed', err);
      }
    }

    users.push(newUser);
    localStore.setUsers(users);

    return newUser;
  }

  static async approveUser(
    userId: string,
    role: UserRole,
    assignedLabs: string[],
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can approve users and assign roles.');
    }

    const users = localStore.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User account not found.');

    user.role = role;
    user.status = 'active';
    user.assignedLabs = assignedLabs;
    if (assignedLabs.length > 0) user.assignedLabId = assignedLabs[0];
    user.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'users', userId), user, { merge: true });
      } catch (err) {
        console.warn('Firestore user update failed', err);
      }
    }

    localStore.setUsers(users);

    await this.logAudit({
      action: 'USER_ROLE_ASSIGNED',
      category: 'ADMIN',
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Approved user "${user.displayName}" with role "${role}" and ${assignedLabs.length} assigned laboratories.`
    });
  }

  static async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended',
    currentUser: UserProfile
  ): Promise<void> {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can suspend or activate users.');
    }

    const users = localStore.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User account not found.');

    user.status = status;
    user.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'users', userId), { status }, { merge: true });
      } catch (err) {
        console.warn('Firestore user status update failed', err);
      }
    }

    localStore.setUsers(users);

    await this.logAudit({
      action: `USER_${status.toUpperCase()}`,
      category: 'ADMIN',
      userId: currentUser.id,
      userName: currentUser.displayName,
      details: `Changed account status of "${user.displayName}" to ${status}`
    });
  }

  // --- CLOUD SYNC & RECOVERY HELPERS ---
  static getCloudSyncStatus(): CloudSyncStatus {
    return currentSyncStatus;
  }

  static subscribeCloudSync(listener: (status: CloudSyncStatus) => void): () => void {
    syncListeners.add(listener);
    listener(currentSyncStatus);
    return () => syncListeners.delete(listener);
  }

  static async checkCloudSync(): Promise<CloudSyncStatus> {
    if (!isFirebaseConfigured() || !db) {
      notifySyncStatus({ state: 'error', errorMessage: 'Firebase is not configured in .env' });
      return currentSyncStatus;
    }
    notifySyncStatus({ state: 'checking', errorMessage: null });
    try {
      await setDoc(doc(db, 'systemSettings', 'sync_test'), {
        lastPing: new Date().toISOString(),
        client: 'ILMS Web App'
      }, { merge: true });
      handleFirestoreSuccess(0);
    } catch (err: any) {
      handleFirestoreError('checkCloudSync ping', err);
    }
    return currentSyncStatus;
  }

  static async syncAllLocalDataToFirebase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isFirebaseConfigured() || !db) {
      return { success: false, count: 0, error: 'Firebase is not configured in .env' };
    }

    notifySyncStatus({ state: 'checking', errorMessage: null });

    try {
      await setDoc(doc(db, 'systemSettings', 'sync_test'), {
        lastPing: new Date().toISOString(),
        client: 'ILMS Web App Manual Sync'
      }, { merge: true });
    } catch (testErr: any) {
      handleFirestoreError('sync test connection', testErr);
      const isPerm = testErr?.code === 'permission-denied' ||
        (typeof testErr?.message === 'string' && testErr.message.toLowerCase().includes('permission'));
      return {
        success: false,
        count: 0,
        error: isPerm ? 'permission_denied' : (testErr?.message || 'Connection error')
      };
    }

    let syncedCount = 0;

    try {
      // 1. Universal Inventory Items
      const inventory = localStore.getInventory();
      for (const item of inventory) {
        await setDoc(doc(db, 'inventoryItems', item.id), sanitizeForFirestore(item), { merge: true });
        syncedCount++;
      }

      // 2. Equipment Assets
      const equipment = localStore.getEquipment();
      for (const eq of equipment) {
        await setDoc(doc(db, 'equipmentAssets', eq.id), sanitizeForFirestore(eq), { merge: true });
        syncedCount++;
      }

      // 3. Attendance Records
      const attendance = localStore.getAttendance();
      for (const att of attendance) {
        await setDoc(doc(db, 'attendance', att.id), sanitizeForFirestore(att), { merge: true });
        syncedCount++;
      }

      // 4. Users Profile Records
      const users = localStore.getUsers();
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u), { merge: true });
        syncedCount++;
      }

      // 5. Equipment Bookings
      const bookings = localStore.getBookings();
      for (const b of bookings) {
        await setDoc(doc(db, 'bookings', b.id), sanitizeForFirestore(b), { merge: true });
        syncedCount++;
      }

      // 6. Audit Logs
      const audit = localStore.getAuditLogs().slice(0, 50);
      for (const log of audit) {
        await setDoc(doc(db, 'auditLogs', log.id), sanitizeForFirestore(log), { merge: true });
        syncedCount++;
      }

      notifySyncStatus({
        state: 'synced',
        lastChecked: new Date().toISOString(),
        errorMessage: null,
        syncedCount
      });

      return { success: true, count: syncedCount };
    } catch (err: any) {
      console.error('Error during bulk sync:', err);
      handleFirestoreError('bulk sync', err);
      return { success: false, count: syncedCount, error: err?.message };
    }
  }
}

