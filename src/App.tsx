/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Announcement } from './types';
import { api, getStoredUser, clearStoredAuth } from './api/client';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { MealPassModal } from './components/MealPassModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Shield, Sparkles, UserCheck, Utensils, QrCode, HeartHandshake } from 'lucide-react';
import { getLocalDateStr } from './utils/date';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'admin' | 'pass'>('menu');
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateStr();
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Initialize auth check on load
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      // Validate session with server
      api.auth.me()
        .then((freshUser) => setUser(freshUser))
        .catch(() => {
          // Token expired or server restarted
          clearStoredAuth();
          setUser(null);
        });
    }

    // Fetch announcements
    api.announcements.list()
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error('Error fetching announcements:', err));
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    setActiveTab('menu');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'pass') {
            setIsPassOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        unreadAnnouncementsCount={announcements.length}
        onOpenAnnouncements={() => setIsNotificationsOpen(true)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Quick Identity Bar if not logged in */}
        {!user && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-orange-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Hostel Resident & Warden Guest Mode</span>
                <p className="text-slate-400 text-xs mt-0.5">
                  Browse meal menus and announcements. Sign in as <strong>Student (2023CS101)</strong> or <strong>Admin Warden (ADMIN001)</strong> to submit ratings or edit menus.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In / Demo Access</span>
            </button>
          </div>
        )}

        {/* View Router */}
        {activeTab === 'menu' && (
          <StudentDashboard
            user={user}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onOpenAuth={() => setIsAuthOpen(true)}
            announcements={announcements}
          />
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminDashboard user={user} selectedDate={selectedDate} />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-slate-400 font-semibold">
            <Utensils className="w-4 h-4 text-amber-400" />
            <span>Hostel Mess Management System</span>
          </div>
          <p>© 2026 Central Hostel Administration • Food Quality & Meal Analytics System</p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          if (loggedUser.role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('menu');
          }
        }}
      />

      {user && (
        <MealPassModal
          user={user}
          isOpen={isPassOpen}
          onClose={() => setIsPassOpen(false)}
          selectedDate={selectedDate}
        />
      )}

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        announcements={announcements}
      />

    </div>
  );
}
