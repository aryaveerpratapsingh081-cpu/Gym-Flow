import React, { useEffect, useState } from 'react';
import { Utensils, Plus, CheckCircle2, User, Clock, RefreshCw, Droplet, Flame } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function DietPlansPage() {
  const { isAdmin, isTrainer } = useAuth();
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Muscle Gain');
  const [targetCalories, setTargetCalories] = useState(2500);
  const [protein, setProtein] = useState(160);
  const [carbs, setCarbs] = useState(280);
  const [fats, setFats] = useState(70);
  const [water, setWater] = useState(3.5);

  // Meal items
  const [meals, setMeals] = useState([
    { mealName: 'Breakfast', mealTime: '08:00 AM', calories: 600, foodItems: [{ name: 'Oats with whey & banana', quantity: '1 bowl', calories: 600, protein: 35 }] },
    { mealName: 'Lunch', mealTime: '01:30 PM', calories: 800, foodItems: [{ name: 'Brown rice with grilled chicken & veggies', quantity: '200g chicken + 150g rice', calories: 800, protein: 55 }] },
    { mealName: 'Dinner', mealTime: '08:30 PM', calories: 700, foodItems: [{ name: 'Paneer or Salmon with sweet potatoes & greens', quantity: '1 plate', calories: 700, protein: 40 }] }
  ]);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchDietPlans = async () => {
    setLoading(true);
    try {
      const res = await API.get('/diet-plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDietPlans();
    if (isAdmin || isTrainer) {
      API.get('/members?limit=100').then((res) => {
        if (res.data.success) {
          setMembers(res.data.data);
          if (res.data.data.length > 0) setMemberId(res.data.data[0]._id);
        }
      });
    }
  }, []);

  const handleCreateDietPlan = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await API.post('/diet-plans', {
        memberId,
        title,
        fitnessGoal,
        targetDailyCalories: Number(targetCalories),
        targetProteinGrams: Number(protein),
        targetCarbsGrams: Number(carbs),
        targetFatsGrams: Number(fats),
        waterIntakeLiters: Number(water),
        meals
      });
      if (res.data.success) {
        setMsg('Diet and nutrition protocol assigned successfully!');
        setShowAddModal(false);
        fetchDietPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create diet plan');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Diet & Nutrition Plans</h1>
          <p className="text-xs text-slate-400 mt-1">
            Custom Calorie Targets • Embedded Meals & Macro Nutrients • Trainer Dietary Prescriptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isTrainer) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Diet Plan</span>
            </button>
          )}
          <button
            onClick={fetchDietPlans}
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

      {/* Plans List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading diet plans...</div>
      ) : plans.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">No active diet plans assigned.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((dp) => (
            <div key={dp._id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {dp.fitnessGoal}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{dp.title}</h3>
                  <p className="text-xs text-slate-400">
                    Assigned to: <strong className="text-white">{dp.member?.user?.name}</strong> ({dp.member?.memberCustomId})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-400 flex items-center gap-1 justify-end">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <span>{dp.targetDailyCalories}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">kcal / day</div>
                </div>
              </div>

              {/* Macros Breakdown Bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">{dp.targetProteinGrams}g</div>
                  <div className="text-[10px] text-slate-400">Protein</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">{dp.targetCarbsGrams}g</div>
                  <div className="text-[10px] text-slate-400">Carbs</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-white">{dp.targetFatsGrams}g</div>
                  <div className="text-[10px] text-slate-400">Fats</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-blue-400">{dp.waterIntakeLiters}L</div>
                  <div className="text-[10px] text-slate-400">Water</div>
                </div>
              </div>

              {/* Meals List */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Daily Meals</h4>
                {dp.meals?.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">{m.mealName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{m.mealTime} • {m.calories} kcal</span>
                    </div>
                    {m.foodItems?.map((f, fIdx) => (
                      <div key={fIdx} className="text-slate-300 text-[11px]">
                        • {f.name} <span className="text-slate-500">({f.quantity})</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Diet Plan Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Diet & Nutrition Plan">
          <form onSubmit={handleCreateDietPlan} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Member *</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.user?.name} ({m.memberCustomId})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lean Bulk Nutrition 2800 kcal"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fitness Goal</label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Lean Bulk">Lean Bulk</option>
                  <option value="Endurance">Endurance</option>
                  <option value="General Health">General Health</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Calories</label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
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
                {actionLoading ? 'Assigning...' : 'Assign Diet Plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
