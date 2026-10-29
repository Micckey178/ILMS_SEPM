import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { UniversalInventoryItem, IssueReturnTransaction } from '../types';
import { DataService, localStore } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, activeLab } = useAuth();
  const [items, setItems] = useState<UniversalInventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [borrowerName, setBorrowerName] = useState<string>('Alex Thorne');
  const [borrowerEmail, setBorrowerEmail] = useState<string>('alex.t@student.institution.edu');
  const [quantity, setQuantity] = useState<number>(1);
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      const inv = localStore.getInventory().filter(
        i => (!activeLab || i.laboratoryId === activeLab.id) && i.quantity > 0
      );
      setItems(inv);
      if (inv.length > 0) setSelectedItemId(inv[0].id);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setExpectedReturnDate(nextWeek.toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [isOpen, activeLab]);

  if (!isOpen) return null;

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedItem) {
      setErrorMsg('Please select an available inventory item.');
      return;
    }
    if (quantity > selectedItem.quantity) {
      setErrorMsg(`Insufficient stock: Only ${selectedItem.quantity} ${selectedItem.unit} currently available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await DataService.issueItem(
        selectedItem.id,
        'usr-stud-01',
        borrowerName,
        borrowerEmail,
        quantity,
        new Date(`${expectedReturnDate}T17:00:00Z`).toISOString(),
        currentUser
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100">Issue Item to Borrower</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Item to Checkout
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Available: {i.quantity} {i.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem?.quantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Expected Return
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Borrower Name
            </label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Borrower Email
            </label>
            <input
              type="email"
              value={borrowerEmail}
              onChange={(e) => setBorrowerEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing...' : 'Authorize Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: IssueReturnTransaction | null;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [condition, setCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [notes, setNotes] = useState<string>('Item returned intact with all standard accessories.');
  const [missingComponentsStr, setMissingComponentsStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const missing = missingComponentsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await DataService.returnItem(
        transaction.id,
        condition,
        notes,
        missing,
        currentUser
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete return inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100">Equipment Return Inspection</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs space-y-1">
            <div className="text-slate-400">Item: <span className="text-slate-100 font-semibold">{transaction.itemName}</span></div>
            <div className="text-slate-400">Borrower: <span className="text-slate-100 font-medium">{transaction.borrowerName}</span></div>
            <div className="text-slate-400">Qty Returned: <span className="text-sky-300 font-bold">{transaction.quantity}</span></div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Physical Condition Post-Usage
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`p-2 rounded-lg border text-xs font-semibold text-center transition ${
                    condition === c
                      ? c === 'DAMAGED'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                        : 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Missing Components (Comma-separated)
            </label>
            <input
              type="text"
              value={missingComponentsStr}
              onChange={(e) => setMissingComponentsStr(e.target.value)}
              placeholder="e.g. Lens cap, power cable, USB adapter"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Inspection Notes & Damage Observations
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing off...' : 'Complete Return'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
