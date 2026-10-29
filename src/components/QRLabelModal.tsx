import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Tag, Download } from 'lucide-react';
import { UniversalInventoryItem, EquipmentAsset } from '../types';

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UniversalInventoryItem | EquipmentAsset | null;
  type: 'inventory' | 'equipment';
}

export const QRLabelModal: React.FC<QRLabelModalProps> = ({ isOpen, onClose, item, type }) => {
  if (!isOpen || !item) return null;

  const isEquip = type === 'equipment';
  const equip = isEquip ? (item as EquipmentAsset) : null;
  const inv = !isEquip ? (item as UniversalInventoryItem) : null;

  const title = item.name;
  const identifier = equip ? equip.assetTag : inv?.sku || item.id;
  const qrData = item.qrCode || `ILMS:${type}:${item.id}`;
  const location = equip ? equip.location : inv?.storageLocation || 'Laboratory Store';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col no-print">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100">Print Asset QR Label</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div className="p-6 flex flex-col items-center">
          <div
            id="printable-qr-card"
            className="printable-card bg-white text-slate-900 p-5 rounded-lg border-2 border-slate-300 shadow-md w-72 flex flex-col items-center text-center space-y-3"
          >
            <div className="border-b border-slate-200 pb-2 w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700 block">
                ILMS MULTI-LAB SYSTEM
              </span>
              <h4 className="font-bold text-sm text-slate-900 leading-tight mt-0.5 line-clamp-2">
                {title}
              </h4>
            </div>

            {/* QR Code */}
            <div className="p-2 bg-white rounded border border-slate-200 shadow-inner">
              <QRCodeSVG
                value={qrData}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="w-full space-y-1 text-xs">
              <div className="font-mono font-bold text-slate-800 tracking-wider">
                {identifier}
              </div>
              <div className="text-[11px] text-slate-600">
                Loc: <span className="font-medium text-slate-900">{location}</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider pt-1 border-t border-slate-100">
                Authorized Lab Property • Scan to Check
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Standard 2.5" x 2" thermal sticker or adhesive label format.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-sky-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sticker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
