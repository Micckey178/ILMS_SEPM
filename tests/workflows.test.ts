import { describe, it, expect, beforeEach } from 'vitest';
import { DataService, localStore } from '../src/services/dataService';
import { UserProfile, UniversalInventoryItem, EquipmentAsset } from '../src/types';

describe('ILMS Multi-Laboratory Business Workflows & Data Integrity', () => {
  const adminUser: UserProfile = {
    id: 'usr-admin-test',
    email: 'admin.test@institution.edu',
    displayName: 'Test Admin',
    role: 'admin',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-chem-01', 'lab-phys-01'],
    assignedLabId: 'lab-chem-01'
  };

  const studentUser: UserProfile = {
    id: 'usr-student-test',
    email: 'student.test@institution.edu',
    displayName: 'Test Student',
    role: 'student',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-chem-01'],
    assignedLabId: 'lab-chem-01'
  };

  const techUser: UserProfile = {
    id: 'usr-tech-test',
    email: 'tech.test@institution.edu',
    displayName: 'Test Technician',
    role: 'technician',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-chem-01'],
    assignedLabId: 'lab-chem-01'
  };

  const managerUser: UserProfile = {
    id: 'usr-mgr-test',
    email: 'mgr.test@institution.edu',
    displayName: 'Test Lab Manager',
    role: 'labManager',
    organizationId: 'org-main-01',
    assignedLabs: ['lab-chem-01'],
    assignedLabId: 'lab-chem-01'
  };

  beforeEach(() => {
    // Reset test database to fresh seed state
    localStore.resetToSeed();
  });

  // 1. User Role & Permissions Enforcement
  it('1. Enforces role authorization: Students cannot create inventory items', async () => {
    await expect(
      DataService.createInventoryItem({
        name: 'Unauthorized Acid Bottle',
        quantity: 10,
        unit: 'litres',
        laboratoryId: 'lab-chem-01'
      }, studentUser)
    ).rejects.toThrow(/not authorized/i);
  });

  // 2. Inventory Creation & Retrieval
  it('2. Technicians can create and list inventory items', async () => {
    const newItem = await DataService.createInventoryItem({
      name: 'Potassium Permanganate 500g',
      sku: 'CHEM-KMN-500G',
      category: 'Oxidizers',
      quantity: 5,
      unit: 'pcs',
      minStock: 2,
      unitCost: 35.00,
      laboratoryId: 'lab-chem-01'
    }, techUser);

    expect(newItem.id).toBeDefined();
    expect(newItem.name).toBe('Potassium Permanganate 500g');

    const labInventory = await DataService.getInventory('lab-chem-01');
    const match = labInventory.find(i => i.id === newItem.id);
    expect(match).toBeDefined();
    expect(match?.quantity).toBe(5);
  });

  // 3 & 4. Stock Receipt, Consumption, and Negative-Stock Prevention
  it('3. Atomically increases stock on receipt', async () => {
    const inv = await DataService.getInventory('lab-chem-01');
    const item = inv[0];
    const initialQty = item.quantity;

    const result = await DataService.recordStockMovement(
      item.id,
      10,
      'RECEIPT',
      'Batch replenishment from Sigma',
      techUser
    );

    expect(result.newQuantity).toBe(initialQty + 10);
  });

  it('4. Prevents negative stock balance during consumption', async () => {
    const inv = await DataService.getInventory('lab-chem-01');
    const item = inv[0];
    const excessiveAmount = item.quantity + 500;

    await expect(
      DataService.recordStockMovement(
        item.id,
        -excessiveAmount,
        'CONSUMPTION',
        'Excessive experiment test',
        techUser
      )
    ).rejects.toThrow(/negative stock prevented/i);
  });

  // 5 & 6. Booking Concurrency & Maintenance-Lock Protection
  it('5. Prevents overlapping concurrent equipment bookings', async () => {
    const equip = (await DataService.getEquipment('lab-chem-01')).find(e => e.status === 'AVAILABLE');
    expect(equip).toBeDefined();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const startStr = `${tomorrow.toISOString().split('T')[0]}T10:00:00Z`;
    const endStr = `${tomorrow.toISOString().split('T')[0]}T12:00:00Z`;

    // First booking succeeds
    const booking1 = await DataService.createBooking({
      equipmentId: equip!.id,
      equipmentName: equip!.name,
      laboratoryId: equip!.laboratoryId,
      userId: studentUser.id,
      userName: studentUser.displayName,
      userRole: studentUser.role,
      startTime: startStr,
      endTime: endStr,
      purpose: 'First research session'
    }, studentUser);

    expect(booking1.id).toBeDefined();

    // Overlapping booking for same equipment in same window MUST fail
    const overlapStart = `${tomorrow.toISOString().split('T')[0]}T11:00:00Z`;
    const overlapEnd = `${tomorrow.toISOString().split('T')[0]}T13:00:00Z`;

    await expect(
      DataService.createBooking({
        equipmentId: equip!.id,
        equipmentName: equip!.name,
        laboratoryId: equip!.laboratoryId,
        userId: 'usr-other',
        userName: 'Other Student',
        userRole: 'student',
        startTime: overlapStart,
        endTime: overlapEnd,
        purpose: 'Conflicting research session'
      }, studentUser)
    ).rejects.toThrow(/schedule conflict/i);
  });

  it('6. Rejects bookings on maintenance-blocked equipment', async () => {
    // eq-chem-003 is MAINTENANCE_BLOCKED in initial seed
    const blockedEquip = (await DataService.getEquipment('lab-chem-01')).find(e => e.status === 'MAINTENANCE_BLOCKED');
    expect(blockedEquip).toBeDefined();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    await expect(
      DataService.createBooking({
        equipmentId: blockedEquip!.id,
        equipmentName: blockedEquip!.name,
        laboratoryId: blockedEquip!.laboratoryId,
        userId: studentUser.id,
        userName: studentUser.displayName,
        userRole: studentUser.role,
        startTime: `${tomorrow.toISOString().split('T')[0]}T10:00:00Z`,
        endTime: `${tomorrow.toISOString().split('T')[0]}T12:00:00Z`,
        purpose: 'Attempted booking on blocked equipment'
      }, studentUser)
    ).rejects.toThrow(/locked due to safety status/i);
  });

  // 7. Issue & Return Workflow
  it('7. Decrements stock when item is issued and replenishes upon return', async () => {
    const inv = await DataService.getInventory('lab-chem-01');
    const availableItem = inv.find(i => i.quantity >= 5);
    expect(availableItem).toBeDefined();

    const initialQty = availableItem!.quantity;

    // Issue 2 units
    const tx = await DataService.issueItem(
      availableItem!.id,
      studentUser.id,
      studentUser.displayName,
      studentUser.email,
      2,
      new Date(Date.now() + 86400000).toISOString(),
      techUser
    );

    expect(tx.status).toBe('ISSUED');

    // Verify stock decreased
    let updatedItem = (await DataService.getInventory('lab-chem-01')).find(i => i.id === availableItem!.id);
    expect(updatedItem?.quantity).toBe(initialQty - 2);

    // Return the item
    await DataService.returnItem(
      tx.id,
      'EXCELLENT',
      'Returned clean with all accessories',
      [],
      techUser
    );

    // Verify stock was restored
    updatedItem = (await DataService.getInventory('lab-chem-01')).find(i => i.id === availableItem!.id);
    expect(updatedItem?.quantity).toBe(initialQty);
  });

  // 8. Procurement Self-Approval Prevention
  it('8. Enforces procurement governance: Users cannot approve their own purchase requests', async () => {
    const pr = await DataService.createPurchaseRequest({
      title: 'Lab Consumable Requisition',
      laboratoryId: 'lab-chem-01',
      requestedBy: managerUser.id,
      requestedByName: managerUser.displayName,
      items: [{ name: 'Analytical Balances Glass Covers', category: 'Glassware', quantity: 2, estimatedUnitCost: 45.00 }],
      totalEstimatedCost: 90.00,
      currency: 'USD',
      justification: 'Replacement for broken draft shields'
    }, managerUser);

    // Manager cannot approve their OWN request
    await expect(
      DataService.updatePurchaseRequestStatus(pr.id, 'APPROVED', managerUser, 'Self approval attempt')
    ).rejects.toThrow(/self-approval forbidden/i);

    // Admin CAN approve it
    await expect(
      DataService.updatePurchaseRequestStatus(pr.id, 'APPROVED', adminUser, 'Authorized by Dean/Admin')
    ).resolves.not.toThrow();
  });

  // 9. Dashboard Aggregation
  it('9. Computes live database analytics and telemetry correctly', async () => {
    const metrics = await DataService.getDashboardMetrics('lab-chem-01');
    expect(metrics.totalInventoryItems).toBeGreaterThan(0);
    expect(metrics.totalInventoryValue).toBeGreaterThan(0);
    expect(metrics.categoryChartData.length).toBeGreaterThan(0);
    expect(metrics.equipmentStatusChartData.length).toBeGreaterThan(0);
  });
});
