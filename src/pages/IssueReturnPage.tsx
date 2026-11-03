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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Asset Custody & Circulation
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">
              {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Loan tracking and inspection sign-offs
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Equipment Issue & Return Management
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-xl">
            Streamlined custody logging for borrowed student instruments, physical condition check-ins, and automated overdue alerts.
          </p>
        </div>

        {can('issue_return_items') && (
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-5 py-3 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-2xl text-xs sm:text-sm font-extrabold flex items-center space-x-2 shadow-md transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Item to Borrower</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-card flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by equipment/item name, borrower, or email..."
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
            <option value="ALL">All Transactions</option>
            <option value="ISSUED">Active Loans (Issued)</option>
            <option value="OVERDUE">Overdue Returns</option>
            <option value="RETURNED">Returned & Closed</option>
            <option value="DAMAGED_RETURN">Damaged Returns</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-[#E4E7F0] rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7F0] bg-[#F5F6FC] text-[#5B6478] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-5">Item & Quantity</th>
                <th className="py-3.5 px-4">Borrower</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Expected Return</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7F0]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6478] text-xs">
                    No issue/return loan records found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isOverdue = tx.status === 'OVERDUE' || (tx.status === 'ISSUED' && new Date(tx.expectedReturnDate).getTime() < Date.now());
                  const canReturn = can('issue_return_items') && (tx.status === 'ISSUED' || tx.status === 'OVERDUE');

                  return (
                    <tr key={tx.id} className="hover:bg-[#F5F6FC]/60 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-sm text-[#172033]">{tx.itemName}</div>
                        <div className="text-[11px] text-[#5B6478] mt-0.5">
                          Qty: <strong className="text-cyan-800 font-mono font-bold">{tx.quantity}</strong>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#172033]">{tx.borrowerName}</div>
                        <div className="text-[10px] text-[#5B6478]">{tx.borrowerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#5B6478]">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-[#172033]'}>
                          {new Date(tx.expectedReturnDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-[#5B6478]">
                          Before: <span className="text-emerald-700 font-semibold">{tx.conditionBeforeIssue}</span>
                        </div>
                        {tx.conditionAfterReturn && (
                          <div className="text-[10px] text-[#5B6478]">
                            After: <span className="font-semibold text-amber-700">{tx.conditionAfterReturn}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        ) : tx.status === 'RETURNED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Returned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Active Loan</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {canReturn ? (
                          <button
                            onClick={() => setSelectedTxForReturn(tx)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 mx-auto transition shadow-sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Inspect & Return</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#5B6478] font-bold uppercase tracking-wider">Signed Off</span>
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
