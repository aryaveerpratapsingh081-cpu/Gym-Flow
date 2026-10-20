import React, { useEffect, useState } from 'react';
import { Lock, Unlock, User, CheckCircle2, AlertCircle, RefreshCw, Plus, ShieldCheck } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function LockersPage() {
  const { isAdmin, isTrainer } = useAuth();
  const [lockers, setLockers] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Allocation modal
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [releaseDays, setReleaseDays] = useState(30);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchLockers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (zoneFilter !== 'All') query.append('zone', zoneFilter);
      if (statusFilter !== 'All') query.append('status', statusFilter);

      const res = await API.get(`/lockers?${query.toString()}`);
      if (res.data.success) {
        setLockers(res.data.data);
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockers();
    if (isAdmin || isTrainer) {
      API.get('/members?limit=100').then((res) => {
        if (res.data.success) {
          setMembers(res.data.data);
          if (res.data.data.length > 0) setSelectedMemberId(res.data.data[0]._id);
        }
      });
    }
  }, [zoneFilter, statusFilter]);

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedLocker || !selectedMemberId) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await API.post(`/lockers/${selectedLocker._id}/allocate`, {
        memberId: selectedMemberId,
        releaseDays: Number(releaseDays)
      });
      if (res.data.success) {
        setMsg(res.data.message);
        setShowAllocateModal(false);
        fetchLockers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate locker');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async (lockerId) => {
    if (!window.confirm('Are you sure you want to release this locker?')) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await API.post(`/lockers/${lockerId}/release`, {});
      if (res.data.success) {
        setMsg(res.data.message);
        fetchLockers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release locker');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Smart Locker Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Locker Bay Allocation • Concurrency-Safe Updates via Atomic findOneAndUpdate • Zero Double-Allocations
          </p>
        </div>

        <button
          onClick={fetchLockers}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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
          <div className="text-xs text-slate-400 mb-1">Total Lockers</div>
          <div className="text-2xl font-black text-white">{stats?.total || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Available Lockers</div>
          <div className="text-2xl font-black text-emerald-400">{stats?.available || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Allocated Lockers</div>
          <div className="text-2xl font-black text-purple-400">{stats?.allocated || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
        >
          <option value="All">All Floor Zones</option>
          <option value="Ground Floor A">Ground Floor A</option>
          <option value="First Floor Men">First Floor Men</option>
          <option value="First Floor Women">First Floor Women</option>
          <option value="VIP Lounge">VIP Lounge</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available Only</option>
          <option value="Allocated">Allocated Only</option>
        </select>
      </div>

      {/* Lockers Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading locker bays...</div>
      ) : lockers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">No lockers found in this filter.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {lockers.map((l) => {
            const isAllocated = l.status === 'Allocated';

            return (
              <div
                key={l._id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isAllocated
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-sm text-white">{l.lockerNumber}</span>
                    {isAllocated ? (
                      <Lock className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mb-2">{l.zone}</div>

                  {isAllocated && l.assignedMember ? (
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[10px] space-y-1 mb-2">
                      <div className="font-bold text-white truncate">{l.assignedMember.user?.name}</div>
                      <div className="text-slate-400 font-mono">{l.assignedMember.memberCustomId}</div>
                      <div className="text-purple-400 text-[9px]">
                        Until {l.releaseDate ? new Date(l.releaseDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold text-center mb-2">
                      Available
                    </div>
                  )}
                </div>

                {(isAdmin || isTrainer) && (
                  <div className="pt-2">
                    {isAllocated ? (
                      <button
                        onClick={() => handleRelease(l._id)}
                        disabled={actionLoading}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        Release
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedLocker(l);
                          setShowAllocateModal(true);
                        }}
                        className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        Allocate
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && selectedLocker && (
        <Modal
          isOpen={showAllocateModal}
          onClose={() => setShowAllocateModal(false)}
          title={`Allocate Locker: ${selectedLocker.lockerNumber}`}
        >
          <form onSubmit={handleAllocate} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Locker Zone:</span>
              <span className="font-semibold text-white">{selectedLocker.zone}</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Member *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.user?.name} ({m.memberCustomId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Allocation Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={releaseDays}
                onChange={(e) => setReleaseDays(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Allocating...' : 'Confirm Allocation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
