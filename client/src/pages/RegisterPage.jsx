import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Tag,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Personal, 2: Select Plan, 3: Demo Payment & Confirm
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Plan selection
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);

  // Checkout & Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('razorpay'); // 'razorpay' | 'simulation'
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, setUser } = useAuth();
  const navigate = useNavigate();

  // Load plans from MongoDB
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await API.get('/plans?status=Active');
        if (res.data.success && res.data.data.length > 0) {
          setPlans(res.data.data);
          // Default to Silver or first plan
          const defaultP = res.data.data.find(p => p.name === 'Silver Plan') || res.data.data[0];
          setSelectedPlan(defaultP);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Validate Step 1
  const handleNextStep1 = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return setError('Please fill in all required fields.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setStep(2);
  };

  // Validate Step 2
  const handleNextStep2 = () => {
    if (!selectedPlan) {
      return setError('Please select a membership plan to continue.');
    }
    setError('');
    setStep(3);
  };

  // Apply Coupon
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await API.post('/coupons/validate', {
        code: couponCode.trim(),
        planPrice: selectedPlan.price
      });
      if (res.data.success) {
        setAppliedCoupon(res.data.data);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Dynamic Razorpay Script Loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Razorpay Checkout Handler (Test Mode with Real Cryptographic Signature Verification)
  const handleRazorpayCheckout = async () => {
    setError('');
    setRazorpayLoading(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please verify your internet connection.');
      }

      // 1. Create order on backend with authoritative MongoDB plan price
      const orderRes = await API.post('/payments/razorpay/create-order', {
        planId: selectedPlan._id,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to initialize Razorpay order.');
      }

      const { orderId, amount, currency, keyId } = orderRes.data.data;

      // 2. Configure Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'GymFlow Smart Fitness',
        description: `${selectedPlan.name} Membership (${selectedPlan.durationMonths} Months)`,
        image: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
        order_id: orderId,
        prefill: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          contact: phone.trim() || '9876543210'
        },
        theme: {
          color: '#10b981' // GymFlow Emerald Green
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
            setError('Payment cancelled or closed. Your membership was not activated.');
          }
        },
        handler: async function (response) {
          // 3. Verify cryptographic HMAC-SHA256 signature on backend
          try {
            setRazorpayLoading(true);
            const verifyRes = await API.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selectedPlan._id,
              couponCode: appliedCoupon ? appliedCoupon.code : undefined,
              registrationData: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                password: password
              }
            });

            if (verifyRes.data.success) {
              const userData = verifyRes.data.data.user;
              setUser(userData);
              localStorage.setItem('gymflow_user', JSON.stringify(userData));
              navigate('/member/dashboard');
            } else {
              setError(verifyRes.data.message || 'Payment signature verification failed.');
            }
          } catch (vErr) {
            setError(vErr.response?.data?.message || vErr.message || 'Payment verification failed on the server.');
          } finally {
            setRazorpayLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setRazorpayLoading(false);
        setError(`Payment Failed: ${resp.error?.description || 'Transaction declined'}. Membership was not activated.`);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      setError(err.response?.data?.message || err.message || 'Error launching Razorpay Checkout.');
      setRazorpayLoading(false);
    }
  };

  // Fallback Simulation Registration (Offline / Faculty Demonstration Mode)
  const handleCompleteRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        planId: selectedPlan._id,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      };

      await register(payload);
      // Strictly redirects to member dashboard
      navigate('/member-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Calculated totals
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, basePrice - discount);

  return (
    <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center p-4 relative py-12">
      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Dumbbell className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Gym<span className="text-emerald-400">Flow</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">New Member Registration</h2>
          <p className="text-sm text-slate-400 mt-1">Join the premier smart gym management ecosystem</p>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6 max-w-md mx-auto">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800'}`}>1</span>
              <span>Account</span>
            </div>
            <div className={`h-0.5 w-8 sm:w-12 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800'}`}>2</span>
              <span>Choose Plan</span>
            </div>
            <div className={`h-0.5 w-8 sm:w-12 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800'}`}>3</span>
              <span>Checkout</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="max-w-md mx-auto glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-1">Step 1: Personal Details</h3>
            <p className="text-xs text-slate-400 mb-6">Create your member credentials. All public registrations receive the verified Member role.</p>

            <form onSubmit={handleNextStep1} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                <span>Continue to Plan Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: Plan Selection */}
        {step === 2 && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Step 2: Choose Your Membership Plan</h3>
                <p className="text-xs text-slate-400">Plans are fetched directly from MongoDB with authoritative pricing & duration.</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 self-start cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Account Details
              </button>
            </div>

            {plansLoading ? (
              <div className="py-16 text-center text-slate-400 text-sm">Loading available gym plans from database...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((p) => {
                  const isSelected = selectedPlan?._id === p._id;
                  const isGoldOrPremium = p.name.includes('Gold') || p.name.includes('Premium');

                  return (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPlan(p)}
                      className={`relative rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isGoldOrPremium && (
                        <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3" /> Popular
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-base">{p.name}</h4>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mb-4">{p.description}</p>

                        <div className="mb-4">
                          <span className="text-2xl font-black text-white">₹{p.price.toLocaleString()}</span>
                          <span className="text-xs text-slate-400 ml-1">/ {p.durationMonths} {p.durationMonths === 1 ? 'Month' : 'Months'}</span>
                        </div>

                        <ul className="space-y-2 mb-6">
                          {p.features?.map((feat, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(p);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Plan Selected' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                disabled={!selectedPlan}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Demo Payment & Activation */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Step 3: Demo Checkout & Confirmation</h3>
                <p className="text-xs text-slate-400">Simulate online payment confirmation to immediately activate your membership.</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Plan
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Order Snapshot</h4>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-sm font-bold text-white">{selectedPlan?.name}</div>
                  <div className="text-xs text-slate-400">{selectedPlan?.durationMonths} Months Full Gym Access</div>
                </div>
                <div className="text-sm font-bold text-white">₹{basePrice.toLocaleString()}</div>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-xs text-emerald-400 py-1.5 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon ({appliedCoupon.code})</span>
                  </div>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-base font-black text-white pt-2 border-t border-slate-800 mt-2">
                <span>Total Payable</span>
                <span className="text-emerald-400">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="mb-6">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Have a Promo Coupon?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10, SUMMER500"
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white uppercase tracking-wider focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {couponLoading ? 'Checking...' : 'Apply Coupon'}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-400 mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Coupon applied! You saved ₹{discount}.
                </p>
              )}
            </form>

            {/* Payment Mode Selector: Razorpay Gateway vs Simulation */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Payment Gateway Mode</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMode('razorpay')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMode === 'razorpay'
                      ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Razorpay Gateway
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Test Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Real cryptographic HMAC-SHA256 signature verification</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('simulation')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMode === 'simulation'
                      ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Demo Simulation
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Instant mock payment for offline demo</p>
                </button>
              </div>

              {/* Razorpay Test Credentials Helper Box */}
              {paymentMode === 'razorpay' && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Razorpay Test Mode Credentials
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">rzp_test_TqHLmAEv4kbwsP</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Test Card:</span>
                      <code className="text-emerald-300 font-mono font-bold">4111 1111 1111 1111</code>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Exp: 12/28 • CVV: 123 • OTP: 123456</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Test UPI VPA:</span>
                      <code className="text-emerald-300 font-mono font-bold">success@razorpay</code>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Instant sandbox approval</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation Payment Method Selector */}
              {paymentMode === 'simulation' && (
                <div className="space-y-2 mb-4">
                  <label className="text-xs font-semibold text-slate-400 block">Select Demo Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['UPI', 'Card', 'Cash'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{m}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm & Activate Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Back
              </button>

              {paymentMode === 'razorpay' ? (
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={razorpayLoading || loading}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {razorpayLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Opening Razorpay Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{finalTotal.toLocaleString()} with Razorpay & Activate</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Activating Account...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Demo Payment (₹{finalTotal.toLocaleString()}) & Activate</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
