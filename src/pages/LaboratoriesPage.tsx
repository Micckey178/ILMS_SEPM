import React, { useState } from 'react';
import {
  Building,
  Plus,
  Users,
  Clock,
  Shield,
  Layers,
  MapPin,
  X,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { Laboratory, LaboratoryType } from '../types';

export const LaboratoriesPage: React.FC = () => {
  const { laboratories, currentUser, refreshData } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<LaboratoryType>('physics');
  const [building, setBuilding] = useState('Science Complex');
  const [roomNumber, setRoomNumber] = useState('Room 101');
  const [capacity, setCapacity] = useState(25);
  const [contactEmail, setContactEmail] = useState('');
  const [operatingHours, setOperatingHours] = useState('08:30 - 17:30 (Mon-Fri)');
  const [safetyLevel, setSafetyLevel] = useState<Laboratory['safetyLevel']>('Standard');
  const [description, setDescription] = useState('');

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createLaboratory({
        id: `lab-${Date.now()}`,
        name,
        code,
        type,
        organizationId: currentUser.organizationId || 'org-main-01',
        campusId: 'campus-north',
        departmentId: `dept-${type}`,
        building,
        roomNumber,
        capacity: Number(capacity),
        managerId: currentUser.id,
        managerName: currentUser.displayName,
        technicianIds: ['usr-tech-01'],
        contactEmail: contactEmail || `${code.toLowerCase()}@institution.edu`,
        operatingHours,
        safetyLevel,
        status: 'active',
        description,
        enabledModules: ['inventory', 'equipment', 'booking'],
        createdAt: new Date().toISOString()
      }, currentUser);

      setIsAddModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      refreshData();
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
            <Building className="w-5 h-5 text-sky-400" />
            <span>Institution Multi-Laboratory Registry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Cross-departmental management of scientific, engineering, medical, and research laboratories
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Laboratory</span>
        </button>
      </div>

      {/* Laboratories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {laboratories.map((lab) => (
          <div
            key={lab.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {lab.code}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {lab.status}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-100 mt-2">{lab.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lab.description}</p>

              <div className="mt-4 p-3 bg-slate-950/60 rounded-lg text-xs space-y-1.5 text-slate-400 border border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lab.building} • Room {lab.roomNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Capacity: <strong className="text-slate-200">{lab.capacity} workstations</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lab.operatingHours}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Safety Protocol: <strong className="text-slate-200">{lab.safetyLevel}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="capitalize">{lab.type.replace('_', ' ')} Module</span>
              <span className="text-slate-500">Contact: {lab.contactEmail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Laboratory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Register New Academic/Research Laboratory</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Laboratory Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Environmental Analytical Toxicology Lab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Lab Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ENV-204"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Discipline / Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LaboratoryType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="biology">Biology</option>
                    <option value="computer_science">Computer Science & IT</option>
                    <option value="electronics">Electronics & Electrical</option>
                    <option value="mechanical">Mechanical Engineering</option>
                    <option value="civil">Civil Engineering</option>
                    <option value="biotechnology">Biotechnology</option>
                    <option value="environmental">Environmental Science</option>
                    <option value="automobile">Automobile Engineering</option>
                    <option value="medical">Medical Education</option>
                    <option value="agriculture">Agricultural Science</option>
                    <option value="general_research">General Research</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Room #
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Safety Classification
                  </label>
                  <select
                    value={safetyLevel}
                    onChange={(e) => setSafetyLevel(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="Standard">Standard Academic</option>
                    <option value="Biosafety-1">Biosafety Level 1 (BSL-1)</option>
                    <option value="Biosafety-2">Biosafety Level 2 (BSL-2)</option>
                    <option value="Hazardous-Chemical">Hazardous Wet Chemical</option>
                    <option value="High-Voltage">High-Voltage Electrical</option>
                    <option value="Heavy-Machinery">Heavy Machinery / CNC</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="lab@institution.edu"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Description & Capabilities
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline laboratory scope, special instruments, and safety rules."
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
                  Create Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
