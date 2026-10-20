import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User, Users, Plus, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function ClassesPage() {
  const { user, isAdmin, isTrainer, isMember } = useAuth();
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [trainers, setTrainers] = useState([]);

  // Add Class Form State
  const [name, setName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [category, setCategory] = useState('Yoga');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState(15);
  const [location, setLocation] = useState('Studio A');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchClassesData = async () => {
    setLoading(true);
    try {
      const [classRes, bookingRes] = await Promise.all([
        API.get(`/classes${categoryFilter !== 'All' ? `?category=${categoryFilter}` : ''}`),
        API.get('/classes/bookings')
      ]);

      if (classRes.data.success) setClasses(classRes.data.data);
      if (bookingRes.data.success) setMyBookings(bookingRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesData();
    if (isAdmin || isTrainer) {
      API.get('/trainers').then(res => {
        if (res.data.success) {
          setTrainers(res.data.data);
          if (res.data.data.length > 0) setTrainerId(res.data.data[0]._id);
        }
      });
    }
  }, [categoryFilter]);

  const handleBookSlot = async (classId) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await API.post(`/classes/${classId}/book`, {});
      if (res.data.success) {
        setMsg(res.data.message);
        fetchClassesData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      const res = await API.post(`/classes/bookings/${bookingId}/cancel`, {});
      if (res.data.success) {
        setMsg(res.data.message);
        fetchClassesData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await API.post('/classes', {
        name,
        trainer: trainerId,
        category,
        startTime,
        endTime,
        capacity: Number(capacity),
        location,
        description
      });
      if (res.data.success) {
        setMsg('Class scheduled successfully!');
        setShowAddModal(false);
        fetchClassesData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    } finally {
      setActionLoading(false);
    }
  };

  const isBookedByMe = (classId) => {
    return myBookings.some(b => b.class?._id === classId && b.status === 'Booked');
  };

  const getMyBookingId = (classId) => {
    const booking = myBookings.find(b => b.class?._id === classId && b.status === 'Booked');
    return booking?._id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Group Fitness Classes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Concurrency-Safe Booking • Overbooking Prevented via Atomic MongoDB $inc & Boundary Queries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isTrainer) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Class</span>
            </button>
          )}
          <button
            onClick={fetchClassesData}
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

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Yoga', 'HIIT', 'Zumba', 'CrossFit', 'Spin', 'Boxing'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading group class timetable...</div>
      ) : classes.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">No classes found matching this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const booked = isBookedByMe(cls._id);
            const bookingId = getMyBookingId(cls._id);
            const isFull = cls.bookedCount >= cls.capacity;

            return (
              <div
                key={cls._id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {cls.category}
                    </span>
                    <span className={`text-xs font-bold ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                      {cls.bookedCount} / {cls.capacity} Booked
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{cls.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{cls.description || 'Instructor-led group session.'}</p>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>Coach {cls.trainer?.user?.name || 'Assigned Instructor'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{new Date(cls.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(cls.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-slate-500 ml-1">({cls.durationMinutes} min)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{cls.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {booked ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Booked
                      </span>
                      <button
                        onClick={() => handleCancelBooking(bookingId)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBookSlot(cls._id)}
                      disabled={isFull || actionLoading}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isFull
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <span>{isFull ? 'Class Full' : 'Book Free Slot'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Schedule New Group Class">
          <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Class Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunrise Yoga Flow"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coach / Trainer *</label>
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  {['Yoga', 'HIIT', 'Zumba', 'CrossFit', 'Spin', 'Pilates', 'Boxing'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">End Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Capacity Limit *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Room / Studio</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Studio A (Zen Hall)"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="2"
                placeholder="Session objectives and prerequisites..."
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
                {actionLoading ? 'Scheduling...' : 'Save & Publish Class'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
