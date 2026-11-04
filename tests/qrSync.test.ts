import { describe, it, expect } from 'vitest';
import { validateAllQRCodes, resolveQRCodeEntity } from '../src/utils/qrValidator';

describe('ILMS QR Code Continuous Synchronization & Integrity', () => {
  it('validates that all quick-test barcodes in the scanner resolve to active catalog entities', () => {
    const report = validateAllQRCodes();
    expect(report.errors).toEqual([]);
    expect(report.isValid).toBe(true);
    expect(report.totalAssetsChecked).toBeGreaterThan(50);
  });

  it('correctly decodes and deep-links equipment asset barcodes', () => {
    const res = resolveQRCodeEntity('TAG-ATL1-7010');
    expect(res).not.toBeNull();
    expect(res?.type).toBe('equipment');
    expect(res?.identifier).toBe('TAG-ATL1-7010');
  });

  it('correctly decodes inventory SKU barcodes', () => {
    const res = resolveQRCodeEntity('SJBIT-SSD-1TB-NVME');
    expect(res).not.toBeNull();
    expect(res?.type).toBe('inventory');
    expect(res?.identifier).toBe('SJBIT-SSD-1TB-NVME');
  });

  it('correctly decodes Aryabhata Lab code CS-12', () => {
    const res = resolveQRCodeEntity('CS-12');
    expect(res).not.toBeNull();
    expect(res?.type).toBe('laboratory');
  });

  it('correctly decodes student USN barcodes', () => {
    const res = resolveQRCodeEntity('1JB23CS001');
    expect(res).not.toBeNull();
    expect(res?.type).toBe('student');
  });

  it('correctly recognizes web links with query parameters and URLs', () => {
    const resWithSearch = resolveQRCodeEntity('http://192.168.29.29:5173/equipment?search=TAG-ATL1-7010');
    expect(resWithSearch).not.toBeNull();
    expect(resWithSearch?.type).toBe('equipment');

    const resExternal = resolveQRCodeEntity('https://sjbit.edu.in');
    expect(resExternal).not.toBeNull();
    expect(resExternal?.type).toBe('link');
  });
});
