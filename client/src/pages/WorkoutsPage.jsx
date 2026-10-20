import React, { useEffect, useState } from 'react';
import { Dumbbell, Plus, Trash2, CheckCircle2, User, Sparkles } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function WorkoutsPage() {
  const { user, isMember } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [members, setMembers] = useState([]);
  const [myWorkout, setMyWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    memberId: '',
    planName: 'Push/Pull/Legs Split',
    goal: 'Hypertrophy & Strength',
    durationWeeks: 4,
    exercises: [
      { name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: 4, reps: 10, weightKg: 70, restTimeSec: 90, day: 'Push Day', notes: 'Warmup first' },
      { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', sets: 3, reps: 12, weightKg: 24, restTimeSec: 60, day: 'Push Day', notes: '' },
      { name: 'Overhead Shoulder Press', muscleGroup: 'Shoulders', sets: 3, reps: 10, weightKg: 45, restTimeSec: 60, day: 'Push Day', notes: '' },
      { name: 'Triceps Cable Pushdown', muscleGroup: 'Triceps', sets: 3, reps: 12, weightKg: 30, restTimeSec: 45, day: 'Push Day', notes: '' }
    ]
  });

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      if (isMember) {
        // Fetch current logged in member profile first to get profile ID
        const meRes = await API.get('/auth/me');
        if (meRes.data.success && meRes.data.data.profile) {
          const mId = meRes.data.data.profile._id;
          const wRes = await API.get(`/workouts/member/${mId}`);
          if (wRes.data.success) setMyWorkout(wRes.data.data);
        }
      } else {
        const res = await API.get('/workouts');
        if (res.data.success) setWorkouts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get('/members');
      if (res.data.success) setMembers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isMember) fetchMembers();
    fetchWorkouts();
  }, [user]);

  const handleAddExerciseRow = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        { name: '', muscleGroup: 'General', sets: 3, reps: 10, weightKg: 0, restTimeSec: 60, day: 'Day 1', notes: '' }
      ]
    });
  };

  const handleRemoveExerciseRow = (idx) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== idx)
    });
  };

  const handleExerciseChange = (idx, field, value) => {
    const updated = [...formData.exercises];
    updated[idx][field] = value;
    setFormData({ ...formData, exercises: updated });
  };

  const handleCreateWorkout = async (e) => {
    e.preventDefault();
    if (!formData.memberId) return alert('Select member to assign workout');

    try {
      const res = await API.post('/workouts', formData);
      if (res.data.success) {
        setShowAddModal(false);
        fetchWorkouts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workout');
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (!window.confirm('Delete workout plan?')) return;
    try {
      await API.delete(`/workouts/${id}`);
      fetchWorkouts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Workout Plan Management</h1>
          <p className="text-xs text-slate-400 mt-1">Design customized exercise routines & muscle group splits</p>
        </div>
        {!isMember && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Workout</span>
          </button>
        )}
      </div>

      {/* Member View Mode */}
      {isMember ? (
        <div className="glass-panel p-6 rounded-2xl">
          {!myWorkout ? (
            <p className="text-slate-500 text-center py-12 text-xs">No active workout plan assigned by trainer</p>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white">{myWorkout.planName}</h2>
                  <p className="text-xs text-emerald-400 mt-0.5">Goal: {myWorkout.goal} • {myWorkout.durationWeeks} Weeks Split</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                  {myWorkout.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myWorkout.exercises?.map((ex, i) => (
                  <div key={i} className="glass-card p-4 rounded-xl flex items-center justify-between border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{ex.day} • {ex.muscleGroup}</span>
                      <h4 className="font-bold text-white text-sm mt-0.5">{ex.name}</h4>
                      {ex.notes && <p className="text-[11px] text-slate-400 mt-1">{ex.notes}</p>}
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-400 text-sm bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      {ex.sets} × {ex.reps} {ex.weightKg > 0 ? `@ ${ex.weightKg}kg` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Trainer / Admin View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-slate-400">Loading Workouts...</div>
          ) : workouts.length === 0 ? (
            <div className="col-span-2 glass-panel p-12 text-center text-slate-500 text-xs">
              No workout routines created yet. Click "Create & Assign Workout" to add one!
            </div>
          ) : (
            workouts.map((w) => (
              <div key={w._id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-base">{w.planName}</h3>
                      <p className="text-xs text-slate-400">
                        Assigned to: <strong className="text-emerald-400">{w.member?.user?.name || 'Unknown'}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(w._id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {w.exercises?.map((ex, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl text-xs flex items-center justify-between border border-slate-800">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-semibold">{ex.day}</span>
                          <div className="font-bold text-slate-200">{ex.name}</div>
                        </div>
                        <div className="font-mono text-emerald-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {ex.sets} × {ex.reps} {ex.weightKg > 0 ? `@ ${ex.weightKg}kg` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Builder Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Member Workout Routine">
        <form onSubmit={handleCreateWorkout} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Target Member *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Plan Name</label>
              <input
                type="text"
                required
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Goal</label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Exercises list builder */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white">Exercises Routine List</span>
              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold"
              >
                + Add Exercise
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formData.exercises.map((ex, i) => (
                <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Exercise"
                    value={ex.name}
                    onChange={(e) => handleExerciseChange(i, 'name', e.target.value)}
                    className="col-span-4 p-1.5 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                  <input
                    type="text"
                    placeholder="Day"
                    value={ex.day}
                    onChange={(e) => handleExerciseChange(i, 'day', e.target.value)}
                    className="col-span-3 p-1.5 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                  <input
                    type="number"
                    placeholder="Sets"
                    value={ex.sets}
                    onChange={(e) => handleExerciseChange(i, 'sets', Number(e.target.value))}
                    className="col-span-2 p-1.5 bg-slate-950 border border-slate-800 rounded text-white font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) => handleExerciseChange(i, 'reps', Number(e.target.value))}
                    className="col-span-2 p-1.5 bg-slate-950 border border-slate-800 rounded text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExerciseRow(i)}
                    className="col-span-1 text-red-400 p-1 text-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Save & Assign Workout Plan
          </button>
        </form>
      </Modal>
    </div>
  );
}
