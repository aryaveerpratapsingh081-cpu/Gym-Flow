import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#121721] border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
