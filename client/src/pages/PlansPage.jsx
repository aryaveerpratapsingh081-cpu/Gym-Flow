import React, { useEffect, useState } from 'react';
import { Dumbbell, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function PlansPage() {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    durationMonths: 1,
    price: 999,
    description: '',
    featuresText: 'Gym Access, Showers, Basic Support'
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await API.get('/plans');
      if (res.data.success) setPlans(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const features = formData.featuresText.split(',').map((f) => f.trim()).filter(Boolean);
    try {
      const res = await API.post('/plans', {
        name: formData.name,
        durationMonths: Number(formData.durationMonths),
        price: Number(formData.price),
        description: formData.description,
        features
      });
      if (res.data.success) {
        setShowAddModal(false);
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleEditPlan = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const features = formData.featuresText.split(',').map((f) => f.trim()).filter(Boolean);
    try {
      const res = await API.put(`/plans/${selectedPlan._id}`, {
        name: formData.name,
        durationMonths: Number(formData.durationMonths),
        price: Number(formData.price),
        description: formData.description,
        features
      });
      if (res.data.success) {
        setShowEditModal(false);
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      const res = await API.delete(`/plans/${selectedPlan._id}`);
      if (res.data.success) {
        setShowDeleteModal(false);
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const openEdit = (p) => {
    setSelectedPlan(p);
    setFormData({
      name: p.name,
      durationMonths: p.durationMonths,
      price: p.price,
      description: p.description || '',
      featuresText: p.features ? p.features.join(', ') : ''
    });
    setShowEditModal(true);
  };

  const openDelete = (p) => {
    setSelectedPlan(p);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Membership Catalog Plans</h1>
          <p className="text-xs text-slate-400 mt-1">Configure subscription tiers stored in MongoDB Plans collection</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ name: '', durationMonths: 1, price: 999, description: '', featuresText: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 text-center py-12 text-slate-400">Loading Plans...</div>
        ) : (
          plans.map((p) => (
            <div key={p._id} className="glass-card p-6 rounded-2xl flex flex-col justify-between border-slate-800 hover:border-emerald-500/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {p.status}
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-3xl font-black text-emerald-400">₹{p.price}</span>
                  <span className="text-xs text-slate-400 font-medium"> / {p.durationMonths} Mo</span>
                </div>

                <p className="text-xs text-slate-400 mb-4">{p.description}</p>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  {p.features?.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    onClick={() => openDelete(p)}
                    className="p-2 bg-slate-900 hover:bg-red-950/60 text-red-400 rounded-xl border border-slate-800"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Plan Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Membership Plan">
        <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Plan Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Titanium Platinum"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Duration (Months) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Features (Comma Separated)</label>
            <textarea
              rows="3"
              placeholder="Gym Floor Access, Personal Trainer, Sauna"
              value={formData.featuresText}
              onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Save Plan to MongoDB
          </button>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Plan Details">
        <form onSubmit={handleEditPlan} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Plan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Duration (Months)</label>
              <input
                type="number"
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Update Plan Record
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Plan Deletion">
        <div className="text-xs space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete plan <span className="font-bold text-white">{selectedPlan?.name}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePlan}
              className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
