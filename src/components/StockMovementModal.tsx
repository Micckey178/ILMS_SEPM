import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UniversalInventoryItem, MovementType } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UniversalInventoryItem | null;
  onSuccess: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({ isOpen, onClose, item, onSuccess }) => {
  const { currentUser } = useAuth();
  const [movementType, setMovementType] = useState<MovementType>('CONSUMPTION');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const currentQty = Number(item.quantity) || 0;
  const isAddition = movementType === 'RECEIPT' || movementType === 'RETURN';
  const effectiveChange = isAddition ? Math.abs(quantity) : -Math.abs(quantity);
  const projectedBalance = currentQty + effectiveChange;
  const isNegative = projectedBalance < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Mandatory reason required for audit compliance.');
      return;
    }
    if (isNegative) {
      setErrorMsg(`Cannot consume ${quantity} ${item.unit}. Current stock is only ${currentQty} ${item.unit}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await DataService.recordStockMovement(
        item.id,
        effectiveChange,
        movementType,
        reason,
        currentUser,
        referenceNumber
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update stock ledger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div>
            <h3 className="font-semibold text-slate-100">Record Stock Movement</h3>
            <p className="text-xs text-slate-400 mt-0.5">{item.name} ({item.sku})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Movement Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'CONSUMPTION', label: 'Consumption / Usage', isAdd: false },
                { type: 'RECEIPT', label: 'Stock Receipt (+)', isAdd: true },
                { type: 'RETURN', label: 'Equipment Return (+)', isAdd: true },
                { type: 'DISPOSAL', label: 'Disposal / Waste (-)', isAdd: false },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setMovementType(opt.type as MovementType)}
                  className={`p-2 rounded-lg border text-xs font-medium text-left flex items-center space-x-1.5 transition ${
                    movementType === opt.type
                      ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-semibold shadow-sm'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {opt.isAdd ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Balance Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Amount ({item.unit})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Projected Balance
              </label>
              <div
                className={`p-2 rounded-lg border text-sm font-semibold flex items-center justify-between ${
                  isNegative
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                    : 'border-slate-700 bg-slate-800 text-slate-200'
                }`}
              >
                <span>{projectedBalance} {item.unit}</span>
                {isNegative && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Reason / Session Note <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Exp 4 Organic Synthesis or Monthly Routine Dispense"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Reference # (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. PO-88412 or TICKET-104"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isNegative}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-sky-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm Movement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
