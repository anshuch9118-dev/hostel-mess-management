import React, { useState, useEffect } from 'react';
import { User, MealMenu, MealType, FoodRating, Announcement, AdminAnalytics, YearGroup } from '../types';
import { api } from '../api/client';
import { WeeklyMenuTable } from './WeeklyMenuTable';
import { getLocalDateStr, formatDateLabel } from '../utils/date';
import {
  Users,
  Utensils,
  Star,
  Bell,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  Filter,
  ShieldCheck,
  Building,
  Bookmark,
  Table as TableIcon,
  Image as ImageIcon
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  selectedDate: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, selectedDate }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'weekly_sheet' | 'students' | 'announcements'>('analytics');
  
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [ratingsList, setRatingsList] = useState<FoodRating[]>([]);

  const [loading, setLoading] = useState(true);

  // Student Filter & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('all');
  const [studentBranchFilter, setStudentBranchFilter] = useState<string>('all');

  // Student Modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    password: 'student123',
    year: '1st' as YearGroup,
    branch: 'Computer Science',
    roomNumber: 'A-101',
  });

  // Menu Modal State
  const [editingMealType, setEditingMealType] = useState<MealType | null>(null);
  const [menuItemsText, setMenuItemsText] = useState('');
  const [menuTiming, setMenuTiming] = useState('');
  const [menuCalories, setMenuCalories] = useState(600);
  const [menuNotes, setMenuNotes] = useState('');

  // Announcement Form
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancPriority, setAncPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [ancTarget, setAncTarget] = useState<string>('all');

  const todayStr = getLocalDateStr();

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsData, studentsData, ancData, menuData, ratingsData] = await Promise.all([
        api.analytics.get(),
        api.students.list(),
        api.announcements.list(),
        api.menu.getByDate(selectedDate),
        api.ratings.get(selectedDate),
      ]);

      setAnalytics(analyticsData);
      setStudents(studentsData);
      setAnnouncements(ancData);
      setMenus(menuData);
      setRatingsList(ratingsData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [selectedDate]);

  // Handle Student Add/Edit
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.students.update(editingStudent.id, {
          fullName: studentForm.fullName,
          email: studentForm.email,
          year: studentForm.year,
          branch: studentForm.branch,
          roomNumber: studentForm.roomNumber,
        });
      } else {
        await api.students.create(studentForm);
      }
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      await api.students.delete(id);
      loadAdminData();
    }
  };

  // Handle Menu Save
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealType) return;

    const items = menuItemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.menu.save({
        date: selectedDate,
        mealType: editingMealType,
        items,
        timing: menuTiming,
        calories: Number(menuCalories),
        specialNotes: menuNotes,
      });

      setEditingMealType(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu');
    }
  };

  // Handle Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancContent) return;

    try {
      await api.announcements.create({
        title: ancTitle,
        content: ancContent,
        priority: ancPriority,
        targetYear: ancTarget,
      });

      setAncTitle('');
      setAncContent('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    await api.announcements.delete(id);
    loadAdminData();
  };

  // Filtered Students List
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.roomNumber.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesYear = studentYearFilter === 'all' || s.year === studentYearFilter;
    const matchesBranch = studentBranchFilter === 'all' || s.branch === studentBranchFilter;

    return matchesSearch && matchesYear && matchesBranch;
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-orange-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Warden & Mess Administration Panel</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Authorized Access
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage student records, customize meal menus, view ratings, and post notices.
            </p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-slate-700/60 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Registered Students</span>
            <div className="text-2xl font-extrabold text-white mt-1">{analytics?.totalStudents || 0}</div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">Active Hostel Resident DB</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Today's Avg Meal Score</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 flex items-center space-x-1">
              <span>{analytics?.todayAvgRating || 'N/A'}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">Based on student ratings</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Ratings Submitted</span>
            <div className="text-2xl font-extrabold text-white mt-1">{analytics?.totalFeedbacksToday || 0}</div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">Evaluations today</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Active Notice Board</span>
            <div className="text-2xl font-extrabold text-white mt-1">{announcements.length}</div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 inline-block">Broadcasted notices</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'analytics'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics & Feedbacks</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'menu'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Daily Menu Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly_sheet')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'weekly_sheet'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Single-Page Weekly Table & Photo Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'students'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Records DB</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'announcements'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Post Announcements</span>
        </button>
      </div>

      {/* TAB 1: Analytics & Feedbacks */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Meal Breakdown Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analytics?.mealSummaries.map((m) => (
              <div key={m.mealType} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">{m.mealType}</span>
                  <div className="flex items-center space-x-1 text-amber-400 text-xs font-extrabold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{m.avgRating ? m.avgRating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">{m.totalRatings} ratings today</div>

                {/* Star distribution miniature bars */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = m.distribution[star] || 0;
                    const pct = m.totalRatings > 0 ? (count / m.totalRatings) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center text-[10px] space-x-2 text-slate-400">
                        <span className="w-3">{star}★</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Student Feedback Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Student Feedback & Evaluation Log ({selectedDate})</span>
            </h3>

            {ratingsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No student feedback logged for this date yet.</p>
            ) : (
              <div className="space-y-3">
                {ratingsList.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{r.studentName}</span>
                        <span className="text-slate-400">({r.studentRollNumber})</span>
                        <span className="text-slate-500">• Room {r.roomNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{r.createdAt}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {r.mealType}
                      </span>
                      <div className="flex items-center space-x-0.5 text-amber-400 font-bold">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`}
                          />
                        ))}
                        <span className="ml-1 text-slate-200">{r.rating}/5</span>
                      </div>
                    </div>

                    {r.feedback && (
                      <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 italic">
                        "{r.feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: Daily Menu Manager */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Editing Menu for Date: <strong className="text-white">{selectedDate}</strong></span>
            </span>
            <span className="text-[11px] text-slate-400">Changes save directly to database</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((mealType) => {
              const existingMenu = menus.find((m) => m.mealType === mealType);
              const items = existingMenu?.items || [];

              return (
                <div key={mealType} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base uppercase tracking-wider">{mealType}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{existingMenu?.timing || 'Not configured'}</p>
                    </div>

                    <button
                      onClick={() => {
                        const defaultTimings: Record<MealType, string> = {
                          breakfast: '8:00 AM – 9:00 AM',
                          lunch: '12:30 PM – 1:30 PM',
                          snacks: '5:00 PM – 5:30 PM',
                          dinner: '8:00 PM – 9:00 PM',
                        };
                        setEditingMealType(mealType);
                        setMenuItemsText(items.join('\n'));
                        setMenuTiming(existingMenu?.timing || defaultTimings[mealType]);
                        setMenuCalories(existingMenu?.calories || 600);
                        setMenuNotes(existingMenu?.specialNotes || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Menu</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 min-h-[100px] space-y-2">
                    {items.length > 0 ? (
                      <ul className="space-y-1">
                        {items.map((it, idx) => (
                          <li key={idx} className="text-xs text-slate-200 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No menu items added for {mealType}.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Menu Edit Dialog */}
          {editingMealType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100">
                <button
                  onClick={() => setEditingMealType(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-white mb-4 uppercase">
                  Edit {editingMealType} Menu ({selectedDate})
                </h3>

                <form onSubmit={handleSaveMenu} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Menu Items (One dish per line)
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={menuItemsText}
                      onChange={(e) => setMenuItemsText(e.target.value)}
                      placeholder="Paneer Butter Masala&#10;Yellow Dal Tadka&#10;Jeera Rice&#10;Tandoori Roti"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Meal Timing</label>
                      <input
                        type="text"
                        value={menuTiming}
                        onChange={(e) => setMenuTiming(e.target.value)}
                        placeholder="07:30 AM - 09:30 AM"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Approx Calories (kcal)</label>
                      <input
                        type="number"
                        value={menuCalories}
                        onChange={(e) => setMenuCalories(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Special Notes / Dietary Tag</label>
                    <input
                      type="text"
                      value={menuNotes}
                      onChange={(e) => setMenuNotes(e.target.value)}
                      placeholder="e.g. Jain counter available, High Protein Feast"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20 transition-all"
                  >
                    Save Menu to Database
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2.5: Single-Page Weekly Table & Photo Sheet */}
      {activeTab === 'weekly_sheet' && (
        <WeeklyMenuTable user={user} selectedDate={selectedDate} onSelectDate={() => {}} />
      )}

      {/* TAB 3: Student Directory */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            {/* Search & Filters */}
            <div className="flex flex-1 items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student name, roll number, room..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={studentYearFilter}
                onChange={(e) => setStudentYearFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="all">All Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingStudent(null);
                setStudentForm({
                  fullName: '',
                  rollNumber: '',
                  email: '',
                  password: 'student123',
                  year: '1st',
                  branch: 'Computer Science',
                  roomNumber: 'A-101',
                });
                setIsStudentModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Student Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Year & Branch</th>
                    <th className="p-4">Room No</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                        No student records match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-amber-400">{s.rollNumber}</td>
                        <td className="p-4 font-semibold text-white">{s.fullName}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {s.year} Year
                          </span>{' '}
                          • {s.branch}
                        </td>
                        <td className="p-4 font-mono text-slate-300">{s.roomNumber}</td>
                        <td className="p-4 text-slate-400">{s.email}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingStudent(s);
                              setStudentForm({
                                fullName: s.fullName,
                                rollNumber: s.rollNumber,
                                email: s.email,
                                password: '',
                                year: s.year,
                                branch: s.branch,
                                roomNumber: s.roomNumber,
                              });
                              setIsStudentModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Add/Edit Modal */}
          {isStudentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
                <button
                  onClick={() => setIsStudentModalOpen(false)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-white mb-4">
                  {editingStudent ? 'Edit Student Details' : 'Add New Student Record'}
                </h3>

                <form onSubmit={handleSaveStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  {!editingStudent && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Roll Number (Unique)</label>
                      <input
                        type="text"
                        required
                        value={studentForm.rollNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Year</label>
                      <select
                        value={studentForm.year}
                        onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value as YearGroup })}
                        className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Branch</label>
                      <input
                        type="text"
                        required
                        value={studentForm.branch}
                        onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Room No</label>
                      <input
                        type="text"
                        required
                        value={studentForm.roomNumber}
                        onChange={(e) => setStudentForm({ ...studentForm, roomNumber: e.target.value })}
                        className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20"
                  >
                    {editingStudent ? 'Update Record' : 'Save Student to DB'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Announcements */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Post New Announcement Form */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Broadcast Notice</span>
            </h3>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Feast on Sunday"
                  value={ancTitle}
                  onChange={(e) => setAncTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Details regarding mess timings, inspections, or special events..."
                  value={ancContent}
                  onChange={(e) => setAncContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority Tag</label>
                  <select
                    value={ancPriority}
                    onChange={(e) => setAncPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="high">🔥 High Alert</option>
                    <option value="medium">📌 Medium Notice</option>
                    <option value="low">💡 Information</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
                  <select
                    value={ancTarget}
                    onChange={(e) => setAncTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="all">All Students</option>
                    <option value="1st">1st Year Only</option>
                    <option value="2nd">2nd Year Only</option>
                    <option value="3rd">3rd Year Only</option>
                    <option value="4th">4th Year Only</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20"
              >
                Post Notice to Board
              </button>
            </form>
          </div>

          {/* Active Notices List */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base">Active Broadcast Notices ({announcements.length})</h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {announcements.map((anc) => (
                <div key={anc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
                  <button
                    onClick={() => handleDeleteAnnouncement(anc.id)}
                    className="absolute top-3 right-3 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        anc.priority === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : anc.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {anc.priority} priority
                    </span>
                    <span className="text-[10px] text-slate-500">• Target: {anc.targetYear}</span>
                    <span className="text-[10px] text-slate-500">• Date: {anc.date}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{anc.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{anc.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
