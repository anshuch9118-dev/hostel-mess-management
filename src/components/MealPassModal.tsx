import React from 'react';
import { User } from '../types';
import { X, QrCode, ShieldCheck, CheckCircle2, User as UserIcon, Building2, Calendar } from 'lucide-react';

interface MealPassModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export const MealPassModal: React.FC<MealPassModalProps> = ({ user, isOpen, onClose, selectedDate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-slate-100 overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Header */}
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Digital Meal Pass</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">Central Mess Access</h3>
          <p className="text-xs text-slate-400">Scan at Entry Counter for Daily Meal Verification</p>
        </div>

        {/* Simulated QR Pass */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4 relative shadow-inner">
          <div className="w-36 h-36 mx-auto bg-white p-3 rounded-xl flex items-center justify-center shadow-lg">
            {/* Visual SVG QR pattern */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
              <rect x="0" y="0" width="30" height="30" rx="4" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" />

              <rect x="70" y="0" width="30" height="30" rx="4" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" />

              <rect x="0" y="70" width="30" height="30" rx="4" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" />

              {/* Grid dots */}
              <rect x="35" y="5" width="8" height="8" />
              <rect x="48" y="12" width="8" height="8" />
              <rect x="38" y="25" width="8" height="8" />
              <rect x="52" y="32" width="8" height="8" />
              <rect x="10" y="38" width="8" height="8" />
              <rect x="25" y="45" width="8" height="8" />
              <rect x="75" y="40" width="8" height="8" />
              <rect x="88" y="50" width="8" height="8" />
              <rect x="40" y="75" width="8" height="8" />
              <rect x="55" y="82" width="8" height="8" />
              <rect x="70" y="72" width="8" height="8" />
              <rect x="85" y="85" width="8" height="8" />
            </svg>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-extrabold text-amber-400 tracking-wider">
              {user.rollNumber}
            </span>
            <div className="text-sm font-bold text-white">{user.fullName}</div>
          </div>
        </div>

        {/* Student Meta Details */}
        <div className="mt-5 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Room & Branch</span>
            </span>
            <span className="font-semibold text-white">{user.roomNumber} • {user.branch}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Valid Date</span>
            </span>
            <span className="font-semibold text-amber-400">{selectedDate}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Verified Hostel Resident Record</span>
          </span>
        </div>

      </div>
    </div>
  );
};
