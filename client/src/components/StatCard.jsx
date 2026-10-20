import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  return (
    <div className="glass-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
        {subtext && <p className="text-[11px] text-slate-400 mt-1 font-medium">{subtext}</p>}
      </div>

      <div className={`p-3.5 rounded-2xl border ${colorMap[color] || colorMap.emerald} transition-transform group-hover:scale-110`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}
