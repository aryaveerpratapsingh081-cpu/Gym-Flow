import React, { useEffect, useState } from 'react';
import { Shield, Clock, User, Filter, RefreshCw } from 'lucide-react';
import API from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (entityFilter !== 'All') query.append('entity', entityFilter);
      if (actionFilter !== 'All') query.append('action', actionFilter);

      const res = await API.get(`/audit-logs?${query.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalCount(res.data.totalCount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System Audit Trail & Compliance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable Audit Records • Tracking Member Mutations, Freeze/Resume Lifecycle, and Financial Events
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">Filter by Entity:</span>
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">All Entities</option>
            <option value="Member">Member</option>
            <option value="Membership">Membership</option>
            <option value="Payment">Payment</option>
            <option value="Locker">Locker</option>
            <option value="Class">Class / Booking</option>
            <option value="Equipment">Equipment</option>
            <option value="Coupon">Coupon</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong>{logs.length}</strong> of <strong>{totalCount}</strong> recorded system actions
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-sans">Querying immutable audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-sans">No audit records found matching filter.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-white font-sans">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500 font-sans">({log.actorRole})</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-purple-400 font-semibold">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs">
                      {log.details || JSON.stringify(log.newValues || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
