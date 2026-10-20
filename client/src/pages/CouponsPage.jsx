import React, { useEffect, useState } from 'react';
import { Tag, Plus, CheckCircle2, AlertCircle, RefreshCw, Clock, Percent, DollarSign } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function CouponsPage() {
  const { isAdmin } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountValue, setDiscountValue] = useState(15);
  const [minPurchase, setMinPurchase] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(1500);
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState(100);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await API.get('/coupons');
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await API.post('/coupons', {
        code,
        description,
        discountType,
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase) || 0,
        maxDiscount: Number(maxDiscount) || 5000,
        validUntil,
        usageLimit: Number(usageLimit) || 100
      });
      if (res.data.success) {
        setMsg(`Coupon "${res.data.data.code}" created successfully!`);
        setShowAddModal(false);
        fetchCoupons();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Offers & Promotional Coupons</h1>
          <p className="text-xs text-slate-400 mt-1">
            Discount Code Engine • Server-Side Validation • Atomic Usage Limit Increments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          )}
          <button
            onClick={fetchCoupons}
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

      {/* Coupons List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">No discount coupons found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((c) => {
            const isExpired = new Date(c.validUntil) < new Date();
            const isExhausted = c.timesUsed >= c.usageLimit;

            return (
              <div
                key={c._id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-black text-sm text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      {c.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isExpired || isExhausted
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isExpired ? 'Expired' : isExhausted ? 'Exhausted' : c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4">{c.description || 'Valid on membership checkout.'}</p>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Discount:</span>
                      <span className="font-bold text-white">
                        {c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </span>
                    </div>
                    {c.discountType === 'Percentage' && (
                      <div className="flex justify-between text-slate-400">
                        <span>Max Cap:</span>
                        <span className="text-white">₹{c.maxDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Min Purchase:</span>
                      <span className="text-white">₹{c.minPurchase}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Till {new Date(c.validUntil).toLocaleDateString()}</span>
                  </div>
                  <span className="font-semibold text-slate-300">
                    {c.timesUsed} / {c.usageLimit} Used
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Promotional Coupon">
          <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Coupon Code (Uppercase) *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FESTIVE25"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white uppercase font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Special campus promo discount"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Discount Value *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="15"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Valid Until Date *</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Usage Limit *</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="100"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
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
                {actionLoading ? 'Creating...' : 'Publish Coupon'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
