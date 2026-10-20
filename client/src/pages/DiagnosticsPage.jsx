import React, { useEffect, useState } from 'react';
import { Database, Key, Table, Layers, FileCode, CheckCircle2, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import API from '../services/api';

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [revenueView, setRevenueView] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const [diagRes, viewRes] = await Promise.all([
        API.get('/reports/dbms-diagnostics'),
        API.get('/reports/monthly-revenue-view')
      ]);

      if (diagRes.data.success) setDiagnostics(diagRes.data.data);
      if (viewRes.data.success) setRevenueView(viewRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">DBMS Lab Engine Diagnostics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Index Catalog Introspection • SQL View Equivalent • Aggregation Pipeline Mechanics & Viva Guide
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Database Connection Summary Banner */}
      {diagnostics?.databaseStatus && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-sm font-bold text-white">Live MongoDB Connection Active</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Database Type:</span>
              <span className="text-emerald-400 font-bold">{diagnostics.databaseStatus.type}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Host Endpoint:</span>
              <span className="text-white font-mono">{diagnostics.databaseStatus.host}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Active Database:</span>
              <span className="text-white font-mono">{diagnostics.databaseStatus.database}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Mongoose ReadyState:</span>
              <span className="text-emerald-400 font-mono font-bold">1 (Connected)</span>
            </div>
          </div>
        </div>
      )}

      {/* SQL VIEW EQUIVALENT SECTION (Section 40) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-400" />
              <span>SQL View Equivalent — Monthly Revenue Aggregation View</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Virtual Table generated dynamically via multi-stage MongoDB Aggregation Pipeline ($match, $group, $project, $sort).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold self-start">
            ViewName: {revenueView?.viewName}
          </span>
        </div>

        {/* Code comparison box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-blue-400" /> Standard SQL View Definition
            </div>
            <pre className="font-mono text-[11px] text-blue-300 overflow-x-auto whitespace-pre-wrap">
              {revenueView?.sqlEquivalentQuery || 'CREATE VIEW monthly_revenue_view AS ...'}
            </pre>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" /> MongoDB Aggregation Pipeline Equivalent
            </div>
            <pre className="font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`Payment.aggregate([
  { $match: { status: 'Completed' } },
  { $group: {
      _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
      totalRevenue: { $sum: '$amount' },
      txCount: { $sum: 1 }
  }},
  { $sort: { '_id.year': -1, '_id.month': -1 } }
])`}
            </pre>
          </div>
        </div>

        {/* View Results Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 mt-3">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Total Revenue</th>
                <th className="py-2.5 px-3">Transaction Count</th>
                <th className="py-2.5 px-3">Avg Transaction</th>
                <th className="py-2.5 px-3">Min Transaction</th>
                <th className="py-2.5 px-3 text-right">Max Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {(revenueView?.data || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-white font-bold">{row.period}</td>
                  <td className="py-2 px-3 text-emerald-400 font-black">₹{row.totalRevenue.toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-300">{row.transactionCount}</td>
                  <td className="py-2 px-3 text-slate-300">₹{row.averageTransactionValue.toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-400">₹{row.minTransaction}</td>
                  <td className="py-2 px-3 text-right text-slate-400">₹{row.maxTransaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDEX CATALOG (Section 35) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>Database Index Catalog & B-Tree Introspection</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real indexes configured across Mongoose models. Indexes optimize query lookup from O(N) COLLSCAN to O(log N) B-Tree seeks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(diagnostics?.indexCatalog || []).map((cat, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{cat.collection}</span>
                <span className="text-[10px] text-slate-400">{cat.documentCount} documents</span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                {cat.indexes.map((idxItem, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300 truncate mr-2">
                      {JSON.stringify(idxItem.key)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {idxItem.unique && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                          UNIQUE
                        </span>
                      )}
                      {idxItem.expireAfterSeconds !== null && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">
                          TTL {idxItem.expireAfterSeconds}s
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DBMS LAB VIVA CONCEPT GUIDE */}
      {diagnostics?.vivaConcepts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> {diagnostics.vivaConcepts.indexing.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {diagnostics.vivaConcepts.indexing.explanation}
            </p>
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Key Enforced Constraints:</span>
              {diagnostics.vivaConcepts.indexing.keyIndexesInProject.map((item, i) => (
                <div key={i} className="text-xs text-emerald-400 font-mono">• {item}</div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> {diagnostics.vivaConcepts.sqlVsMongo.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {diagnostics.vivaConcepts.sqlVsMongo.explanation}
            </p>
            <div className="space-y-1 pt-2 border-t border-slate-800 text-xs">
              {diagnostics.vivaConcepts.sqlVsMongo.equivalents.map((item, i) => (
                <div key={i} className="flex justify-between py-0.5 border-b border-slate-800/40 text-[11px]">
                  <span className="text-slate-400 font-mono">{item.sql}</span>
                  <span className="text-purple-400 font-mono font-semibold">{item.mongo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
