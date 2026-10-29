import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { IssueReturnTransaction } from '../types';
import { IssueModal, ReturnModal } from '../components/IssueReturnModal';

export const IssueReturnPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [transactions, setTransactions] = useState<IssueReturnTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedTxForReturn, setSelectedTxForReturn] = useState<IssueReturnTransaction | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await DataService.getIssueReturnTransactions(activeLab?.id);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [activeLab]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.borrowerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-sky-400" />
            <span>Equipment Issue & Return Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Loan tracking and inspection sign-offs
          </p>
        </div>

        {can('issue_return_items') && (
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Item to Borrower</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by equipment/item name, borrower, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Transactions</option>
            <option value="ISSUED">Active Loans (Issued)</option>
            <option value="OVERDUE">Overdue Returns</option>
            <option value="RETURNED">Returned & Closed</option>
            <option value="DAMAGED_RETURN">Damaged Returns</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Item & Quantity</th>
                <th className="py-3 px-3">Borrower</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Expected Return</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No issue/return loan records found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isOverdue = tx.status === 'OVERDUE' || (tx.status === 'ISSUED' && new Date(tx.expectedReturnDate).getTime() < Date.now());
                  const canReturn = can('issue_return_items') && (tx.status === 'ISSUED' || tx.status === 'OVERDUE');

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{tx.itemName}</div>
                        <div className="text-[11px] text-slate-400">
                          Qty: <strong className="text-sky-300 font-mono">{tx.quantity}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">{tx.borrowerName}</div>
                        <div className="text-[10px] text-slate-500">{tx.borrowerEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {new Date(tx.expectedReturnDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-300">
                          Before: <span className="text-emerald-400 font-medium">{tx.conditionBeforeIssue}</span>
                        </div>
                        {tx.conditionAfterReturn && (
                          <div className="text-[10px] text-slate-400">
                            After: <span className="font-medium text-amber-300">{tx.conditionAfterReturn}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        ) : tx.status === 'RETURNED' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Returned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>Active Loan</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canReturn ? (
                          <button
                            onClick={() => setSelectedTxForReturn(tx)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 mx-auto transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Inspect & Return</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Signed Off</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={loadTransactions}
      />

      {/* Return & Inspect Modal */}
      <ReturnModal
        isOpen={Boolean(selectedTxForReturn)}
        onClose={() => setSelectedTxForReturn(null)}
        transaction={selectedTxForReturn}
        onSuccess={loadTransactions}
      />
    </div>
  );
};
