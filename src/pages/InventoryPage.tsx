import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  QrCode,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  X,
  FileSpreadsheet,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { UniversalInventoryItem, AssetType, UnitOfMeasurement } from '../types';
import { StockMovementModal } from '../components/StockMovementModal';
import { QRLabelModal } from '../components/QRLabelModal';

export const InventoryPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [items, setItems] = useState<UniversalInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<UniversalInventoryItem | null>(null);
  const [selectedItemForQR, setSelectedItemForQR] = useState<UniversalInventoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UniversalInventoryItem | null>(null);

  // New Item Form state
  const [formData, setFormData] = useState<Partial<UniversalInventoryItem>>({
    name: '',
    sku: '',
    category: 'Reagents & Chemicals',
    assetType: 'consumable',
    storageLocation: '',
    quantity: 10,
    unit: 'pcs',
    minStock: 2,
    unitCost: 15.00,
    manufacturer: '',
    supplier: '',
    notes: ''
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await DataService.getInventory(activeLab?.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeLab]);

  // Unique categories
  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || (item.isLowStock || item.quantity <= item.minStock);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Unit', 'MinStock', 'StorageLocation', 'UnitCost', 'Status'];
    const rows = filteredItems.map(i => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      i.sku,
      `"${i.category}"`,
      i.quantity,
      i.unit,
      i.minStock,
      `"${i.storageLocation}"`,
      i.unitCost,
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ILMS_Inventory_${activeLab?.code || 'Export'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateOrUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await DataService.updateInventoryItem({ ...editingItem, ...formData } as UniversalInventoryItem, currentUser);
      } else {
        await DataService.createInventoryItem({
          ...formData,
          laboratoryId: activeLab?.id || 'lab-chem-01'
        }, currentUser);
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to archive/remove this inventory item? Historical transactions will be preserved.')) {
      try {
        await DataService.deleteInventoryItem(itemId, currentUser);
        loadInventory();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-sky-400" />
            <span>Universal Inventory Register</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • {filteredItems.length} items listed
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {can('create_inventory') && (
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  sku: `SKU-${Date.now().toString().slice(-6)}`,
                  category: 'General Supplies',
                  assetType: 'consumable',
                  storageLocation: 'Shelf 1',
                  quantity: 10,
                  unit: 'pcs',
                  minStock: 2,
                  unitCost: 10.00
                });
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inventory</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, SKU, or storage location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle Button */}
        <button
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition ${
            filterLowStockOnly
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Inventory Items Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-3">SKU & QR</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Storage Location</th>
                <th className="py-3 px-3 text-right">In Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No inventory records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.isLowStock || item.quantity <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{item.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.manufacturer && `${item.manufacturer} • `}
                          ${item.unitCost.toFixed(2)} / {item.unit}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-sky-400">
                        {item.sku}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {item.storageLocation}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold font-mono text-sm ${isLow ? 'text-amber-400' : 'text-slate-100'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Stock adjustment shortcut */}
                          {can('record_stock_movement') && (
                            <button
                              onClick={() => setSelectedItemForMovement(item)}
                              title="Adjust / Move Stock"
                              className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* QR Label Print */}
                          <button
                            onClick={() => setSelectedItemForQR(item)}
                            title="Generate QR Sticker"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit Item */}
                          {can('edit_inventory') && (
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setFormData(item);
                                setIsAddModalOpen(true);
                              }}
                              title="Edit Item Details"
                              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Delete Item */}
                          {can('delete_inventory') && (
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete Item"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={Boolean(selectedItemForMovement)}
        onClose={() => setSelectedItemForMovement(null)}
        item={selectedItemForMovement}
        onSuccess={loadInventory}
      />

      {/* QR Code Label Printing Modal */}
      <QRLabelModal
        isOpen={Boolean(selectedItemForQR)}
        onClose={() => setSelectedItemForQR(null)}
        item={selectedItemForQR}
        type="inventory"
      />

      {/* Add / Edit Inventory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateItem} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Item Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sodium Hydroxide Pellets ACS"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
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
                    placeholder="e.g. Solvents, Glassware"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Initial Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.quantity || 0}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit || 'pcs'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitOfMeasurement })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="pcs">pcs</option>
                    <option value="litres">litres</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="sets">sets</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock || 0}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    value={formData.storageLocation || ''}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                    placeholder="e.g. Cabinet B-04"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost || 0}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
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
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
