import React, { useEffect, useState } from 'react';
import { CalendarCheck, QrCode, Search, CheckCircle2, Clock, UserCheck, Plus, AlertCircle } from 'lucide-react';
import API from '../services/api';
import QRScannerModal from '../components/QRScannerModal';
import Modal from '../components/Modal';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const [manualForm, setManualForm] = useState({
    memberId: '',
    status: 'Present',
    customTime: ''
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attendance', {
        params: { date: dateFilter, search }
      });
      if (res.data.success) {
        setAttendance(res.data.data);
        setStats(res.data.stats || {});
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
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, search]);

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!manualForm.memberId) return alert('Select member');

    try {
      const res = await API.post('/attendance/check-in', manualForm);
      if (res.data.success) {
        setShowManualModal(false);
        fetchAttendance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (id) => {
    try {
      const res = await API.put(`/attendance/${id}/check-out`, {});
      if (res.data.success) {
        fetchAttendance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Attendance System</h1>
          <p className="text-xs text-slate-400 mt-1">QR Code Scanning & Daily Check-In Management</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowQRScanner(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch QR Scanner</span>
          </button>
          <button
            onClick={() => {
              setManualForm({ memberId: '', status: 'Present', customTime: '' });
              setShowManualModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Check-In</span>
          </button>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Today's Total Check-Ins</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.todayCount || 0}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Active Gym Members</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalActiveMembers || 0}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Daily Attendance Rate</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.attendancePercentage || 0}%</h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by member name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Filter Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
          />
        </div>
      </div>

      {/* Today's Attendance Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Member</th>
                <th className="p-3.5">Member ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Check-In Time</th>
                <th className="p-3.5">Check-Out Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">Querying Attendance logs...</td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No attendance records for {dateFilter}</td>
                </tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold text-white">
                      {a.member?.user?.name || 'Unknown'}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">
                      {a.member?.memberCustomId}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {a.date}
                    </td>
                    <td className="p-3.5 text-emerald-400 font-semibold">
                      {a.checkInTime}
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">
                      {a.checkOutTime || <span className="text-amber-400 italic">In Gym (Active)</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {!a.checkOutTime ? (
                        <button
                          onClick={() => handleCheckOut(a._id)}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold"
                        >
                          Mark Check-Out
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-semibold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onSuccess={fetchAttendance}
      />

      {/* Manual Check-In Modal */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Manual Member Check-In">
        <form onSubmit={handleManualCheckIn} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Select Member *</label>
            <select
              required
              value={manualForm.memberId}
              onChange={(e) => setManualForm({ ...manualForm, memberId: e.target.value })}
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
            <label className="text-slate-300 font-semibold block mb-1">Check-In Status</label>
            <select
              value={manualForm.status}
              onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Record Check-In Document
          </button>
        </form>
      </Modal>
    </div>
  );
}
