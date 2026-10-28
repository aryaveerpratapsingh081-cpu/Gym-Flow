import React from 'react';
import { Shield, UserCheck, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DemoCredentialsBadge({ onQuickLogin }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password) => {
    try {
      if (onQuickLogin) {
        onQuickLogin(email, password);
      } else {
        const user = await login(email, password);
        if (user.role === 'Admin') navigate('/dashboard');
        else if (user.role === 'Trainer') navigate('/trainer-dashboard');
        else navigate('/member-dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-2">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>Demo Login Credentials (Click to Autofill)</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleQuickLogin('admin@gymflow.com', 'Admin@123')}
          className="flex flex-col items-center p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/20 text-emerald-300 transition-all text-left"
        >
          <div className="flex items-center gap-1 font-semibold text-white">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">admin@gymflow.com</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickLogin('trainer@gymflow.com', 'Trainer@123')}
          className="flex flex-col items-center p-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/20 text-blue-300 transition-all text-left"
        >
          <div className="flex items-center gap-1 font-semibold text-white">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Trainer</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">trainer@gymflow.com</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickLogin('member@gymflow.com', 'Member@123')}
          className="flex flex-col items-center p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300 transition-all text-left"
        >
          <div className="flex items-center gap-1 font-semibold text-white">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Member</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">member@gymflow.com</span>
        </button>
      </div>
    </div>
  );
}
