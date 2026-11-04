import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  CalendarCheck,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { EquipmentAsset, EquipmentStatus } from '../types';
import { BookingModal } from '../components/BookingModal';
import { QRLabelModal } from '../components/QRLabelModal';
import { formatINR } from '../utils/formatCurrency';

export const EquipmentPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Modals
  const [selectedForBooking, setSelectedForBooking] = useState<EquipmentAsset | null>(null);
  const [selectedForQR, setSelectedForQR] = useState<EquipmentAsset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<EquipmentAsset>>({
    name: '',
    assetTag: `TAG-${Date.now().toString().slice(-6)}`,
    category: 'Analytical Equipment',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'AVAILABLE',
    location: 'Main Lab Bay',
    purchaseCost: 45000,
    safetyInstructions: ''
  });

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await DataService.getEquipment(activeLab?.id);
      setEquipment(data);
    } catch (err) {
      console.error('Failed to load equipment assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, [activeLab]);

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createEquipment({
        ...formData,
        laboratoryId: activeLab?.id || 'lab-chem-01'
      }, currentUser);
      setIsAddModalOpen(false);
      loadEquipment();
    } catch (err: any) {
      alert(err.message || 'Failed to add equipment');
    }
  };

  const handleToggleMaintenanceBlock = async (asset: EquipmentAsset) => {
    if (!can('block_equipment')) {
      alert('Only technicians or managers can toggle maintenance locks.');
      return;
    }
    const newStatus: EquipmentStatus =
      asset.status === 'MAINTENANCE_BLOCKED' ? 'AVAILABLE' : 'MAINTENANCE_BLOCKED';

    try {
      await DataService.updateEquipment({ ...asset, status: newStatus }, currentUser);
      await DataService.logAudit({
        action: newStatus === 'MAINTENANCE_BLOCKED' ? 'EQUIPMENT_LOCKED' : 'EQUIPMENT_UNLOCKED',
        category: 'MAINTENANCE',
        laboratoryId: asset.laboratoryId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        details: `Toggled status of "${asset.name}" to ${newStatus}`
      });
      loadEquipment();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Asset Register & Telemetry
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • {filteredEquipment.length} instruments registered
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Equipment & Instrumentation Register
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Track precision lab instruments, inspect maintenance history, generate asset QR labels, and schedule research time slots.
          </p>
        </div>

        {can('manage_equipment') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-md transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-card flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by instrument name, asset tag, model, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#172033] placeholder-[#5B6478] focus:outline-none focus:border-[#18BDF5]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#5B6478] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-[#18BDF5]"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="MAINTENANCE_BLOCKED">Maintenance Blocked</option>
          </select>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEquipment.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-[#E4E7F0] rounded-3xl text-[#5B6478] shadow-card text-xs">
            No equipment assets found matching your criteria.
          </div>
        ) : (
          filteredEquipment.map((asset) => {
            const isBlocked = asset.status === 'MAINTENANCE_BLOCKED' || asset.status === 'UNDER_MAINTENANCE';
            return (
              <div
                key={asset.id}
                className="bg-white border border-[#E4E7F0] hover:border-cyan-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition shadow-card group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-cyan-800 font-bold bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                        {asset.assetTag}
                      </span>
                      <h4 className="font-bold text-base text-[#172033] mt-1.5 line-clamp-1">{asset.name}</h4>
                    </div>
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${
                        asset.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : asset.status === 'RESERVED'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {asset.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-[#5B6478] mt-1.5">
                    {asset.manufacturer} • {asset.model}
                  </p>

                  <div className="mt-3 p-3 bg-[#F5F6FC] rounded-2xl text-xs space-y-1.5 text-[#5B6478] border border-[#E4E7F0]">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <strong className="text-[#172033]">{asset.location}</strong>
                    </div>
                    {asset.purchaseCost ? (
                      <div className="flex justify-between">
                        <span>Valuation:</span>
                        <strong className="font-mono text-cyan-900">{formatINR(asset.purchaseCost)}</strong>
                      </div>
                    ) : null}
                    {asset.nextMaintenanceDate && (
                      <div className="flex justify-between">
                        <span>Next Service:</span>
                        <span className="font-mono text-[#172033]">{asset.nextMaintenanceDate}</span>
                      </div>
                    )}
                    {asset.safetyInstructions && (
                      <p className="text-[11px] text-amber-700 line-clamp-2 pt-1 border-t border-[#E4E7F0]">
                        Safety: {asset.safetyInstructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#E4E7F0] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSelectedForQR(asset)}
                      title="Print Asset QR Code Label"
                      className="p-2 text-[#5B6478] hover:text-[#172033] hover:bg-slate-100 rounded-xl transition"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {can('block_equipment') && (
                      <button
                        onClick={() => handleToggleMaintenanceBlock(asset)}
                        title={isBlocked ? 'Clear Maintenance Block' : 'Put Asset on Maintenance Lock'}
                        className={`p-2 rounded-xl transition ${
                          isBlocked
                            ? 'text-rose-600 bg-rose-50'
                            : 'text-[#5B6478] hover:text-amber-600 hover:bg-amber-50'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedForBooking(asset)}
                    disabled={isBlocked}
                    className="px-4 py-2 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] disabled:opacity-30 disabled:hover:bg-[#18BDF5] text-[#172033] text-xs font-extrabold flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>{isBlocked ? 'Blocked' : 'Reserve'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={Boolean(selectedForBooking)}
        onClose={() => setSelectedForBooking(null)}
        preselectedEquipmentId={selectedForBooking?.id}
        onSuccess={loadEquipment}
      />

      {/* QR Label Modal */}
      <QRLabelModal
        isOpen={Boolean(selectedForQR)}
        onClose={() => setSelectedForQR(null)}
        item={selectedForQR}
        type="equipment"
      />

      {/* Add Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-[#172033]">
            <div className="flex items-center justify-between p-5 border-b border-[#E4E7F0] bg-white">
              <h3 className="font-heading font-black text-lg text-[#172033]">Register New Equipment Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-[#5B6478] hover:text-[#172033] rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Inverted Fluorescent Microscope"
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Asset Tag Code
                  </label>
                  <input
                    type="text"
                    value={formData.assetTag || ''}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Microscopy, Lasers"
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Olympus, Agilent"
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Location in Lab
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bay 2 South"
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.purchaseCost || 0}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: Number(e.target.value) })}
                    className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] block mb-1">
                  Safety Instructions & Protective Gear
                </label>
                <textarea
                  rows={2}
                  value={formData.safetyInstructions || ''}
                  onChange={(e) => setFormData({ ...formData, safetyInstructions: e.target.value })}
                  placeholder="e.g. Goggles mandatory. Do not touch high-voltage electrodes."
                  className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-xl px-3 py-2 text-[#172033] text-xs focus:border-[#18BDF5] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E7F0] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#5B6478] hover:text-[#172033] bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-xl text-xs font-extrabold shadow-md"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
