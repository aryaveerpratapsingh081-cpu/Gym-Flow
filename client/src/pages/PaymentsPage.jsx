import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Search, DollarSign, FileText, Trash2, Printer, CheckCircle2 } from 'lucide-react';
import API from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    paymentMethod: 'UPI',
    notes: ''
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/payments', {
        params: { search, paymentMethod: methodFilter }
      });
      if (res.data.success) {
        setPayments(res.data.data);
        setSummary(res.data.summary || {});
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
    fetchPayments();
  }, [search, methodFilter]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!formData.memberId || !formData.amount) return alert('Fill in member and amount');

    try {
      const res = await API.post('/payments', formData);
      if (res.data.success) {
        setShowAddModal(false);
        fetchPayments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete payment audit record?')) return;
    try {
      const res = await API.delete(`/payments/${id}`);
      if (res.data.success) fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openReceipt = (p) => {
    setSelectedPayment(p);
    setShowReceiptModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Financial & Payment Audit</h1>
          <p className="text-xs text-slate-400 mt-1">Transaction ledger & revenue calculations via MongoDB Aggregations</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ memberId: '', amount: '', paymentMethod: 'UPI', notes: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Financial Aggregation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total All-Time Revenue</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
              ₹{(summary.totalRevenue || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Current Month Income</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ₹{(summary.monthlyRevenue || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Recorded Transactions</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {summary.paymentCount || 0}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by transaction ID, invoice or member name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
        >
          <option value="All">All Payment Methods</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Invoice & Txn ID</th>
                <th className="p-3.5">Member</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">Querying Payments ledger...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No payment records found</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/50">
                    <td className="p-3.5">
                      <div className="font-bold text-white font-mono">{p.invoiceNo}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.transactionId}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      {p.member?.user?.name || 'Unknown Member'}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400 font-mono text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg border border-slate-800 font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openReceipt(p)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white"
                        title="Print/View Invoice Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeletePayment(p._id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 text-red-400"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record New Payment">
        <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Amount Paid (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 2499"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Payment Method *</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
              >
                <option value="UPI">UPI</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Notes / Reference</label>
            <input
              type="text"
              placeholder="e.g. Renewal payment for Silver plan"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all mt-4"
          >
            Generate Receipt & Save Payment
          </button>
        </form>
      </Modal>

      {/* Printable Invoice Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="GymFlow Payment Receipt">
        {selectedPayment && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">GymFlow Smart Gym</h3>
                <p className="text-[10px] text-emerald-400">Official Payment Receipt</p>
              </div>
              <div className="text-right font-mono">
                <div className="text-slate-300 font-bold">{selectedPayment.invoiceNo}</div>
                <div className="text-[10px] text-slate-500">{new Date(selectedPayment.paymentDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>Member: <strong className="text-white">{selectedPayment.member?.user?.name}</strong></div>
              <div>Phone: <strong className="text-white">{selectedPayment.member?.user?.phone || 'N/A'}</strong></div>
              <div>Method: <strong className="text-emerald-400">{selectedPayment.paymentMethod}</strong></div>
              <div>Txn ID: <strong className="font-mono text-slate-400">{selectedPayment.transactionId}</strong></div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between border border-slate-800">
              <span className="font-bold text-slate-300">Total Amount Paid:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">₹{selectedPayment.amount}</span>
            </div>

            <div className="text-center text-[10px] text-slate-500 italic">
              Thank you for training with GymFlow!
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
