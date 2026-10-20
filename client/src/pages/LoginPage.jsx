import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DemoCredentialsBadge from '../components/DemoCredentialsBadge';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) return setError('Please enter both email and password');

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'Admin') navigate('/admin/dashboard');
      else if (user.role === 'Trainer') navigate('/trainer/dashboard');
      else navigate('/member/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAutofill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login(demoEmail, demoPassword)
      .then((user) => {
        if (user.role === 'Admin') navigate('/admin/dashboard');
        else if (user.role === 'Trainer') navigate('/trainer/dashboard');
        else navigate('/member/dashboard');
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glow effect background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Dumbbell className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Gym<span className="text-emerald-400">Flow</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Sign In to GymFlow</h2>
          <p className="text-xs text-slate-400 mt-1">DBMS Lab Review 2 Smart Management Prototype</p>
        </div>

        {/* Demo Credentials Quick Autofill Box */}
        <div className="mb-4">
          <DemoCredentialsBadge onQuickLogin={handleQuickAutofill} />
        </div>

        {/* Login Form */}
        <div className="glass-panel p-6 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gymflow.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Authenticating JWT...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
