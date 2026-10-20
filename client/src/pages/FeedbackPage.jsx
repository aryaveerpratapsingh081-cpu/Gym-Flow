import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2, User, RefreshCw } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';

export default function FeedbackPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [category, setCategory] = useState('Trainer');
  const [trainerId, setTrainerId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchFeedbackData = async () => {
    setLoading(true);
    try {
      const [revRes, statsRes] = await Promise.all([
        API.get('/feedback'),
        API.get('/feedback/stats')
      ]);
      if (revRes.data.success) setReviews(revRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackData();
    API.get('/trainers').then(res => {
      if (res.data.success) {
        setTrainers(res.data.data);
        if (res.data.data.length > 0) setTrainerId(res.data.data[0]._id);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await API.post('/feedback', {
        category,
        trainerId: category === 'Trainer' ? trainerId : null,
        rating: Number(rating),
        comment
      });
      if (res.data.success) {
        setMsg('Review submitted successfully! Thank you for your feedback.');
        setShowAddModal(false);
        setComment('');
        fetchFeedbackData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Member Ratings & Feedback</h1>
          <p className="text-xs text-slate-400 mt-1">
            Star Ratings (1-5) • MongoDB Aggregation Pipelines ($group, $avg, $count) for Live Gym & Trainer Scores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
          <button
            onClick={fetchFeedbackData}
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

      {/* Aggregate Overview Card */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-black text-white mb-2">{stats.overall?.averageRating || 4.8}</div>
            <div className="flex items-center gap-1 text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-xs text-slate-400">
              Based on <strong>{stats.overall?.totalReviews || 0}</strong> verified member reviews
            </div>
          </div>

          {/* Star Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Star Breakdown</h3>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.overall?.breakdown?.[star] || 0;
              const total = stats.overall?.totalReviews || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={star} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-6 text-right font-bold text-slate-300">{star} ★</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="w-8 text-slate-500 text-[10px]">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Trainer Ratings Aggregation */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Trainer Star Ratings</h3>
            <div className="space-y-2.5">
              {(stats.trainerRatings || []).map((t) => (
                <div key={t.trainerId} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{t.trainerName}</span>
                    <span className="text-[10px] text-slate-400">{t.specialization}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{t.avgRating}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({t.reviewCount})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Stream */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Member Feedback</h2>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No feedback submitted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r._id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      {r.member?.user?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{r.member?.user?.name || 'Gym Member'}</div>
                      <div className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{r.category}</span>
                  {r.trainer && <span className="text-slate-400">Trainer: {r.trainer.user?.name}</span>}
                </div>

                <p className="text-xs text-slate-300 italic">"{r.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Submit Feedback & Star Rating">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Feedback Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                <option value="Trainer">Trainer Coaching</option>
                <option value="Class">Group Class</option>
                <option value="Facility">Gym Floor & Machines</option>
                <option value="General">Overall Experience</option>
              </select>
            </div>

            {category === 'Trainer' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Trainer</label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  {trainers.map(t => (
                    <option key={t._id} value={t._id}>{t.user?.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      rating >= s
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${rating >= s ? 'fill-amber-400' : ''}`} />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Written Review *</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                placeholder="Share your training experience, coaching feedback, or facility cleanliness..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                {actionLoading ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
