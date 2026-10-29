import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Search, QrCode } from 'lucide-react';
import { UniversalInventoryItem, EquipmentAsset } from '../types';
import { localStore } from '../services/dataService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemFound: (item: UniversalInventoryItem | EquipmentAsset, type: 'inventory' | 'equipment') => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onItemFound }) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setManualCode('');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setErrorMsg(null);
      // Give element time to mount
      await new Promise(r => setTimeout(r, 200));

      const scanner = new Html5Qrcode('qr-reader-viewport');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn('Camera scan initialization failed or permission denied:', err);
      setIsScanning(false);
      setErrorMsg('Camera access unavailable or blocked. You can still look up any item by QR Code or SKU manually below.');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleCodeDetected = (code: string) => {
    stopCamera();
    const inventory = localStore.getInventory();
    const equipment = localStore.getEquipment();

    // Look for exact or partial QR code / SKU match
    const cleanCode = code.trim().toLowerCase();
    const invMatch = inventory.find(
      i => i.qrCode.toLowerCase() === cleanCode || i.sku.toLowerCase() === cleanCode || i.id.toLowerCase() === cleanCode
    );

    if (invMatch) {
      onItemFound(invMatch, 'inventory');
      onClose();
      return;
    }

    const equipMatch = equipment.find(
      e => e.qrCode.toLowerCase() === cleanCode || e.assetTag.toLowerCase() === cleanCode || e.id.toLowerCase() === cleanCode
    );

    if (equipMatch) {
      onItemFound(equipMatch, 'equipment');
      onClose();
      return;
    }

    setErrorMsg(`No laboratory asset matched the scanned code: "${code}". Please verify or enter SKU manually.`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100">Asset QR / Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-4 flex flex-col items-center">
          <div
            id="qr-reader-viewport"
            className="w-full h-64 bg-slate-950 rounded-lg border-2 border-dashed border-sky-500/40 overflow-hidden flex items-center justify-center relative"
          >
            {!isScanning && (
              <div className="text-center p-4 text-slate-400 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm">Camera inactive or access not granted.</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-3 w-full p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="mt-4 w-full space-y-2">
            <label className="text-xs font-medium text-slate-300">Manual Asset ID / SKU Lookup</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. CHEM-HCL-37-1L or ILMS-EQ-CHEM-01"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1"
              >
                <Search className="w-4 h-4" />
                <span>Find</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Works with standard QR codes and institutional barcode tags on inventory containers and equipment.
          </p>
        </div>
      </div>
    </div>
  );
};
