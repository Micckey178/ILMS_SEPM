import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  PackageCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { PurchaseRequest } from '../types';

export const ProcurementPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // New PR Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [justification, setJustification] = useState('');
  const [budgetCode, setBudgetCode] = useState('CHEM-GRANT-2026');
  const [itemsList, setItemsList] = useState<{ name: string; category: string; quantity: number; estimatedUnitCost: number; supplier?: string }[]>([
    { name: '', category: 'Consumables', quantity: 1, estimatedUnitCost: 50.00, supplier: '' }
  ]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await DataService.getPurchaseRequests(activeLab?.id);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load purchase requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activeLab]);

  const handleAddItemRow = () => {
    setItemsList([
      ...itemsList,
      { name: '', category: 'Consumables', quantity: 1, estimatedUnitCost: 20.00, supplier: '' }
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...itemsList];
    (updated[index] as any)[field] = value;
    setItemsList(updated);
  };

  const totalCost = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.estimatedUnitCost || 0)), 0);

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || itemsList.length === 0 || !itemsList[0].name.trim()) {
      alert('Please fill out all mandatory purchase request fields.');
      return;
    }

    try {
      await DataService.createPurchaseRequest({
        title,
        laboratoryId: activeLab?.id || 'lab-chem-01',
        requestedBy: currentUser.id,
        requestedByName: currentUser.displayName,
        items: itemsList,
        totalEstimatedCost: totalCost,
        currency: 'USD',
        justification,
        departmentBudgetCode: budgetCode
      }, currentUser);
      setIsAddModalOpen(false);
      setTitle('');
      setJustification('');
      loadRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (pr: PurchaseRequest) => {
    // Security check: cannot approve own request
    if (pr.requestedBy === currentUser.id && currentUser.role !== 'admin') {
      alert('Self-Approval Forbidden: Another Lab Manager or Institution Admin must approve your purchase request.');
      return;
    }

    try {
      await DataService.updatePurchaseRequestStatus(
        pr.id,
        'APPROVED',
        currentUser,
        'Authorized within annual departmental allocation.'
      );
      loadRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGoodsReceipt = async (pr: PurchaseRequest) => {
    try {
      // Automatically add items to inventory
      for (const item of pr.items) {
        await DataService.createInventoryItem({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: 'pcs',
          unitCost: item.estimatedUnitCost,
          storageLocation: 'Central Receiving Dock',
          laboratoryId: pr.laboratoryId,
          supplier: item.supplier
        }, currentUser);
      }

      await DataService.updatePurchaseRequestStatus(
        pr.id,
        'RECEIVED',
        currentUser,
        'Goods received at dock and automatically entered into active inventory ledger.'
      );
      loadRequests();
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
            <ShoppingCart className="w-5 h-5 text-sky-400" />
            <span>Procurement & Purchase Approvals</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Multi-level requisition approval & stock goods receipt
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Request</span>
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="divide-y divide-slate-800/70">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No purchase requests logged for this laboratory.
            </div>
          ) : (
            requests.map((pr) => {
              const canApprove = can('approve_procurement') && (pr.status === 'SUBMITTED' || pr.status === 'UNDER_REVIEW');
              const canReceive = can('manage_equipment') && pr.status === 'APPROVED';

              return (
                <div key={pr.id} className="p-5 hover:bg-slate-850/40 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-sm text-slate-100">{pr.title}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          pr.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : pr.status === 'RECEIVED'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Requester: <strong className="text-slate-200">{pr.requestedByName}</strong></span>
                      <span>•</span>
                      <span>Budget: <span className="font-mono text-slate-300">{pr.departmentBudgetCode || 'General'}</span></span>
                      <span>•</span>
                      <span>Total: <strong className="text-emerald-400 font-mono">${pr.totalEstimatedCost.toFixed(2)}</strong></span>
                    </div>

                    <p className="text-xs text-slate-300 italic">
                      "{pr.justification}"
                    </p>

                    {/* Items table preview */}
                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Requested Line Items ({pr.items.length})
                      </span>
                      <div className="space-y-1">
                        {pr.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span>{it.name} ({it.category})</span>
                            <span className="font-mono text-slate-400">{it.quantity}x @ ${it.estimatedUnitCost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {canApprove && (
                      <button
                        onClick={() => handleApprove(pr)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize PR</span>
                      </button>
                    )}

                    {canReceive && (
                      <button
                        onClick={() => handleGoodsReceipt(pr)}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Confirm Goods Receipt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New PR Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Submit Purchase Requisition</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Requisition Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replenishment of Solvents and Spectroscopy Cuvettes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Department Budget Code
                </label>
                <input
                  type="text"
                  value={budgetCode}
                  onChange={(e) => setBudgetCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              {/* Line items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Requisition Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    + Add Row
                  </button>
                </div>

                {itemsList.map((row, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Item name (e.g. Ethanol 99.8% 2.5L)"
                      required
                      value={row.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        required
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost ($)"
                        required
                        value={row.estimatedUnitCost}
                        onChange={(e) => handleItemChange(idx, 'estimatedUnitCost', Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Supplier (optional)"
                        value={row.supplier || ''}
                        onChange={(e) => handleItemChange(idx, 'supplier', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                      />
                    </div>
                  </div>
                ))}

                <div className="text-right text-xs text-slate-300 font-medium pt-1">
                  Total Requisition Estimate: <strong className="text-emerald-400 font-mono text-sm">${totalCost.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Justification <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Critical low stock. Required for ongoing undergraduate laboratory practical sessions."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
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
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
