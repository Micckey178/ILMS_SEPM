import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Cpu,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService, localStore } from '../services/dataService';
import { Laboratory } from '../types';

interface FacultyLabBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FacultyLabBookingModal: React.FC<FacultyLabBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, laboratories, activeLab } = useAuth();

  const [selectedLabId, setSelectedLabId] = useState<string>(activeLab?.id || laboratories[0]?.id || '');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [subjectCourse, setSubjectCourse] = useState<string>('');
  const [classSection, setClassSection] = useState<string>('Cohort 3A - Section B');
  const [studentCount, setStudentCount] = useState<number>(24);
  const [purpose, setPurpose] = useState<string>('Scheduled Practical Laboratory Session');
  const [requiredEquipment, setRequiredEquipment] = useState<string>('Analytical Balances, Glassware Sets, Fume Hood');
  const [specialRequirements, setSpecialRequirements] = useState<string>('Secondary containment trays and spill kit verification');
  const [supportingNotes, setSupportingNotes] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (activeLab) setSelectedLabId(activeLab.id);
      else if (laboratories.length > 0) setSelectedLabId(laboratories[0].id);

      // Default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [isOpen, activeLab, laboratories]);

  if (!isOpen) return null;

  const currentLab = laboratories.find(l => l.id === selectedLabId);
  const maxCapacity = currentLab?.capacity || 30;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentLab) {
      setErrorMsg('Please select a valid laboratory facility.');
      return;
    }

    if (studentCount > maxCapacity) {
      setErrorMsg(`Capacity exceeded: ${currentLab.name} has a maximum seating capacity of ${maxCapacity} students.`);
      return;
    }

    const startIso = new Date(`${date}T${startTime}:00`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00`).toISOString();

    if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
      setErrorMsg('Start time must precede end time.');
      return;
    }

    // Operating hours check (08:00 to 18:00 standard university lab hours)
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    if (startHour < 8 || endHour > 19) {
      setErrorMsg('Laboratory operating hours are strictly 08:00 AM to 07:00 PM.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create concurrency-safe booking record in DataService
      await DataService.createBooking(
        {
          equipmentId: currentLab.id,
          equipmentName: `Whole Facility: ${currentLab.name} (${classSection})`,
          laboratoryId: currentLab.id,
          userId: currentUser.id,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          startTime: startIso,
          endTime: endIso,
          purpose: `${purpose} [${subjectCourse} | ${classSection}]`,
          projectOrExperiment: `${studentCount} Students • Req: ${requiredEquipment}`
        },
        currentUser
      );

      // 2. Also register in practical sessions roster
      await DataService.createPracticalSession({
        title: subjectCourse || `${currentLab.name} Practical`,
        courseCode: subjectCourse.split(' ')[0] || 'LAB-301',
        laboratoryId: currentLab.id,
        facultyId: currentUser.id,
        facultyName: currentUser.displayName,
        groupName: classSection,
        studentCount,
        attendanceCount: 0,
        date,
        startTime,
        endTime,
        requiredEquipment: requiredEquipment.split(',').map(s => s.trim()),
        status: 'SCHEDULED',
        observations: `Booking notes: ${supportingNotes || specialRequirements || 'None'}`
      }, currentUser);

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Concurrency conflict: Laboratory slot is already booked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 flex flex-col text-[#172033]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white text-[#172033] flex items-center justify-between border-b border-[#E4E7F0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#172033]">
                Faculty Laboratory Reservation
              </h3>
              <p className="text-xs text-[#5B6478]">
                Book entire facility for practical batches, practical exams, or research cohorts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#5B6478] hover:text-[#172033] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Laboratory Selection & Live Capacity Display */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
              Select Laboratory Facility <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLabId}
              onChange={e => setSelectedLabId(e.target.value)}
              required
              className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#172033] dark:text-white font-medium outline-none focus:border-[#18BDF5]"
            >
              {laboratories.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.code}) — {lab.building} Rm {lab.roomNumber} [Cap: {lab.capacity} students]
                </option>
              ))}
            </select>
            {currentLab && (
              <div className="flex items-center justify-between text-[11px] text-[#5B6478] dark:text-[#B8C7DF] mt-1.5 px-1">
                <span>Facility Capacity: <strong className="text-[#18BDF5]">{maxCapacity} Seats</strong></span>
                <span>Operating Hours: <strong>08:00 AM – 07:00 PM</strong></span>
              </div>
            )}
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
          </div>

          {/* Subject / Course & Class Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                Subject or Course <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subjectCourse}
                onChange={e => setSubjectCourse(e.target.value)}
                placeholder="e.g. CHEM-301 Organic Synthesis Lab"
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                Class / Batch Section <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={classSection}
                onChange={e => setClassSection(e.target.value)}
                placeholder="e.g. B.Tech 3rd Yr - Cohort B"
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
          </div>

          {/* Student Count & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                Number of Students <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={maxCapacity}
                required
                value={studentCount}
                onChange={e => setStudentCount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
                Booking Purpose <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Practical Midterm Evaluation & Spectrometry"
                className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
              />
            </div>
          </div>

          {/* Required Equipment & Special Requirements */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
              Required Apparatus & Instruments
            </label>
            <input
              type="text"
              value={requiredEquipment}
              onChange={e => setRequiredEquipment(e.target.value)}
              placeholder="e.g. UV-Vis Spectrophotometer, 24x Pipette sets, Centrifuge"
              className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
              Special Requirements & Safety Measures
            </label>
            <input
              type="text"
              value={specialRequirements}
              onChange={e => setSpecialRequirements(e.target.value)}
              placeholder="e.g. Continuous fume extraction, nitrogen purge lines"
              className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478] dark:text-[#B8C7DF] block mb-1">
              Supporting Notes for Lab Manager
            </label>
            <textarea
              rows={2}
              value={supportingNotes}
              onChange={e => setSupportingNotes(e.target.value)}
              placeholder="Optional additional requests or assistance required from technicians..."
              className="w-full bg-[#F5F6FC] dark:bg-[#141E34] border border-border dark:border-[#26334A] rounded-2xl px-3 py-2 text-xs font-medium text-[#172033] dark:text-white outline-none focus:border-[#18BDF5]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end space-x-3 border-t border-[#E4E7F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-[#F5F6FC] hover:bg-slate-100 text-[#5B6478] hover:text-[#172033] border border-[#E4E7F0] font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#172033]" />
              <span>{isSubmitting ? 'Checking schedule...' : 'Submit Faculty Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyLabBookingModal;
