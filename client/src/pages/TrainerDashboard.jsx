import React, { useEffect, useState } from 'react';
import { Users, CalendarCheck, Dumbbell, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import StatCard from '../components/StatCard';

export default function TrainerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/trainer')
      .then((res) => {
        if (res.data.success) setData(res.data.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Trainer Dashboard...</div>;
  }

  const { stats, assignedMembers, membersNeedingProgress } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Trainer Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Manage assigned trainees, workouts & progress reviews</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/workouts"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workout</span>
          </Link>
          <Link
            to="/progress"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Log Progress</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Members"
          value={stats?.assignedMembersCount || 0}
          subtext="Under your guidance"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Today's Attendance"
          value={stats?.todayAttendanceCount || 0}
          subtext="Assigned check-ins"
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Active Workouts"
          value={stats?.activeWorkoutsCount || 0}
          subtext="Assigned routines"
          icon={Dumbbell}
          color="purple"
        />
        <StatCard
          title="Progress Due"
          value={stats?.needingProgressCount || 0}
          subtext=">14 days since review"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Assigned Members Table & Progress Review Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Members Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Assigned Trainees List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Member ID</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!assignedMembers || assignedMembers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-500">No members currently assigned to you</td>
                  </tr>
                ) : (
                  assignedMembers.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                          {m.user?.name?.charAt(0)}
                        </div>
                        <span>{m.user?.name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{m.memberCustomId}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                          {m.currentMembership?.plan?.name || 'Basic'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Link
                          to="/workouts"
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] border border-slate-800"
                        >
                          Workout
                        </Link>
                        <Link
                          to="/progress"
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-[11px] border border-emerald-500/30 font-semibold"
                        >
                          Progress
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress Alert Sidebar */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Needing Progress Review</span>
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">Members without updated measurements in 14+ days</p>

          <div className="space-y-3">
            {!membersNeedingProgress || membersNeedingProgress.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">All assigned members have up-to-date progress logs!</p>
            ) : (
              membersNeedingProgress.map((m) => (
                <div key={m._id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{m.user?.name}</div>
                    <div className="text-[10px] text-slate-400">ID: {m.memberCustomId}</div>
                  </div>
                  <Link
                    to="/progress"
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold"
                  >
                    Log Now
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
