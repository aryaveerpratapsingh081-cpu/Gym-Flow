import React, { useEffect, useState } from 'react';
import { Target, Plus, UserCheck, Phone, Mail, Clock, MessageSquare, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Add form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('General Fitness');
  const [source, setSource] = useState('Walk-in');
  const [notes, setNotes] = useState('');

  // Convert form
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [convertPassword, setConvertPassword] = useState('Member@123');

  // Follow-up form
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('Contacted');

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/leads${statusFilter !== 'All' ? `?status=${statusFilter}` : ''}`);
      if (res.data.success) {
        setLeads(res.data.data);
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    API.get('/plans?status=Active').then(res => {
      if (res.data.success && res.data.data.length > 0) {
        setPlans(res.data.data);
        setSelectedPlanId(res.data.data[0]._id);
      }
    });
  }, [statusFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await API.post('/leads', {
        fullName,
        email,
        phone,
        interest,
        source,
        notes,
        hasTrialPass: true
      });
      if (res.data.success) {
        setMsg(`Prospect ${fullName} registered with 3-day complimentary trial pass!`);
        setShowAddModal(false);
        fetchLeads();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await API.post(`/leads/${selectedLead._id}/convert`, {
        planId: selectedPlanId,
        password: convertPassword
      });
      if (res.data.success) {
        setMsg(`Success! ${selectedLead.fullName} converted to Member (${res.data.data.customId})!`);
        setShowConvertModal(false);
        fetchLeads();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setActionLoading(true);
    try {
      const res = await API.post(`/leads/${selectedLead._id}/follow-up`, {
        notes: followUpNotes,
        status: followUpStatus
      });
      if (res.data.success) {
        setMsg('Follow-up interaction logged.');
        setShowFollowUpModal(false);
        fetchLeads();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add follow up');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Leads & Trial Passes Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">
            Prospect Acquisition • 3-Day Free Trial Tracking • Duplicate-Safe Member Conversion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Prospect</span>
          </button>
          <button
            onClick={fetchLeads}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Total Enquiries</div>
          <div className="text-2xl font-black text-white">{stats?.total || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Active Trial Passes</div>
          <div className="text-2xl font-black text-emerald-400">{stats?.trialActive || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Converted Members</div>
          <div className="text-2xl font-black text-purple-400">{stats?.converted || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'New', 'Trial Active', 'Contacted', 'Converted', 'Lost'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Prospect Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Interest & Source</th>
                <th className="py-3 px-4">Trial Status</th>
                <th className="py-3 px-4">Interactions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">Loading prospects...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">No leads found in this pipeline filter.</td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isConverted = lead.status === 'Converted';
                  const isTrialActive = lead.status === 'Trial Active';

                  return (
                    <tr key={lead._id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{lead.fullName}</div>
                        <div className="text-[10px] text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{lead.interest}</div>
                        <div className="text-[10px] text-slate-400">{lead.source}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isConverted
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : isTrialActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {lead.status}
                        </span>
                        {isTrialActive && lead.trialEndDate && (
                          <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                            Pass valid till {new Date(lead.trialEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span>{lead.followUps?.length || 0} follow-up calls</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowFollowUpModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                            title="Log follow-up"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {!isConverted ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowConvertModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Convert</span>
                            </button>
                          ) : (
                            <span className="text-purple-400 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Member
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Prospect & Issue Trial Pass">
          <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sameer Verma"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prospect@gmail.com"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Interest</label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="General Fitness">General Fitness</option>
                  <option value="Bodybuilding">Bodybuilding</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="CrossFit">CrossFit</option>
                  <option value="Yoga & Wellness">Yoga & Wellness</option>
                  <option value="Personal Training">Personal Training</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Enquiry Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Website">Website</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                  <option value="Google Search">Google Search</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Enquiry Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                placeholder="Inquired about annual packages and timing..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Issue 3-Day Pass'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Convert Lead Modal */}
      {showConvertModal && selectedLead && (
        <Modal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} title={`Convert ${selectedLead.fullName} to Member`}>
          <form onSubmit={handleConvert} className="space-y-4 text-xs">
            <p className="text-slate-400">
              Converts prospect directly into an active GymFlow Member with login credentials and chosen subscription plan. Duplicate email creation is prevented.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Choose Subscription Plan *</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                {plans.map(p => (
                  <option key={p._id} value={p._id}>{p.name} - ₹{p.price} ({p.durationMonths} Months)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Temporary Password</label>
              <input
                type="password"
                value={convertPassword}
                onChange={(e) => setConvertPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Converting...' : 'Complete Conversion'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedLead && (
        <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title={`Log Interaction: ${selectedLead.fullName}`}>
          <form onSubmit={handleAddFollowUp} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Update Status</label>
              <select
                value={followUpStatus}
                onChange={(e) => setFollowUpStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                <option value="Contacted">Contacted</option>
                <option value="Trial Active">Trial Active</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Interaction Notes *</label>
              <textarea
                required
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows="3"
                placeholder="Called prospect. Loved the steam room, deciding between Silver and Gold..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Record Log'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
