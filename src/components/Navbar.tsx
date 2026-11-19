import React from 'react';
import { User } from '../types';
import { UtensilsCrossed, ShieldCheck, UserCheck, Bell, LogOut, QrCode, Calendar, Sparkles } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: 'menu' | 'admin' | 'pass';
  setActiveTab: (tab: 'menu' | 'admin' | 'pass') => void;
  unreadAnnouncementsCount: number;
  onOpenAnnouncements: () => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
  unreadAnnouncementsCount,
  onOpenAnnouncements,
  selectedDate,
  setSelectedDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Hostel Mess Management
                </span>
                <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Campus Dining
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Central Dining Hall & Meal Analytics</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* View Selector Tabs */}
            <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'menu'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Mess Menu</span>
              </button>

              {user && (
                <button
                  onClick={() => setActiveTab('pass')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    activeTab === 'pass'
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Meal Pass</span>
                </button>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-orange-500 text-slate-950 font-bold shadow-md'
                      : 'text-orange-400 hover:bg-orange-500/10'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>

            {/* Date Quick Indicator */}
            <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Notifications Bell */}
            <button
              onClick={onOpenAnnouncements}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Announcements & Notices"
            >
              <Bell className="w-5 h-5" />
              {unreadAnnouncementsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>

            {/* User Profile or Auth Trigger */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white flex items-center justify-end space-x-1">
                    <span>{user.fullName}</span>
                    {user.role === 'admin' && (
                      <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] rounded font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {user.role === 'student' ? `${user.rollNumber} • ${user.roomNumber}` : 'Chief Warden'}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Student / Admin Login</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
