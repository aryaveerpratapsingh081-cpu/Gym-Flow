import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  QrCode,
  Database,
  Wrench,
  Calendar,
  CreditCard,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import API from '../services/api';
import StatCard from '../components/StatCard';
import QRScannerModal from '../components/QRScannerModal';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, healthRes] = await Promise.all([
        API.get('/dashboard/admin'),
        API.get('/health')
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data.data);
      }
      if (healthRes.data?.database) {
        setDbStatus(healthRes.data.database);
      }
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-semibold">Executing MongoDB Aggregations & Query Pipelines...</span>
      </div>
    );
  }

  const { stats, charts, expiringMemberships, recentPayments, recentMembers } = data || {};

  return (
    <div className="space-y-6">
      {/* Real-time DB Connection Indicator & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Overview Dashboard</h1>
            {dbStatus?.connected && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{dbStatus.type}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Live MongoDB Aggregation Pipelines & Database System State</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Attendance Scanner</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Database Diagnostics Banner (Section 3 Requirement) */}
      {dbStatus && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white">Database Status:</span>
            <span className="text-emerald-400 font-semibold">{dbStatus.connected ? 'Connected (State: Ready)' : 'Disconnected'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Host: <span className="text-slate-200 font-mono">{dbStatus.host || '127.0.0.1'}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Database: <span className="text-slate-200 font-mono">{dbStatus.name || 'gymflow'}</span></span>
          </div>
          <span className="text-[11px] text-slate-400">Live Demo Engine Active</span>
        </div>
      )}

      {/* Primary Metric Cards Grid (Section 4 Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Members"
          value={stats?.totalMembers || 0}
          subtext={`${stats?.activeMembers || 0} Active Members`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeMemberships || 0}
          subtext="Valid Memberships"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Certified Trainers"
          value={stats?.totalTrainers || 0}
          subtext="On Floor Roster"
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Today's Attendance"
          value={stats?.todayAttendance || 0}
          subtext="Verified Check-ins"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          subtext="Current Month Income"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Secondary Operational Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expiring Soon (7 Days)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">{stats?.expiringCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Need renewal follow-up</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Outstanding Dues</span>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-black text-white">₹{(stats?.totalOutstandingDues || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending collection</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Upcoming Classes</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">{stats?.upcomingClassesCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scheduled batches</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Equipment Maintenance</span>
            <Wrench className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl font-black text-white">{stats?.equipmentDueCount || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Due within 7 days</div>
        </div>
      </div>

      {/* Charts Row: Monthly Revenue & Weekly Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Monthly Revenue Trend (Last 6 Months)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Aggregated via MongoDB $match, $group ($sum), and $sort</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Membership Plan Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h2 className="text-sm font-bold text-white mb-1">Plan Distribution</h2>
          <p className="text-[11px] text-slate-400 mb-4">Active members by tier ($lookup & $group)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.membershipDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(charts?.membershipDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: 7-Day Attendance & Trainer Member Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-400" /> Past 7 Days Attendance Volume
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Enforced unique per day per member via compound index</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.attendance || []}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [val, 'Checked-in Members']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trainer Member Allocation */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" /> Trainer-wise Member Allocation
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Computed via single MongoDB aggregation pipeline ($lookup & $group)</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.trainerDistribution || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="trainerName" type="category" stroke="#64748b" fontSize={11} width={90} />
                <Tooltip
                  formatter={(val) => [val, 'Assigned Trainees']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity: Recent Payments & Recent Member Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Recent Transactions & Invoices
            </h3>
            <span className="text-[11px] text-slate-400">Latest 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Txn ID</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(recentPayments || []).map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium text-white">{p.member?.user?.name || 'Member'}</td>
                    <td className="py-2.5 font-mono text-slate-400 text-[10px]">{p.transactionId}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-emerald-400">₹{p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Memberships & Alerts */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Expiring Within 7 Days
            </h3>
            <span className="text-[11px] text-amber-400 font-semibold">{expiringMemberships?.length || 0} Members</span>
          </div>
          <div className="space-y-2">
            {(expiringMemberships || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No memberships expiring in the next 7 days.</div>
            ) : (
              (expiringMemberships || []).map((m) => (
                <div key={m._id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{m.member?.user?.name}</span>
                    <span className="text-[11px] text-slate-400">{m.plan?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-amber-400 font-semibold block">
                      Expires {new Date(m.endDate).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.member?.user?.phone || 'No phone'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
