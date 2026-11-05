import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Building2,
  Boxes,
  Cpu,
  CalendarCheck,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Command,
  X,
  PlusCircle,
  QrCode,
  Activity,
  Gauge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { UniversalInventoryItem, EquipmentAsset, Laboratory } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQRScanner?: () => void;
  onOpenFaultReport?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenQRScanner,
  onOpenFaultReport
}) => {
  const navigate = useNavigate();
  const { currentUser, laboratories, switchLaboratory } = useAuth();
  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState<UniversalInventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Load searchable data
      DataService.getInventory().then(setInventory).catch(() => {});
      DataService.getEquipment().then(setEquipment).catch(() => {});
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredLabs = laboratories.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.code.toLowerCase().includes(q) ||
    l.type.toLowerCase().includes(q) ||
    l.building.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredInventory = inventory.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.category.toLowerCase().includes(q) ||
    i.sku.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredEquipment = equipment.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.serialNumber.toLowerCase().includes(q) ||
    e.model.toLowerCase().includes(q)
  ).slice(0, 4);

  const quickActions = [
    {
      title: 'Scan QR / Barcode',
      desc: 'Identify item, book, loan, or report fault',
      icon: QrCode,
      action: () => {
        onClose();
        if (onOpenQRScanner) onOpenQRScanner();
      }
    },
    {
      title: 'Report Equipment Fault',
      desc: 'Submit maintenance ticket for damaged asset',
      icon: Wrench,
      action: () => {
        onClose();
        if (onOpenFaultReport) onOpenFaultReport();
      }
    },
    {
      title: 'Book Lab / Equipment',
      desc: 'Reserve a practical session slot or apparatus',
      icon: CalendarCheck,
      action: () => {
        onClose();
        navigate('/bookings');
      }
    },
    {
      title: 'Universal Inventory',
      desc: 'Search chemicals, consumables, and raw materials',
      icon: Boxes,
      action: () => {
        onClose();
        navigate('/inventory');
      }
    },
    ...(currentUser.role === 'admin'
      ? [
          {
            title: 'ILMS Command Centre',
            desc: 'Centralized institutional monitoring and KPI dashboard',
            icon: Activity,
            action: () => {
              onClose();
              navigate('/command-centre');
            }
          }
        ]
      : []),
    ...(currentUser.role === 'admin' || currentUser.role === 'faculty'
      ? [
          {
            title: 'Resource Intelligence',
            desc: 'Deterministic utilization analytics and deficit reports in Dashboard',
            icon: Gauge,
            action: () => {
              onClose();
              navigate('/?tab=intelligence');
            }
          }
        ]
      : [])
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150 text-[#172033]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-[#E4E7F0] bg-white">
          <Search className="w-5 h-5 text-cyan-600 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search labs, equipment, chemicals, bookings..."
            className="w-full bg-transparent text-[#172033] placeholder-[#5B6478] text-base md:text-lg focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center space-x-1 pl-2 text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg ml-2">
            <span>ESC</span>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Actions (when query is empty or matched) */}
          {!query && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                Quick Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((qa, idx) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={idx}
                      onClick={qa.action}
                      className="flex items-center space-x-3 p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-foreground dark:text-slate-100">{qa.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{qa.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Laboratories */}
          {filteredLabs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2 flex items-center justify-between">
                <span>Laboratories</span>
                <span className="text-[11px] text-purple-600 font-medium">Switch Active Lab</span>
              </p>
              <div className="space-y-1.5">
                {filteredLabs.map(lab => (
                  <button
                    key={lab.id}
                    onClick={() => {
                      switchLaboratory(lab.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground dark:text-slate-100">{lab.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lab.building} • Room {lab.roomNumber} ({lab.type})
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold font-mono">
                      {lab.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Assets */}
          {filteredEquipment.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                Equipment Assets
              </p>
              <div className="space-y-1.5">
                {filteredEquipment.map(eq => (
                  <button
                    key={eq.id}
                    onClick={() => {
                      navigate('/equipment');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground dark:text-slate-100">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Model: {eq.model} • SN: {eq.serialNumber}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                      eq.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {eq.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Items */}
          {filteredInventory.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                Inventory & Materials
              </p>
              <div className="space-y-1.5">
                {filteredInventory.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate('/inventory');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground dark:text-slate-100">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Category: {item.category} • Location: {item.storageLocation}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-foreground dark:text-slate-200">
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredLabs.length === 0 && filteredEquipment.length === 0 && filteredInventory.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-600" />
              <p className="text-base font-semibold">No direct records found for "{query}"</p>
              <p className="text-xs mt-1">Try searching by asset tag, chemical name, or laboratory code.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-foreground dark:text-slate-300">Tip:</span>
            <span>Use ↑ ↓ to navigate, ↵ to select</span>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-semibold text-purple-600 dark:text-purple-400">ILMS Unified Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
