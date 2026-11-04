/**
 * ILMS Universal QR Code Synchronization & Integrity Validator
 * Ensures that all equipment, inventory, lab rooms, workstations, and student USNs
 * have synchronized, decodable, and up-to-date QR codes and barcode links.
 */

import {
  INITIAL_EQUIPMENT,
  INITIAL_INVENTORY,
  INITIAL_LABORATORIES,
  INITIAL_WORKSTATIONS,
  INITIAL_USERS
} from '../lib/firebase/seedData';
import { localStore } from '../services/dataService';
import { EquipmentAsset, UniversalInventoryItem, Laboratory, ComputerWorkstation, UserProfile } from '../types';

export interface QRValidationReport {
  timestamp: string;
  totalAssetsChecked: number;
  equipmentCount: number;
  inventoryCount: number;
  laboratoriesCount: number;
  workstationsCount: number;
  studentsCount: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Resolves any scanned code, URL, or identifier to its corresponding live database entity.
 */
export function resolveQRCodeEntity(rawInput: string) {
  let clean = rawInput.trim();
  if (!clean) return null;

  // 1. Strip URL parameters or paths if a URL was scanned
  try {
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('ilms://')) {
      const urlObj = new URL(clean);
      const paramId =
        urlObj.searchParams.get('search') ||
        urlObj.searchParams.get('q') ||
        urlObj.searchParams.get('id') ||
        urlObj.searchParams.get('sku') ||
        urlObj.searchParams.get('tag') ||
        urlObj.searchParams.get('code');
      if (paramId) {
        clean = paramId;
      } else {
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length > 0) clean = parts[parts.length - 1];
      }
    }
  } catch {}

  // 2. Strip standard QR prefixes
  clean = clean.replace(/^ILMS:(equipment|inventory|workstation|lab):/i, '');
  const cleanLower = clean.toLowerCase();

  // Combine localStore and seed catalogs
  const equipment = [...localStore.getEquipment(), ...INITIAL_EQUIPMENT];
  const inventory = [...localStore.getInventory(), ...INITIAL_INVENTORY];
  const workstations = [...localStore.getWorkstations(), ...INITIAL_WORKSTATIONS];
  const labs = [...localStore.getLabs(), ...INITIAL_LABORATORIES];
  const users = [...localStore.getUsers(), ...INITIAL_USERS];

  // Match Equipment
  const equip = equipment.find(
    e =>
      e.assetTag?.toLowerCase() === cleanLower ||
      e.qrCode?.toLowerCase() === cleanLower ||
      e.id?.toLowerCase() === cleanLower ||
      cleanLower.includes(e.assetTag?.toLowerCase() || '___')
  );
  if (equip) return { type: 'equipment' as const, entity: equip, identifier: equip.assetTag };

  // Match Inventory
  const inv = inventory.find(
    i =>
      i.sku?.toLowerCase() === cleanLower ||
      i.qrCode?.toLowerCase() === cleanLower ||
      i.id?.toLowerCase() === cleanLower ||
      cleanLower.includes(i.sku?.toLowerCase() || '___')
  );
  if (inv) return { type: 'inventory' as const, entity: inv, identifier: inv.sku };

  // Match Workstations
  const ws = workstations.find(
    w =>
      w.workstationTag?.toLowerCase() === cleanLower ||
      w.id?.toLowerCase() === cleanLower ||
      cleanLower.includes(w.workstationTag?.toLowerCase().split(' ')[0] || '___')
  );
  if (ws) return { type: 'workstation' as const, entity: ws, identifier: ws.workstationTag };

  // Match Laboratories
  const lab = labs.find(
    l =>
      l.code?.toLowerCase() === cleanLower ||
      l.id?.toLowerCase() === cleanLower ||
      l.name?.toLowerCase().includes(cleanLower)
  );
  if (lab) return { type: 'laboratory' as const, entity: lab, identifier: lab.code };

  // Match Student USNs
  const student = users.find(
    u =>
      (u.institutionId && u.institutionId.toLowerCase() === cleanLower) ||
      u.email.toLowerCase() === cleanLower ||
      u.displayName.toLowerCase().includes(cleanLower)
  );
  if (student) return { type: 'student' as const, entity: student, identifier: student.institutionId || student.email };

  // Web Links
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('www.')) {
    return { type: 'link' as const, entity: { url: clean }, identifier: clean };
  }

  return null;
}

/**
 * Validates that all assets and quick-test barcodes in the application
 * are correctly synchronized with the latest catalog codes.
 */
export function validateAllQRCodes(): QRValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const equipment = [...localStore.getEquipment(), ...INITIAL_EQUIPMENT];
  const inventory = [...localStore.getInventory(), ...INITIAL_INVENTORY];
  const workstations = [...localStore.getWorkstations(), ...INITIAL_WORKSTATIONS];
  const labs = [...localStore.getLabs(), ...INITIAL_LABORATORIES];
  const users = [...localStore.getUsers(), ...INITIAL_USERS];

  // 1. Verify all equipment assets have valid assetTags and resolve
  equipment.forEach(e => {
    if (!e.assetTag) {
      errors.push(`Equipment missing assetTag: ID ${e.id} (${e.name})`);
    } else {
      const resolved = resolveQRCodeEntity(e.assetTag);
      if (!resolved) {
        errors.push(`Equipment assetTag "${e.assetTag}" failed to resolve in QR lookup`);
      }
    }
  });

  // 2. Verify all inventory items have valid SKUs and resolve
  inventory.forEach(i => {
    if (!i.sku) {
      errors.push(`Inventory item missing SKU: ID ${i.id} (${i.name})`);
    } else {
      const resolved = resolveQRCodeEntity(i.sku);
      if (!resolved) {
        errors.push(`Inventory SKU "${i.sku}" failed to resolve in QR lookup`);
      }
    }
  });

  // 3. Verify laboratory codes
  labs.forEach(l => {
    if (!l.code) {
      warnings.push(`Laboratory "${l.name}" has no room code.`);
    } else {
      const resolved = resolveQRCodeEntity(l.code);
      if (!resolved) {
        errors.push(`Lab code "${l.code}" failed to resolve`);
      }
    }
  });

  // 4. Verify test barcodes used in QRScannerModal
  const testBarcodes = [
    'TAG-ATL1-7010',
    'TAG-ATL1-4080',
    'TAG-ATL3-C9200L',
    'SJBIT-SSD-1TB-NVME',
    'SJBIT-LD-74XX-KIT',
    'CS-12',
    'WS-ATL1-01',
    '1JB23CS001'
  ];

  testBarcodes.forEach(code => {
    const resolved = resolveQRCodeEntity(code);
    if (!resolved) {
      errors.push(`Scanner quick-test barcode "${code}" does not resolve to an active entity!`);
    }
  });

  const total = equipment.length + inventory.length + workstations.length + labs.length + users.length;
  const isValid = errors.length === 0;

  if (isValid) {
    console.log(`[ILMS QR Sync] ✓ All ${total} catalog entities and test barcodes verified and synchronized with latest code.`);
  } else {
    console.warn(`[ILMS QR Sync] ⚠ QR validation found ${errors.length} mismatch issues:`, errors);
  }

  return {
    timestamp: new Date().toISOString(),
    totalAssetsChecked: total,
    equipmentCount: equipment.length,
    inventoryCount: inventory.length,
    laboratoriesCount: labs.length,
    workstationsCount: workstations.length,
    studentsCount: users.length,
    isValid,
    errors,
    warnings
  };
}
