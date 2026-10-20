import React, { useEffect, useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle2, User, RefreshCw, CreditCard } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';

export default function DuesPage() {
  const [duesList, setDuesList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Settle modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchDues = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/dues${statusFilter !== 'All' ? `?status=${statusFilter}` : ''}`);
      if (res.data.success) {
        setDuesList(res.data.data);
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, [statusFilter]);

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setActionLoading(true);
    try {
      const res = await API.post(`/dues/${selectedRecord._id}/pay`, {
        amount: Number(payAmount),
        paymentMethod,
        notes
      });
      if (res.data.success) {
        setMsg(res.data.message);
        setShowSettleModal(false);
        fetchDues();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dues & Defaulters Reconciliation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Financial Ledger • Outstanding Dues Calculation (Price - Sum(Payments)) • Partial Payment Collection
          </p>
        </div>

        <button
          onClick={fetchDues}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Total Outstanding Receivable</div>
          <div className="text-2xl font-black text-red-400">
            ₹{(stats?.totalOutstandingReceivable || 0).toLocaleString()}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Defaulters / Pending Dues</div>
          <div className="text-2xl font-black text-amber-400">{stats?.totalDefaulters || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">Cleared Memberships</div>
          <div className="text-2xl font-black text-emerald-400">{stats?.clearedMemberships || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['All', 'Defaulters', 'Paid', 'Partial'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {st === 'Defaulters' ? 'Outstanding Dues Only' : st}
          </button>
        ))}
      </div>

      {/* Dues Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Subscribed Plan</th>
                <th className="py-3 px-4">Total Price</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Outstanding Dues</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">Calculating ledger dues...</td>
                </tr>
              ) : duesList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">No records found matching filter.</td>
                </tr>
              ) : (
                duesList.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{d.member?.user?.name || 'Member'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{d.member?.memberCustomId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.plan?.name || 'Membership'}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{d.membershipPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">₹{d.totalPaid.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`font-black ${d.outstandingAmount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        ₹{d.outstandingAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : d.paymentStatus === 'Partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {d.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.outstandingAmount > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedRecord(d);
                            setPayAmount(d.outstandingAmount);
                            setShowSettleModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          Collect Due
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Modal */}
      {showSettleModal && selectedRecord && (
        <Modal
          isOpen={showSettleModal}
          onClose={() => setShowSettleModal(false)}
          title={`Collect Dues: ${selectedRecord.member?.user?.name}`}
        >
          <form onSubmit={handleSettle} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Outstanding:</span>
              <span className="text-red-400 font-black text-sm">₹{selectedRecord.outstandingAmount.toLocaleString()}</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Amount to Collect (₹) *</label>
              <input
                type="number"
                min="1"
                max={selectedRecord.outstandingAmount}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash at Frontdesk</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Receipt Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Partial dues clearance receipt"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Recording...' : 'Generate Invoice & Clear'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
