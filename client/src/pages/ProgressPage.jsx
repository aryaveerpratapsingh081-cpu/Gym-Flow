import React, { useEffect, useState } from 'react';
import { TrendingUp, Plus, Dumbbell, Activity, Calendar, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function ProgressPage() {
  const { user, isMember } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [progressRecords, setProgressRecords] = useState([]);
  const [latestProgress, setLatestProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    memberId: '',
    weightKg: '',
    bodyFatPercentage: '',
    chestCm: '',
    waistCm: '',
    bicepsCm: '',
    benchPressPRKg: '',
    squatPRKg: '',
    deadliftPRKg: '',
    notes: ''
  });

  const fetchMembers = async () => {
    try {
      const res = await API.get('/members');
      if (res.data.success) {
        setMembers(res.data.data);
        if (res.data.data.length > 0 && !selectedMemberId) {
          setSelectedMemberId(res.data.data[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProgress = async (mId) => {
    if (!mId) return;
    setLoading(true);
    try {
      const res = await API.get(`/progress/member/${mId}`);
      if (res.data.success) {
        setProgressRecords(res.data.data);
        setLatestProgress(res.data.latest);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMember) {
      API.get('/auth/me').then((res) => {
        if (res.data.success && res.data.data.profile) {
          const mId = res.data.data.profile._id;
          setSelectedMemberId(mId);
          fetchProgress(mId);
        }
      });
    } else {
      fetchMembers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedMemberId) {
      fetchProgress(selectedMemberId);
    }
  }, [selectedMemberId]);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    const targetId = isMember ? selectedMemberId : formData.memberId;
    if (!targetId || !formData.weightKg) return alert('Member and weight are required');

    try {
      const res = await API.post('/progress', {
        ...formData,
        memberId: targetId
      });
      if (res.data.success) {
        setShowAddModal(false);
        fetchProgress(targetId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log progress');
    }
  };

  const formattedChartData = progressRecords.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: p.weightKg,
    bodyFat: p.bodyFatPercentage,
    benchPR: p.benchPressPRKg,
    squatPR: p.squatPRKg,
    deadliftPR: p.deadliftPRKg
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Body Transformation & PR Benchmarks</h1>
          <p className="text-xs text-slate-400 mt-1">Time-series tracking for Weight, Body Fat, and Powerlifting Personal Records</p>
        </div>

        {!isMember && (
          <button
            onClick={() => {
              setFormData({ memberId: selectedMemberId, weightKg: '', bodyFatPercentage: '', chestCm: '', waistCm: '', bicepsCm: '', benchPressPRKg: '', squatPRKg: '', deadliftPRKg: '', notes: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Body Metrics & PRs</span>
          </button>
        )}
      </div>

      {/* Member Selector Dropdown for Trainer */}
      {!isMember && (
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">Select Member to View Charts:</span>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.user?.name} ({m.memberCustomId})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Latest Metrics Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold block">Current Weight</span>
          <span className="text-2xl font-black text-white mt-1 block">
            {latestProgress?.weightKg ? `${latestProgress.weightKg} kg` : 'N/A'}
          </span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold block">Body Fat %</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {latestProgress?.bodyFatPercentage ? `${latestProgress.bodyFatPercentage}%` : 'N/A'}
          </span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold block">Bench Press PR</span>
          <span className="text-2xl font-black text-purple-400 mt-1 block font-mono">
            {latestProgress?.benchPressPRKg ? `${latestProgress.benchPressPRKg} kg` : 'N/A'}
          </span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold block">Squat / Deadlift PR</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">
            {latestProgress?.squatPRKg || 0} / {latestProgress?.deadliftPRKg || 0} kg
          </span>
        </div>
      </div>

      {/* Progress Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight & Body Fat Trend */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-1">Body Weight & Fat % Progression</h3>
          <p className="text-[11px] text-slate-400 mb-4">Historical measurement entries</p>
          <div className="h-64 w-full">
            {formattedChartData.length === 0 ? (
              <p className="text-xs text-slate-500 py-16 text-center">No progress history recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#121721', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="bodyFat" name="Body Fat (%)" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Big 3 Strength PR Progression */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-1">Strength PR Benchmarks (Bench/Squat/Deadlift)</h3>
          <p className="text-[11px] text-slate-400 mb-4">Personal records tracked in kg</p>
          <div className="h-64 w-full">
            {formattedChartData.length === 0 ? (
              <p className="text-xs text-slate-500 py-16 text-center">No PR entries recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#121721', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="benchPR" name="Bench Press (kg)" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="squatPR" name="Squat (kg)" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="deadliftPR" name="Deadlift (kg)" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Log Progress Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Log Body Metrics & Strength PRs">
        <form onSubmit={handleAddProgress} className="space-y-3 text-xs">
          {!isMember && (
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Body Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 78.5"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 18.2"
                value={formData.bodyFatPercentage}
                onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2">
            <span className="font-bold text-white block mb-2">Personal Records (PR Benchmarks)</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-1 text-[10px]">Bench (kg)</label>
                <input
                  type="number"
                  placeholder="85"
                  value={formData.benchPressPRKg}
                  onChange={(e) => setFormData({ ...formData, benchPressPRKg: e.target.value })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[10px]">Squat (kg)</label>
                <input
                  type="number"
                  placeholder="110"
                  value={formData.squatPRKg}
                  onChange={(e) => setFormData({ ...formData, squatPRKg: e.target.value })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[10px]">Deadlift (kg)</label>
                <input
                  type="number"
                  placeholder="140"
                  value={formData.deadliftPRKg}
                  onChange={(e) => setFormData({ ...formData, deadliftPRKg: e.target.value })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Save Progress Log to MongoDB
          </button>
        </form>
      </Modal>
    </div>
  );
}
