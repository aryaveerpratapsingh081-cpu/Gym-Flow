import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, QrCode, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export default function MembersPage() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [trainerFilter, setTrainerFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'Male',
    assignedTrainer: '',
    status: 'Active',
    address: ''
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/members', {
        params: {
          search,
          status: statusFilter,
          trainer: trainerFilter,
          page,
          limit: 10
        }
      });
      if (res.data.success) {
        setMembers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([API.get('/trainers'), API.get('/plans')]);
      if (tRes.data.success) setTrainers(tRes.data.data);
      if (pRes.data.success) setPlans(pRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter, trainerFilter, page]);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/members', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', phone: '', gender: 'Male', assignedTrainer: '', status: 'Active', address: '' });
        fetchMembers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create member');
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const res = await API.put(`/members/${selectedMember._id}`, formData);
      if (res.data.success) {
        setShowEditModal(false);
        setSelectedMember(null);
        fetchMembers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member');
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    try {
      const res = await API.delete(`/members/${selectedMember._id}`);
      if (res.data.success) {
        setShowDeleteModal(false);
        setSelectedMember(null);
        fetchMembers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete member');
    }
  };

  const openEdit = (m) => {
    setSelectedMember(m);
    setFormData({
      name: m.user?.name || '',
      email: m.user?.email || '',
      phone: m.user?.phone || '',
      gender: m.gender || 'Male',
      assignedTrainer: m.assignedTrainer?._id || '',
      status: m.status || 'Active',
      address: m.address || ''
    });
    setShowEditModal(true);
  };

  const openView = (m) => {
    setSelectedMember(m);
    setShowViewModal(true);
  };

  const openDelete = (m) => {
    setSelectedMember(m);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Member Directory</h1>
          <p className="text-xs text-slate-400 mt-1">MongoDB CRUD Operations, Filtering & Pagination</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ name: '', email: '', password: '', phone: '', gender: 'Male', assignedTrainer: '', status: 'Active', address: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone or Member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Pending">Pending</option>
        </select>

        {/* Trainer Filter */}
        <select
          value={trainerFilter}
          onChange={(e) => setTrainerFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Trainers</option>
          {trainers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.user?.name}
            </option>
          ))}
        </select>
      </div>

      {/* Members Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Member</th>
                <th className="p-3.5">ID & Phone</th>
                <th className="p-3.5">Trainer</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Join Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">Querying MongoDB Members collection...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No members match the query parameters</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                          {m.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{m.user?.name}</div>
                          <div className="text-[10px] text-slate-400">{m.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-emerald-400">{m.memberCustomId}</div>
                      <div className="text-[10px] text-slate-400">{m.user?.phone || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {m.assignedTrainer?.user?.name || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-medium">
                        {m.currentMembership?.plan?.name || 'Basic'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(m.joinDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        m.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        m.status === 'Expiring Soon' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openView(m)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white"
                        title="View Profile & QR"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400"
                            title="Edit Member"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDelete(m)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 text-red-400"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing page {pagination.page} of {pagination.pages} ({pagination.total} Total Members)</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg text-white"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Member (Saves to MongoDB)">
        <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Password</label>
              <input
                type="password"
                placeholder="Default: Member@123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Assign Trainer</label>
              <select
                value={formData.assignedTrainer}
                onChange={(e) => setFormData({ ...formData, assignedTrainer: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              >
                <option value="">Unassigned</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.user?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Create Member Document
          </button>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Member Profile">
        <form onSubmit={handleEditMember} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Assign Trainer</label>
              <select
                value={formData.assignedTrainer}
                onChange={(e) => setFormData({ ...formData, assignedTrainer: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              >
                <option value="">Unassigned</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.user?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              >
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Update Member Record
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Member Deletion">
        <div className="text-xs space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete member <span className="font-bold text-white">{selectedMember?.user?.name}</span>?
            This will remove their User and Member records from MongoDB.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteMember}
              className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Profile & QR Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Member Profile & QR Code">
        {selectedMember && (
          <div className="text-xs space-y-4 flex flex-col items-center text-center">
            <div className="p-4 bg-white rounded-2xl">
              <QRCodeSVG value={selectedMember.memberCustomId} size={150} />
            </div>
            <div className="font-mono text-emerald-400 font-extrabold text-base">{selectedMember.memberCustomId}</div>
            <div className="space-y-1">
              <div className="font-bold text-white text-sm">{selectedMember.user?.name}</div>
              <div className="text-slate-400">{selectedMember.user?.email} • {selectedMember.user?.phone || 'No phone'}</div>
              <div className="text-slate-300">
                Trainer: <span className="text-emerald-400">{selectedMember.assignedTrainer?.user?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
