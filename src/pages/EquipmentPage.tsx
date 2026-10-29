import React, { useState, useEffect } from 'react';
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

export const EquipmentPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [equipment, setEquipment] = useState<EquipmentAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

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
    purchaseCost: 5000,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>Equipment & Instrumentation Register</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • {filteredEquipment.length} instruments registered
          </p>
        </div>

        {can('manage_equipment') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by instrument name, asset tag, model, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No equipment assets found matching your criteria.
          </div>
        ) : (
          filteredEquipment.map((asset) => {
            const isBlocked = asset.status === 'MAINTENANCE_BLOCKED' || asset.status === 'UNDER_MAINTENANCE';
            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {asset.assetTag}
                      </span>
                      <h4 className="font-bold text-sm text-slate-100 mt-1 line-clamp-1">{asset.name}</h4>
                    </div>
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                        asset.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : asset.status === 'RESERVED'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {asset.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {asset.manufacturer} • {asset.model}
                  </p>

                  <div className="mt-3 p-2.5 bg-slate-950/60 rounded-lg text-xs space-y-1 text-slate-400 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <strong className="text-slate-200">{asset.location}</strong>
                    </div>
                    {asset.nextMaintenanceDate && (
                      <div className="flex justify-between">
                        <span>Next Service:</span>
                        <span className="font-mono text-slate-300">{asset.nextMaintenanceDate}</span>
                      </div>
                    )}
                    {asset.safetyInstructions && (
                      <p className="text-[10px] text-amber-300/80 line-clamp-2 pt-1 border-t border-slate-800">
                        Safety: {asset.safetyInstructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedForQR(asset)}
                      title="Print Asset QR Code Label"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {can('block_equipment') && (
                      <button
                        onClick={() => handleToggleMaintenanceBlock(asset)}
                        title={isBlocked ? 'Clear Maintenance Block' : 'Put Asset on Maintenance Lock'}
                        className={`p-1.5 rounded-lg transition ${
                          isBlocked
                            ? 'text-rose-400 hover:bg-rose-500/20'
                            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedForBooking(asset)}
                    disabled={isBlocked}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:hover:bg-sky-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Register New Equipment Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Asset Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Inverted Fluorescent Microscope"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Asset Tag Code
                  </label>
                  <input
                    type="text"
                    value={formData.assetTag || ''}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Microscopy, Lasers"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Olympus, Agilent"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Location in Lab
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bay 2 South"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    value={formData.purchaseCost || 0}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Safety Instructions & Protective Gear
                </label>
                <textarea
                  rows={2}
                  value={formData.safetyInstructions || ''}
                  onChange={(e) => setFormData({ ...formData, safetyInstructions: e.target.value })}
                  placeholder="e.g. Goggles mandatory. Do not touch high-voltage electrodes."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
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
