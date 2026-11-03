import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  UserX,
  Plus,
  Mail,
  Building2,
  Calendar,
  Sparkles,
  Lock,
  Edit2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { UserProfile, UserRole } from '../types';

export const UserManagementPage: React.FC = () => {
  const { currentUser, laboratories } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit / Approval modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [assignedRole, setAssignedRole] = useState<UserRole>('student');
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDept, setInviteDept] = useState('Computer Science & Engineering');
  const [inviteRole, setInviteRole] = useState<UserRole>('student');
  const [inviteId, setInviteId] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await DataService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.institutionId && u.institutionId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenApproveModal = (user: UserProfile) => {
    setSelectedUser(user);
    setAssignedRole(user.requestedRole || user.role);
    setSelectedLabs(user.assignedLabs || []);
  };

  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await DataService.approveUser(selectedUser.id, assignedRole, selectedLabs, currentUser);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = (user.status || 'active') === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to change account status of "${user.displayName}" to ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await DataService.updateUserStatus(user.id, newStatus, currentUser);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.registerNewAccount({
        displayName: inviteName,
        email: inviteEmail,
        institution: 'SJB Institute of Technology',
        departmentId: inviteDept,
        institutionId: inviteId || `EMP-${Date.now().toString().slice(-4)}`,
        requestedRole: inviteRole
      });
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      loadUsers();
      alert(`Institutional invitation and secure credentials dispatched to ${inviteEmail}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleLabSelection = (labId: string) => {
    if (selectedLabs.includes(labId)) {
      setSelectedLabs(selectedLabs.filter(id => id !== labId));
    } else {
      setSelectedLabs([...selectedLabs, labId]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-white border border-[#E4E7F0] rounded-3xl text-[#172033] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-xs uppercase font-extrabold tracking-wider">
              Identity Governance
            </span>
            <span className="text-[#5B6478] text-xs font-semibold">Role-Based Access Control</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#172033] mt-2">
            Institutional User & Role Management
          </h1>
          <p className="text-sm sm:text-base text-[#5B6478] mt-1 max-w-2xl">
            Audit Firebase-authenticated accounts, review pending registrations, grant elevated privileges, and isolate multi-laboratory scopes.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-extrabold text-sm shadow-md flex items-center space-x-2 transition"
        >
          <Plus className="w-5 h-5 text-[#172033]" />
          <span>Invite New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-[#E4E7F0] rounded-3xl shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[#5B6478] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or institutional ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-semibold text-[#172033] placeholder-[#5B6478] focus:outline-none focus:border-[#18BDF5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-[#5B6478]">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#18BDF5]"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="labManager">Lab Manager</option>
            <option value="faculty">Faculty</option>
            <option value="technician">Technician</option>
            <option value="student">Student</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-[#5B6478] ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#18BDF5]"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* User Roster Table */}
      <div className="bg-white border border-[#E4E7F0] rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6FC] uppercase font-bold text-[#5B6478] border-b border-[#E4E7F0]">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Institution ID</th>
                <th className="p-4">Approved Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Assigned Laboratories</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7F0]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5B6478]">
                    No accounts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const status = u.status || 'active';
                  const roleColors: Record<string, string> = {
                    admin: 'bg-purple-100 text-purple-800 border-purple-200',
                    labManager: 'bg-blue-100 text-blue-800 border-blue-200',
                    faculty: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    technician: 'bg-amber-100 text-amber-800 border-amber-200',
                    student: 'bg-slate-100 text-slate-800 border-slate-200'
                  };

                  return (
                    <tr key={u.id} className="hover:bg-[#F5F6FC]/60 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-sm shadow-sm">
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#20213A] dark:text-white block">
                              {u.displayName}
                            </span>
                            <span className="text-xs text-[#5B6478]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-semibold text-purple-600">
                        {u.institutionId || '—'}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${roleColors[u.role] || ''}`}>
                          {u.role}
                        </span>
                        {u.requestedRole && u.requestedRole !== u.role && (
                          <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                            Req: {u.requestedRole}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {status}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="text-xs text-[#5B6478]">
                          {u.assignedLabs ? `${u.assignedLabs.length} facilities` : 'None'}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-[11px] text-[#5B6478]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenApproveModal(u)}
                          title="Assign Role & Laboratories"
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition"
                        >
                          Configure
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                            status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVE / ROLE CONFIGURATION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F0] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] pb-3">
              <div>
                <h3 className="font-heading font-black text-xl text-[#20213A]">
                  Configure Role & Permissions
                </h3>
                <p className="text-xs text-[#5B6478]">User: {selectedUser.displayName} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-[#5B6478]" />
              </button>
            </div>

            <form onSubmit={handleSaveApproval} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#5B6478] uppercase mb-1">
                  Assign Application Role
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E4E7F0] bg-[#F7F7FC] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="admin">Administrator (Institution-wide access)</option>
                  <option value="labManager">Laboratory Manager</option>
                  <option value="faculty">Faculty / Lead Researcher</option>
                  <option value="technician">Laboratory Technician</option>
                  <option value="student">Student / Scholar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#5B6478] uppercase mb-2">
                  Assigned Facility Scopes ({selectedLabs.length} Selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-[#E4E7F0] rounded-2xl p-2 space-y-1">
                  {laboratories.map((lab) => {
                    const isChecked = selectedLabs.includes(lab.id);
                    return (
                      <div
                        key={lab.id}
                        onClick={() => toggleLabSelection(lab.id)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition ${
                          isChecked ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200' : 'hover:bg-slate-50 text-[#5B6478]'
                        }`}
                      >
                        <div>
                          <span className="block font-semibold">{lab.name}</span>
                          <span className="text-[10px] text-[#5B6478]">{lab.code} • {lab.building}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition"
                >
                  Confirm & Save Permissions
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-3 rounded-2xl bg-[#F5F6FC] hover:bg-slate-100 text-[#5B6478] font-bold text-xs border border-[#E4E7F0]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE USER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] pb-3">
              <h3 className="font-heading font-black text-xl text-[#172033]">
                Dispatch Institutional Invitation
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)}>
                <X className="w-5 h-5 text-[#5B6478]" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#172033] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Dr. Robert Langdon"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-semibold outline-none focus:border-[#18BDF5]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="langdon@institution.edu"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-semibold outline-none focus:border-[#18BDF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#172033] uppercase mb-1">Staff / Scholar ID</label>
                  <input
                    type="text"
                    value={inviteId}
                    onChange={(e) => setInviteId(e.target.value)}
                    placeholder="EMP-9021"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-mono font-semibold outline-none focus:border-[#18BDF5]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#172033] uppercase mb-1">Pre-Authorized Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E4E7F0] bg-[#F5F6FC] text-xs font-semibold outline-none focus:border-[#18BDF5]"
                  >
                    <option value="faculty">Faculty</option>
                    <option value="labManager">Lab Manager</option>
                    <option value="technician">Technician</option>
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#18BDF5] hover:bg-[#38BDF8] text-[#172033] font-black text-xs shadow-md transition"
                >
                  Send Invitation Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
