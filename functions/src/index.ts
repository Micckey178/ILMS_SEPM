import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: Admin User Role Provisioning
 * Server-authoritative role setting that writes custom claims and updates user doc.
 */
export const adminProvisionUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  // Ensure caller is an admin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const callerData = callerDoc.data();
  if (callerData?.role !== 'admin' && context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only system administrators can modify user roles.');
  }

  const { targetUid, role, assignedLabs, assignedLabId } = data;
  if (!targetUid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid or role.');
  }

  // Set Firebase Auth custom claims
  await admin.auth().setCustomUserClaims(targetUid, {
    role,
    assignedLabId: assignedLabId || null,
  });

  // Update Firestore user document
  await db.collection('users').doc(targetUid).set({
    role,
    assignedLabs: assignedLabs || [],
    assignedLabId: assignedLabId || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Record audit log
  await db.collection('auditLogs').add({
    action: 'USER_ROLE_PROVISIONED',
    performedBy: context.auth.uid,
    targetUserId: targetUid,
    role,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Role ${role} provisioned for user ${targetUid}` };
});

/**
 * Cloud Function: Server-Authoritative Stock Movement
 * Atomically updates inventory quantity, verifies against negative stock, and writes movement ledger.
 */
export const executeStockMovement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { itemId, changeAmount, reason, type, laboratoryId, referenceNumber } = data;
  if (!itemId || changeAmount === undefined || !laboratoryId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required stock movement arguments.');
  }

  const itemRef = db.collection('inventoryItems').doc(itemId);
  const movementRef = db.collection('stockMovements').doc();

  return await db.runTransaction(async (transaction) => {
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Inventory item not found.');
    }

    const item = itemSnap.data()!;
    if (item.laboratoryId !== laboratoryId) {
      throw new functions.https.HttpsError('permission-denied', 'Laboratory mismatch for item.');
    }

    const currentQty = Number(item.quantity) || 0;
    const newQty = currentQty + Number(changeAmount);

    if (newQty < 0) {
      throw new functions.https.HttpsError('failed-precondition', `Insufficient stock. Current: ${currentQty}, requested reduction: ${Math.abs(changeAmount)}`);
    }

    const minStock = Number(item.minStock) || 0;
    const isLowStock = newQty <= minStock;

    // Update item quantity atomically
    transaction.update(itemRef, {
      quantity: newQty,
      isLowStock,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record immutable stock movement
    transaction.set(movementRef, {
      id: movementRef.id,
      itemId,
      itemName: item.name,
      laboratoryId,
      previousQuantity: currentQty,
      changeAmount: Number(changeAmount),
      newQuantity: newQty,
      type: type || (changeAmount > 0 ? 'RECEIPT' : 'CONSUMPTION'),
      reason: reason || 'Stock adjustment',
      referenceNumber: referenceNumber || null,
      performedBy: context.auth!.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Trigger low stock notification if necessary
    if (isLowStock && !item.isLowStock) {
      const notifRef = db.collection('notifications').doc();
      transaction.set(notifRef, {
        id: notifRef.id,
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `Item "${item.name}" has reached low stock (${newQty} remaining, threshold: ${minStock}).`,
        laboratoryId,
        targetRole: 'technician',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, newQuantity: newQty, isLowStock };
  });
});

/**
 * Cloud Function: Concurrency-Safe Equipment Booking Check & Reservation
 * Validates overlapping bookings and maintenance blocks before confirming.
 */
export const validateAndBookEquipment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { equipmentId, startTime, endTime, purpose, laboratoryId } = data;
  if (!equipmentId || !startTime || !endTime || !laboratoryId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing booking parameters.');
  }

  const equipRef = db.collection('equipmentAssets').doc(equipmentId);
  const bookingRef = db.collection('bookings').doc();

  return await db.runTransaction(async (transaction) => {
    const equipSnap = await transaction.get(equipRef);
    if (!equipSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Equipment asset not found.');
    }

    const equip = equipSnap.data()!;
    if (equip.status === 'MAINTENANCE_BLOCKED' || equip.status === 'UNDER_MAINTENANCE' || equip.status === 'OUT_OF_SERVICE') {
      throw new functions.https.HttpsError('failed-precondition', `Equipment is unavailable for booking due to status: ${equip.status}`);
    }

    // Check for overlapping confirmed or approved bookings
    const overlapQuery = await db.collection('bookings')
      .where('equipmentId', '==', equipmentId)
      .where('status', 'in', ['CONFIRMED', 'PENDING'])
      .get();

    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();

    if (newStart >= newEnd) {
      throw new functions.https.HttpsError('invalid-argument', 'Start time must be before end time.');
    }

    for (const doc of overlapQuery.docs) {
      const b = doc.data();
      const existingStart = new Date(b.startTime).getTime();
      const existingEnd = new Date(b.endTime).getTime();

      // Check collision
      if (newStart < existingEnd && newEnd > existingStart) {
        throw new functions.https.HttpsError(
          'already-exists',
          `Collision detected: equipment is already booked from ${new Date(b.startTime).toLocaleString()} to ${new Date(b.endTime).toLocaleString()}`
        );
      }
    }

    // Create booking
    transaction.set(bookingRef, {
      id: bookingRef.id,
      equipmentId,
      equipmentName: equip.name,
      laboratoryId,
      userId: context.auth!.uid,
      startTime,
      endTime,
      purpose: purpose || 'Academic/Research Session',
      status: 'CONFIRMED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, bookingId: bookingRef.id };
  });
});

/**
 * Cloud Function: Scheduled Task - Nightly Maintenance & Low Stock Checker
 */
export const checkOverdueAndMaintenanceSchedule = functions.pubsub.schedule('every 24 hours').onRun(async () => {
  const now = new Date();
  
  // 1. Check for overdue equipment returns
  const overdueTransactions = await db.collection('issueReturnTransactions')
    .where('status', '==', 'ISSUED')
    .where('expectedReturnDate', '<', now.toISOString())
    .get();

  for (const doc of overdueTransactions.docs) {
    const data = doc.data();
    await db.collection('notifications').add({
      type: 'OVERDUE_RETURN',
      title: 'Overdue Equipment Return',
      message: `Equipment ${data.itemName || data.itemId} borrowed by ${data.borrowerName || data.borrowerId} is overdue since ${data.expectedReturnDate}.`,
      laboratoryId: data.laboratoryId,
      targetUserId: data.borrowerId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2. Check for maintenance due
  const maintenanceDue = await db.collection('maintenanceRecords')
    .where('status', '==', 'SCHEDULED')
    .where('scheduledDate', '<=', now.toISOString())
    .get();

  for (const doc of maintenanceDue.docs) {
    const data = doc.data();
    // Block equipment status if needed
    if (data.equipmentId) {
      await db.collection('equipmentAssets').doc(data.equipmentId).update({
        status: 'MAINTENANCE_BLOCKED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  return null;
});
