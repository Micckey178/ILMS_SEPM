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
  UserRole
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
  INITIAL_AUDIT_LOGS
} from '../lib/firebase/seedData';
import { db, isFirebaseConfigured } from '../lib/firebase/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'ILMS_STORE_V1_';

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
    this.set('stockMovements', []);
    this.set('initialized', 'true');
  }

  public getUsers(): UserProfile[] { return this.get('users', INITIAL_USERS); }
  public setUsers(users: UserProfile[]) { this.set('users', users); }

  public getLabs(): Laboratory[] { return this.get('laboratories', INITIAL_LABORATORIES); }
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
}

export const localStore = new LocalStoreManager();
localStore.init();

export class DataService {
  // --- USERS & AUTH ---
  static async getCurrentUser(userId: string): Promise<UserProfile | null> {
    const users = localStore.getUsers();
    return users.find(u => u.id === userId) || null;
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
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'laboratories'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as Laboratory));
        }
      } catch (err) {
        console.warn('Firestore fetch failed, using local store', err);
      }
    }
    return localStore.getLabs();
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
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as UniversalInventoryItem));
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
        await setDoc(doc(db, 'inventoryItems', newItem.id), newItem);
      } catch (err) {
        console.warn('Firestore item create failed, using local', err);
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
        await setDoc(doc(db, 'inventoryItems', updated.id), updated, { merge: true });
      } catch (err) {
        console.warn('Firestore update failed, using local', err);
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
      } catch (err) {
        console.warn('Firestore delete failed, using local', err);
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
    const item = items.find(i => i.id === itemId);
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
        await setDoc(doc(db, 'equipmentAssets', newAsset.id), newAsset);
      } catch (err) {
        console.warn('Firestore equipment create failed', err);
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
        await setDoc(doc(db, 'equipmentAssets', updated.id), updated, { merge: true });
      } catch (err) {
        console.warn('Firestore equipment update failed', err);
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
        await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
      } catch (err) {
        console.warn('Firestore booking write failed', err);
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
        await setDoc(doc(db, 'bookings', bookingId), booking, { merge: true });
      } catch (err) {
        console.warn('Firestore booking status update failed', err);
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
    const item = items.find(i => i.id === itemId);
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
      message: `${currentUser.displayName} submitted PR "${newPr.title}" for $${newPr.totalEstimatedCost.toFixed(2)}.`,
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
}
