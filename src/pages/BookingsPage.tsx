import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { EquipmentBooking } from '../types';
import { BookingModal } from '../components/BookingModal';

export const BookingsPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await DataService.getBookings(activeLab?.id);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [activeLab]);

  const handleUpdateStatus = async (
    bookingId: string,
    status: EquipmentBooking['status'],
    reason?: string
  ) => {
    try {
      await DataService.updateBookingStatus(bookingId, status, currentUser, reason);
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            <span>Equipment Booking & Laboratory Scheduling</span>
          </h2>
          <p className="text-xs text-slate-400">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All Laboratories'} • Concurrency-safe reservations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by equipment, researcher name, or experiment purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="divide-y divide-slate-800/70">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No equipment reservations found matching your filters.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const isOwner = b.userId === currentUser.id;
              const canApprove = can('approve_booking');

              return (
                <div key={b.id} className="p-4 hover:bg-slate-850/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-sm text-slate-100">{b.equipmentName}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : b.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center space-x-1 text-sky-400 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{start.toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.userName}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 italic">
                      "{b.purpose}" {b.projectOrExperiment && <span className="text-slate-400 font-normal">[{b.projectOrExperiment}]</span>}
                    </p>
                  </div>

                  {/* Booking Management Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {b.status === 'PENDING' && canApprove && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) handleUpdateStatus(b.id, 'REJECTED', reason);
                          }}
                          className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {(isOwner || canApprove) && b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => {
                          if (confirm('Cancel this equipment reservation?')) {
                            handleUpdateStatus(b.id, 'CANCELLED');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        Cancel Slot
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadBookings}
      />
    </div>
  );
};
