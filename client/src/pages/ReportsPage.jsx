import React, { useEffect, useState } from 'react';
import { FileText, Download, TrendingUp, Users, DollarSign, CalendarCheck, Award, RefreshCw } from 'lucide-react';
import API from '../services/api';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/dashboard/admin');
      if (res.data.success) setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportMembersCSV = async () => {
    try {
      const res = await API.get('/members', { params: { limit: 100 } });
      if (res.data.success) {
        const rows = res.data.data.map((m) => ({
          ID: m.memberCustomId,
          Name: m.user?.name,
          Email: m.user?.email,
          Phone: m.user?.phone,
          Status: m.status,
          JoinDate: new Date(m.joinDate).toLocaleDateString()
        }));

        const header = Object.keys(rows[0]).join(',');
        const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${v || ''}"`).join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GymFlow_Members_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
    } catch (err) {
      alert('CSV export failed');
    }
  };

  const exportPaymentsCSV = async () => {
    try {
      const res = await API.get('/payments');
      if (res.data.success) {
        const rows = res.data.data.map((p) => ({
          Invoice: p.invoiceNo,
          TxnID: p.transactionId,
          Member: p.member?.user?.name,
          Amount: p.amount,
          Method: p.paymentMethod,
          Date: new Date(p.paymentDate).toLocaleDateString()
        }));

        const header = Object.keys(rows[0]).join(',');
        const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${v || ''}"`).join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GymFlow_Payments_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
    } catch (err) {
      alert('CSV export failed');
    }
  };

  const { stats, charts } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System Analytics & CSV Data Export</h1>
          <p className="text-xs text-slate-400 mt-1">Export MongoDB collections to CSV & view high-level performance metrics</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportMembersCSV}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Members CSV</span>
          </button>
          <button
            onClick={exportPaymentsCSV}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Payments CSV</span>
          </button>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Members Count</span>
          <h3 className="text-3xl font-black text-white mt-1">{stats?.totalMembers || 0}</h3>
          <span className="text-[11px] text-emerald-400">{stats?.activeMembers || 0} Currently Active</span>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Monthly Aggregated Income</span>
          <h3 className="text-3xl font-black text-emerald-400 mt-1">₹{(stats?.monthlyRevenue || 0).toLocaleString()}</h3>
          <span className="text-[11px] text-slate-400">Current Month Total</span>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Active Gym Trainers</span>
          <h3 className="text-3xl font-black text-white mt-1">{stats?.totalTrainers || 0}</h3>
          <span className="text-[11px] text-slate-400">Instructors</span>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Expiring Plan Risk</span>
          <h3 className="text-3xl font-black text-amber-400 mt-1">{stats?.expiringCount || 0}</h3>
          <span className="text-[11px] text-slate-400">Within 7 days</span>
        </div>
      </div>
    </div>
  );
}
