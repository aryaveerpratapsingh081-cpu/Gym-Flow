import React, { useEffect, useState } from 'react';
import { Award, Plus, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function MembershipsPage() {
  const { isAdmin } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Assign Plan Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await API.get('/memberships', { params: { status: statusFilter } });
      if (res.data.success) setMemberships(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([API.get('/members'), API.get('/plans')]);
      if (mRes.data.success) setMembers(mRes.data.data);
      if (pRes.data.success) setPlans(pRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchMemberships();
  }, [statusFilter]);

  const handleAssignMembership = async (e) => {
    e.preventDefault();
    if (!formData.memberId || !formData.planId) return alert('Select member and plan');

    try {
      const res = await API.post('/memberships', formData);
      if (res.data.success) {
        setShowAssignModal(false);
        fetchMemberships();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign plan');
    }
  };

  const selectedPlanObj = plans.find((p) => p._id === formData.planId);
  let calculatedEndDate = '';
  if (selectedPlanObj && formData.startDate) {
    const d = new Date(formData.startDate);
    d.setMonth(d.getMonth() + selectedPlanObj.durationMonths);
    calculatedEndDate = d.toISOString().split('T')[0];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Membership Management</h1>
          <p className="text-xs text-slate-400 mt-1">Assign plans to members & track automatic date calculations</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ memberId: '', planId: '', startDate: new Date().toISOString().split('T')[0] });
              setShowAssignModal(false);
              setShowAssignModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Plan to Member</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
        {['All', 'Active', 'Expiring Soon', 'Expired'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              statusFilter === st
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st} Memberships
          </button>
        ))}
      </div>

      {/* Memberships Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Member</th>
                <th className="p-3.5">Assigned Plan</th>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">End Date</th>
                <th className="p-3.5">Price Paid</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Fetching Memberships...</td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No memberships found</td>
                </tr>
              ) : (
                memberships.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-900/50">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{m.member?.user?.name || 'Unknown'}</div>
                      <div className="text-[10px] font-mono text-emerald-400">{m.member?.memberCustomId}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-200">{m.plan?.name}</span>
                      <span className="text-[10px] text-slate-400 block">{m.plan?.durationMonths} Months</span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {new Date(m.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {new Date(m.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">
                      ₹{m.pricePaid}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Membership Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Membership Plan to Member">
        <form onSubmit={handleAssignMembership} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Select Member *</label>
            <select
              required
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
            >
              <option value="">-- Choose Member --</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.user?.name} ({m.memberCustomId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Select Membership Plan *</label>
            <select
              required
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
            >
              <option value="">-- Choose Plan Tier --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} - ₹{p.price} ({p.durationMonths} Mo)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
          </div>

          {/* Auto Date Math Preview */}
          {calculatedEndDate && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <span className="font-semibold block">Automatic Date Calculation:</span>
              <span>End Date: <strong className="font-mono">{calculatedEndDate}</strong> ({selectedPlanObj?.durationMonths} months from Start Date)</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Assign Membership & Save to MongoDB
          </button>
        </form>
      </Modal>
    </div>
  );
}
