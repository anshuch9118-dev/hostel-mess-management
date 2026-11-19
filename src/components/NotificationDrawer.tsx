import React from 'react';
import { Announcement } from '../types';
import { X, Bell, Calendar, Sparkles, ShieldAlert } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  announcements,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between text-slate-100">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Mess Broadcast Notices</h3>
                <p className="text-xs text-slate-400">Important notices & menu updates</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Announcements List */}
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No active announcements right now.</p>
            ) : (
              announcements.map((anc) => (
                <div
                  key={anc.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-md relative"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        anc.priority === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : anc.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {anc.priority} priority
                    </span>

                    <span className="text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{anc.date}</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{anc.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{anc.content}</p>

                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Issued by: {anc.createdBy}</span>
                    <span>Audience: {anc.targetYear === 'all' ? 'All Students' : `${anc.targetYear} Year`}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
        >
          Close Drawer
        </button>

      </div>
    </div>
  );
};
