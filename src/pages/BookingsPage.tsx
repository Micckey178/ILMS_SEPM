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
  Calendar,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { EquipmentBooking } from '../types';
import { BookingModal } from '../components/BookingModal';
import { FacultyLabBookingModal } from '../components/FacultyLabBookingModal';

export const BookingsPage: React.FC = () => {
  const { activeLab, currentUser, can } = useAuth();
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
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
      {/* Header with High-Contrast Typography & Faculty Lab Booking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] dark:text-white flex items-center space-x-2.5">
            <CalendarCheck className="w-7 h-7 text-[#18BDF5]" />
            <span>Faculty Lab Booking & Equipment Scheduling</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#B8C7DF] font-medium mt-1">
            {activeLab ? `${activeLab.name} (${activeLab.code})` : 'All University Facilities'} • Concurrency-safe reservations & capacity validation
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsFacultyModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-cyan-50 text-[#172033] border-2 border-cyan-400 rounded-2xl text-xs font-black flex items-center space-x-2 shadow-sm transition hover:shadow-md"
          >
            <Building2 className="w-4 h-4 text-cyan-700 shrink-0" />
            <span className="text-[#172033] font-black tracking-tight">Faculty Lab Booking</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] rounded-2xl text-xs font-black flex items-center space-x-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Reserve Equipment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-soft flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by equipment, researcher name, or experiment purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#172033] placeholder-[#5B6478] focus:outline-none focus:border-[#18BDF5]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#5B6478] shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F5F6FC] border border-[#E4E7F0] rounded-2xl px-3 py-2.5 text-xs sm:text-sm text-[#172033] font-medium focus:outline-none focus:border-[#18BDF5]"
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
      <div className="bg-white border border-[#E4E7F0] rounded-3xl overflow-hidden shadow-card">
        <div className="divide-y divide-[#E4E7F0]">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-[#5B6478] text-sm">
              No equipment reservations found matching your filters.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const isOwner = b.userId === currentUser.id;
              const canApprove = can('approve_booking');

              return (
                <div key={b.id} className="p-5 hover:bg-[#F5F6FC]/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-base text-[#172033]">{b.equipmentName}</span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : b.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-[#F5F6FC] text-[#5B6478] border-[#E4E7F0]'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5B6478]">
                      <span className="flex items-center space-x-1 text-cyan-700 font-mono font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{start.toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#5B6478]" />
                        <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-[#172033] font-medium">
                        <User className="w-3.5 h-3.5 text-[#5B6478]" />
                        <span>{b.userName}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#5B6478] italic">
                      "{b.purpose}" {b.projectOrExperiment && <span className="text-[#172033] font-normal not-italic ml-1">[{b.projectOrExperiment}]</span>}
                    </p>
                  </div>

                  {/* Booking Management Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {b.status === 'PENDING' && canApprove && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) handleUpdateStatus(b.id, 'REJECTED', reason);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
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
                        className="px-3 py-1.5 bg-[#F5F6FC] hover:bg-slate-100 text-[#5B6478] hover:text-[#172033] border border-[#E4E7F0] rounded-xl text-xs font-bold transition"
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

      <FacultyLabBookingModal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        onSuccess={loadBookings}
      />
    </div>
  );
};
