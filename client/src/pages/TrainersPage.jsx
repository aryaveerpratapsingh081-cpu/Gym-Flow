import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Edit, Trash2, Users, Award, Shield } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function TrainersPage() {
  const { isAdmin } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerMembers, setTrainerMembers] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'General Fitness & Strength',
    experienceYears: 2,
    availability: 'Morning & Evening (6 AM - 9 PM)',
    bio: ''
  });

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/trainers');
      if (res.data.success) {
        setTrainers(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/trainers', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', phone: '', specialization: 'General Fitness', experienceYears: 2, availability: '', bio: '' });
        fetchTrainers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add trainer');
    }
  };

  const handleEditTrainer = async (e) => {
    e.preventDefault();
    if (!selectedTrainer) return;
    try {
      const res = await API.put(`/trainers/${selectedTrainer._id}`, formData);
      if (res.data.success) {
        setShowEditModal(false);
        fetchTrainers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update trainer');
    }
  };

  const handleDeleteTrainer = async () => {
    if (!selectedTrainer) return;
    try {
      const res = await API.delete(`/trainers/${selectedTrainer._id}`);
      if (res.data.success) {
        setShowDeleteModal(false);
        fetchTrainers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trainer');
    }
  };

  const openView = async (t) => {
    setSelectedTrainer(t);
    try {
      const res = await API.get(`/trainers/${t._id}`);
      if (res.data.success) {
        setTrainerMembers(res.data.data.assignedMembers);
      }
    } catch (e) {
      console.error(e);
    }
    setShowViewModal(true);
  };

  const openEdit = (t) => {
    setSelectedTrainer(t);
    setFormData({
      name: t.user?.name || '',
      email: t.user?.email || '',
      phone: t.user?.phone || '',
      specialization: t.specialization || '',
      experienceYears: t.experienceYears || 1,
      availability: t.availability || '',
      bio: t.bio || ''
    });
    setShowEditModal(true);
  };

  const openDelete = (t) => {
    setSelectedTrainer(t);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Trainer Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage certified gym trainers & view assigned trainees</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ name: '', email: '', password: '', phone: '', specialization: 'General Fitness', experienceYears: 2, availability: '', bio: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Trainer</span>
          </button>
        )}
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading Trainers...</div>
        ) : (
          trainers.map((t) => (
            <div key={t._id} className="glass-card p-5 rounded-2xl flex flex-col justify-between border-slate-800 hover:border-emerald-500/40">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center text-lg">
                    {t.user?.name?.charAt(0)}
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold font-mono">
                    {t.assignedMembersCount || 0} Trainees
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{t.user?.name}</h3>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">{t.specialization}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                  <div>Experience: <span className="text-slate-200 font-bold">{t.experienceYears} Years</span></div>
                  <div>Availability: <span className="text-slate-300">{t.availability}</span></div>
                  <div>Phone: <span className="text-slate-300">{t.user?.phone || 'N/A'}</span></div>
                </div>

                {t.bio && <p className="text-[11px] text-slate-400 mt-3 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{t.bio}</p>}
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => openView(t)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Trainees</span>
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => openEdit(t)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl border border-slate-800"
                      title="Edit Trainer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(t)}
                      className="p-2 bg-slate-900 hover:bg-red-950/60 text-red-400 rounded-xl border border-slate-800"
                      title="Delete Trainer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Trainer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Trainer (MongoDB)">
        <form onSubmit={handleCreateTrainer} className="space-y-3 text-xs">
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
            <label className="text-slate-300 font-semibold block mb-1">Email *</label>
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
                placeholder="Default: Trainer@123"
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
              <label className="text-slate-300 font-semibold block mb-1">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Experience (Years)</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Create Trainer Document
          </button>
        </form>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Trainer Details">
        <form onSubmit={handleEditTrainer} className="space-y-3 text-xs">
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
            <label className="text-slate-300 font-semibold block mb-1">Specialization</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Update Trainer Record
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Trainer Deletion">
        <div className="text-xs space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete trainer <span className="font-bold text-white">{selectedTrainer?.user?.name}</span>?
            Their assigned members will be set to unassigned status in MongoDB.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTrainer}
              className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Trainees Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Trainees Assigned to ${selectedTrainer?.user?.name || 'Trainer'}`}>
        <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
          {trainerMembers.length === 0 ? (
            <p className="text-slate-500 py-6 text-center">No members currently assigned to this trainer</p>
          ) : (
            trainerMembers.map((m) => (
              <div key={m._id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{m.user?.name}</div>
                  <div className="text-[10px] text-slate-400">ID: {m.memberCustomId} • {m.user?.phone}</div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {m.currentMembership?.plan?.name || 'Basic'}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
