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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col no-print text-[#172033]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E4E7F0] bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800">
              <Tag className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#172033]">Print Asset QR Label</h3>
              <p className="text-xs text-[#5B6478]">Thermal barcode & sticker template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-[#F5F6FC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div className="p-6 flex flex-col items-center">
          <div
            id="printable-qr-card"
            className="printable-card bg-white text-slate-900 p-5 rounded-2xl border-2 border-dashed border-cyan-400 shadow-card w-72 flex flex-col items-center text-center space-y-3"
          >
            <div className="border-b border-[#E4E7F0] pb-2 w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700 block">
                ILMS MULTI-LAB SYSTEM
              </span>
              <h4 className="font-bold text-sm text-[#172033] leading-tight mt-0.5 line-clamp-2">
                {title}
              </h4>
            </div>

            {/* QR Code */}
            <div className="p-2.5 bg-white rounded-xl border border-[#E4E7F0] shadow-sm">
              <QRCodeSVG
                value={qrData}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="w-full space-y-1 text-xs">
              <div className="font-mono font-bold text-[#172033] tracking-wider">
                {identifier}
              </div>
              <div className="text-[11px] text-[#5B6478]">
                Loc: <span className="font-medium text-[#172033]">{location}</span>
              </div>
              <div className="text-[9px] text-[#5B6478] uppercase tracking-wider pt-1 border-t border-[#E4E7F0]">
                Authorized Lab Property • Scan to Check
              </div>
            </div>
          </div>

          <p className="text-xs text-[#5B6478] mt-4 text-center">
            Standard 2.5" x 2" thermal sticker or adhesive label format.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#F5F6FC] border-t border-[#E4E7F0] flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-[#5B6478] hover:text-[#172033] rounded-2xl hover:bg-white transition border border-[#E4E7F0]"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-2xl text-xs font-black transition flex items-center space-x-2 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sticker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
