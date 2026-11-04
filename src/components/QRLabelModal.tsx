import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Tag, ExternalLink, Globe, Hash } from 'lucide-react';
import { UniversalInventoryItem, EquipmentAsset } from '../types';

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UniversalInventoryItem | EquipmentAsset | null;
  type: 'inventory' | 'equipment';
}

export const QRLabelModal: React.FC<QRLabelModalProps> = ({ isOpen, onClose, item, type }) => {
  const [useWebLink, setUseWebLink] = useState(true);

  if (!isOpen || !item) return null;

  const isEquip = type === 'equipment';
  const equip = isEquip ? (item as EquipmentAsset) : null;
  const inv = !isEquip ? (item as UniversalInventoryItem) : null;

  const title = item.name;
  const identifier = equip ? equip.assetTag : inv?.sku || item.id;
  const location = equip ? equip.location : inv?.storageLocation || 'Laboratory Store';

  // Compute live web URL for mobile phone camera scanning
  const getWebUrl = () => {
    const savedIp = (typeof window !== 'undefined' && localStorage.getItem('ilms_host_ip')) || '192.168.29.29';
    const port = typeof window !== 'undefined' && window.location.port ? window.location.port : '5173';
    const host =
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${savedIp}:${port}`
        : typeof window !== 'undefined'
        ? window.location.host
        : `${savedIp}:${port}`;

    return `http://${host}/${type === 'equipment' ? 'equipment' : 'inventory'}?search=${encodeURIComponent(identifier)}`;
  };

  const webUrl = getWebUrl();
  const rawTag = item.qrCode || `ILMS:${type}:${item.id}`;
  const qrData = useWebLink ? webUrl : rawTag;

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

          {/* Format Toggle & Info */}
          <div className="w-72 mt-3 space-y-2">
            <div className="flex items-center justify-center p-1 bg-[#F5F6FC] rounded-xl border border-[#E4E7F0] text-xs">
              <button
                type="button"
                onClick={() => setUseWebLink(true)}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                  useWebLink ? 'bg-cyan-500 text-white shadow-xs' : 'text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web Link</span>
              </button>
              <button
                type="button"
                onClick={() => setUseWebLink(false)}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                  !useWebLink ? 'bg-cyan-500 text-white shadow-xs' : 'text-[#5B6478] hover:text-[#172033]'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Raw Tag</span>
              </button>
            </div>

            {useWebLink ? (
              <div className="text-[11px] text-[#5B6478] text-center space-y-1">
                <span>Phone cameras scanning this label will open the portal link directly.</span>
                <div className="flex items-center justify-center space-x-1 text-[10px] font-mono text-cyan-700 truncate">
                  <a
                    href={webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-0.5 truncate"
                  >
                    <span>{webUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-0.5" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#5B6478] text-center">
                Raw barcode value for hardware scanners: <span className="font-mono font-bold text-[#172033]">{rawTag}</span>
              </p>
            )}
          </div>
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
