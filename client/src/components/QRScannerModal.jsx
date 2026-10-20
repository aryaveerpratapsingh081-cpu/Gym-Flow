import React, { useState } from 'react';
import { QrCode, Camera, CheckCircle2, AlertCircle, X, Search, Sparkles } from 'lucide-react';
import API from '../services/api';

export default function QRScannerModal({ isOpen, onClose, onSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleCheckIn = async (codeToSubmit) => {
    const code = codeToSubmit || manualCode;
    if (!code.trim()) return;

    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const res = await API.post('/attendance/check-in', {
        memberCustomId: code.trim()
      });

      if (res.data.success) {
        setMessage(res.data.message);
        setManualCode('');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.alreadyCheckedIn) {
          setErrorMsg(err.response.data.message);
        } else {
          setErrorMsg(err.response.data.message || 'Check-in failed');
        }
      } else {
        setErrorMsg('Network error checking in');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickDemoCodes = ['GF-1001', 'GF-1002', 'GF-1003', 'GF-1004'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#121721] border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">QR Check-In Scanner</h3>
              <p className="text-[11px] text-slate-400">Live Faculty Demonstration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Simulation Visual */}
        <div className="relative w-full h-44 bg-slate-950 rounded-xl border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center overflow-hidden mb-4 group">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <Camera className="w-10 h-10 text-emerald-400 mb-2 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">Ready for QR Code scan</span>
          <span className="text-[10px] text-slate-500 mt-1">Point member QR code at camera</span>
        </div>

        {/* Manual Member ID Input Fallback */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Manual Member ID Check-In (Faculty Fallback)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. GF-1001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={() => handleCheckIn()}
              disabled={loading || !manualCode.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>

          {/* Quick Demo Buttons */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 block mb-1.5 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Click to test instant QR scan:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickDemoCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setManualCode(code);
                    handleCheckIn(code);
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-mono transition-all"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Alert feedback */}
          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
