import React, { useState, useEffect } from 'react';
import { Bell, Menu, Sparkles, User, Shield, UserCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Navbar({ onToggleSidebar }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkRead = async () => {
    try {
      await API.put('/notifications/read');
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = async (email, password, targetRoute) => {
    try {
      await login(email, password);
      setShowRoleSwitcher(false);
      navigate(targetRoute);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0d12]/90 border-b border-slate-800/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>GymFlow Management System</span>
            <span className="hidden sm:inline-flex items-center text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              MongoDB • Express • React
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-medium text-emerald-400 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Switch Demo Role</span>
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-[#121721] border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 border-b border-slate-800 mb-1">
                Demo Account Quick Switcher
              </div>
              <button
                onClick={() => handleRoleSwitch('admin@gymflow.com', 'Admin@123', '/dashboard')}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-xs text-left transition-colors"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Admin Dashboard</div>
                  <div className="text-[10px] text-slate-400">admin@gymflow.com</div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSwitch('trainer@gymflow.com', 'Trainer@123', '/trainer-dashboard')}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-xs text-left transition-colors"
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-white">Trainer Dashboard</div>
                  <div className="text-[10px] text-slate-400">trainer@gymflow.com</div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSwitch('member@gymflow.com', 'Member@123', '/member-dashboard')}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-xs text-left transition-colors"
              >
                <User className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold text-white">Member Dashboard</div>
                  <div className="text-[10px] text-slate-400">member@gymflow.com</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs && unreadCount > 0) handleMarkRead();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-[#121721] border border-slate-800 rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-white">System Alerts</span>
                <span className="text-[10px] text-emerald-400 font-mono">Live MongoDB</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No notifications right now</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="font-semibold text-slate-200">{n.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
