import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Award,
  CalendarCheck,
  Dumbbell,
  TrendingUp,
  User,
  Clock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Utensils,
  Calendar,
  CreditCard,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';

export default function MemberDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  // 5-minute TTL QR Token state
  const [qrTokenData, setQrTokenData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  // Freeze Modal
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState('Medical / Travel');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchMemberData = async () => {
    try {
      const res = await API.get('/dashboard/member');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, []);

  // Countdown timer for 5-minute QR token
  useEffect(() => {
    let timer;
    if (qrTokenData && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrTokenData, secondsRemaining]);

  // Generate fresh 5-minute TTL QR pass
  const handleGenerateQRPass = async () => {
    setQrLoading(true);
    try {
      const res = await API.post('/attendance/token/generate', {});
      if (res.data.success) {
        setQrTokenData(res.data.data);
        setSecondsRemaining(300);
        setShowQRModal(true);
      }
    } catch (err) {
      console.error('Failed to generate QR token:', err);
      // Fallback: open static customId modal
      setShowQRModal(true);
    } finally {
      setQrLoading(false);
    }
  };

  // Freeze membership
  const handleFreezeMembership = async () => {
    if (!data?.membership?.card?._id) return;
    setActionLoading(true);
    try {
      const res = await API.put(`/memberships/${data.membership.card._id}/freeze`, { reason: freezeReason });
      if (res.data.success) {
        setMessage('Membership frozen. Validity is currently paused.');
        setShowFreezeModal(false);
        fetchMemberData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to freeze membership');
    } finally {
      setActionLoading(false);
    }
  };

  // Resume membership
  const handleResumeMembership = async () => {
    if (!data?.membership?.card?._id) return;
    setActionLoading(true);
    try {
      const res = await API.put(`/memberships/${data.membership.card._id}/resume`, {});
      if (res.data.success) {
        setMessage('Membership resumed! Validity extended by days frozen.');
        fetchMemberData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resume membership');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Member Portal & Database Records...</div>;
  }

  const { member, membership, attendance, workout, dietPlan, progress, upcomingBookings, upcomingSessions, payments } = data || {};
  const isFrozen = membership?.card?.status === 'Frozen' || membership?.card?.isFrozen;

  return (
    <div className="space-y-6">
      {/* Alert banner if frozen or message */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {isFrozen && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 shrink-0" />
            <span>Your membership is currently <strong>FROZEN</strong>. Your plan validity is on hold.</span>
          </div>
          <button
            onClick={handleResumeMembership}
            disabled={actionLoading}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 cursor-pointer"
          >
            {actionLoading ? 'Resuming...' : 'Resume Membership'}
          </button>
        </div>
      )}

      {/* Header & QR Code Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome back, {member?.user?.name}!</h1>
          <p className="text-xs text-slate-400 mt-1">
            Member Portal • ID: <span className="font-mono text-emerald-400 font-bold">{member?.memberCustomId}</span> • Plan: <span className="text-white font-semibold">{membership?.card?.plan?.name || 'Active Member'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isFrozen ? (
            <button
              onClick={() => setShowFreezeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Pause plan validity"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              <span>Freeze Plan</span>
            </button>
          ) : (
            <button
              onClick={handleResumeMembership}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume Plan</span>
            </button>
          )}

          <button
            onClick={handleGenerateQRPass}
            disabled={qrLoading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{qrLoading ? 'Generating Pass...' : '5-Min QR Pass'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Plan Days Remaining"
          value={isFrozen ? 'PAUSED' : `${membership?.daysRemaining || 0} Days`}
          subtext={`Expires: ${membership?.card?.endDate ? new Date(membership.card.endDate).toLocaleDateString() : 'N/A'}`}
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendance?.percentage || 0}%`}
          subtext={`${attendance?.monthVisits || 0} visits this month`}
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Bench Press PR"
          value={`${progress?.latest?.benchPressPRKg || 0} kg`}
          subtext="Personal Record"
          icon={Dumbbell}
          color="purple"
        />
        <StatCard
          title="Deadlift PR"
          value={`${progress?.latest?.deadliftPRKg || 0} kg`}
          subtext="Personal Record"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Membership Digital Card & Assigned Trainer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membership Digital Pass Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-[#0a0d12] border border-emerald-500/30 p-6 flex flex-col justify-between shadow-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">GymFlow Digital Pass</span>
              </div>
              <h2 className="text-xl font-black text-white">{membership?.card?.plan?.name || 'Active Membership'}</h2>
              <span className="text-xs text-slate-400 font-mono">{member?.memberCustomId}</span>
            </div>
            <Award className="w-8 h-8 text-emerald-400 opacity-80" />
          </div>

          <div className="space-y-2 my-6">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Status</span>
              <span className={`font-bold ${isFrozen ? 'text-amber-400' : 'text-emerald-400'}`}>
                {membership?.card?.status || 'Active'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Valid From</span>
              <span className="text-white font-medium">
                {membership?.card?.startDate ? new Date(membership.card.startDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Valid Until</span>
              <span className="text-white font-medium">
                {membership?.card?.endDate ? new Date(membership.card.endDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Payment Status</span>
              <span className="text-emerald-400 font-bold">{membership?.card?.paymentStatus || 'Paid'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Anti-Spoofing Single-Use QR Pass</span>
            <span className="text-emerald-400 font-mono font-bold">5-MIN TTL</span>
          </div>
        </div>

        {/* Assigned Trainer Profile */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> Assigned Personal Coach
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                PRO TRAINER
              </span>
            </div>

            {member?.assignedTrainer ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-lg">
                    {member.assignedTrainer.user?.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{member.assignedTrainer.user?.name}</h4>
                    <p className="text-xs text-slate-400">{member.assignedTrainer.specialization}</p>
                    <p className="text-[11px] text-slate-500">{member.assignedTrainer.experienceYears} Years Coaching Experience</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3">
                  <div className="font-semibold text-white mb-0.5">Availability:</div>
                  <div className="text-slate-400">{member.assignedTrainer.availability || 'Morning & Evening Shifts'}</div>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Contact:</span> {member.assignedTrainer.user?.phone || member.assignedTrainer.user?.email}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No personal trainer assigned yet. Inquire at the front desk or choose Gold/Premium tier.
              </div>
            )}
          </div>
        </div>

        {/* Nutrition & Diet Snapshot */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" /> Diet & Nutrition Target
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                {dietPlan?.fitnessGoal || 'Active Plan'}
              </span>
            </div>

            {dietPlan ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-white">{dietPlan.targetDailyCalories} <span className="text-xs font-normal text-slate-400">kcal/day</span></div>
                  <div className="text-[11px] text-emerald-400 font-semibold">{dietPlan.title}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-white">{dietPlan.targetProteinGrams}g</div>
                    <div className="text-[10px] text-slate-400">Protein</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-white">{dietPlan.targetCarbsGrams}g</div>
                    <div className="text-[10px] text-slate-400">Carbs</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-white">{dietPlan.targetFatsGrams}g</div>
                    <div className="text-[10px] text-slate-400">Fats</div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 pt-1">
                  <span>{dietPlan.meals?.length || 0} scheduled meals daily • {dietPlan.waterIntakeLiters || 3.5}L water intake</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No active custom diet plan assigned yet. Ask your coach for a macro breakdown.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Workout Protocol & Schedule */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" /> Assigned Workout Protocol
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{workout?.planName || 'Push-Pull-Legs Routine'}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            {workout?.status || 'Active'}
          </span>
        </div>

        {workout?.exercises && workout.exercises.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Day / Split</th>
                  <th className="pb-2">Exercise Name</th>
                  <th className="pb-2">Muscle Group</th>
                  <th className="pb-2">Sets × Reps</th>
                  <th className="pb-2">Target Weight</th>
                  <th className="pb-2 text-right">Rest Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workout.exercises.map((ex, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-semibold text-slate-300">{ex.day || 'Day 1'}</td>
                    <td className="py-2.5 font-bold text-white">{ex.name}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {ex.muscleGroup}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-emerald-400">{ex.sets} × {ex.reps}</td>
                    <td className="py-2.5 text-slate-300">{ex.weightKg ? `${ex.weightKg} kg` : 'Bodyweight'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-400">{ex.restTimeSec || 60}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            Your personal workout exercises are being updated by your trainer.
          </div>
        )}
      </div>

      {/* Progress Chart: Strength Bench & Deadlift PR Milestones */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Strength & PR Progression History
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">Historical Bench Press and Deadlift personal records over time</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progress?.records || []}>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#64748b" fontSize={11} unit=" kg" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelFormatter={(d) => new Date(d).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="benchPressPRKg" name="Bench Press PR" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="deadliftPRKg" name="Deadlift PR" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="weightKg" name="Body Weight" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5-Minute TTL QR Pass Modal */}
      {showQRModal && (
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Fast QR Check-in Pass">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="p-4 bg-white rounded-2xl shadow-2xl mb-4 border-4 border-emerald-500">
              <QRCodeSVG
                value={qrTokenData?.token || member?.memberCustomId || 'GF-1001'}
                size={210}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Valid for: {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}</span>
            </div>

            <p className="text-xs text-slate-400 max-w-xs mb-3">
              Scan this QR code at the gym reception or camera kiosk to verify entry. This token automatically expires in 5 minutes to prevent pass sharing.
            </p>

            <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Manual Member ID:</span>
              <span className="font-mono font-bold text-emerald-400">{member?.memberCustomId}</span>
            </div>

            <button
              onClick={handleGenerateQRPass}
              disabled={qrLoading}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Fresh Pass</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Freeze Membership Modal */}
      {showFreezeModal && (
        <Modal isOpen={showFreezeModal} onClose={() => setShowFreezeModal(false)} title="Freeze Membership">
          <div className="space-y-4 p-2 text-xs">
            <p className="text-slate-400">
              Freezing pauses your membership validity so days are not lost while traveling or recovering from injury.
            </p>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reason for Freezing</label>
              <select
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                <option value="Medical / Injury Recovery">Medical / Injury Recovery</option>
                <option value="Travel / Vacation">Travel / Vacation</option>
                <option value="Exam / Work Travel">Exam / Work Travel</option>
                <option value="Personal Break">Personal Break</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFreezeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFreezeMembership}
                disabled={actionLoading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Freezing...' : 'Confirm Freeze'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
