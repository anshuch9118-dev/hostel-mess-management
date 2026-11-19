import React, { useState, useEffect } from 'react';
import { User, MealMenu, MealType, FoodRating, Announcement } from '../types';
import { api } from '../api/client';
import { MealRatingModal } from './MealRatingModal';
import { WeeklyMenuTable } from './WeeklyMenuTable';
import { getLocalDateStr, parseLocalDate, formatDateLabel } from '../utils/date';
import {
  Utensils,
  Clock,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  Info,
  CheckCircle,
  Bell,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Search,
  Check,
  Table,
  Grid
} from 'lucide-react';

interface StudentDashboardProps {
  user: User | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onOpenAuth: () => void;
  announcements: Announcement[];
}

const mealMeta: Record<MealType, { name: string; icon: any; color: string; timing: string; defaultCal: number }> = {
  breakfast: { name: 'Morning Breakfast', icon: Sun, color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400', timing: '8:00 AM – 9:00 AM', defaultCal: 450 },
  lunch: { name: 'Afternoon Lunch', icon: Utensils, color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400', timing: '12:30 PM – 1:30 PM', defaultCal: 750 },
  snacks: { name: 'Evening Snacks', icon: Coffee, color: 'from-orange-500/20 to-amber-600/10 border-orange-500/30 text-orange-400', timing: '5:00 PM – 5:30 PM', defaultCal: 320 },
  dinner: { name: 'Night Dinner', icon: Moon, color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400', timing: '8:00 PM – 9:00 PM', defaultCal: 800 },
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  selectedDate,
  setSelectedDate,
  onOpenAuth,
  announcements,
}) => {
  const [dashboardMode, setDashboardMode] = useState<'daily' | 'weekly'>('daily');
  const [menus, setMenus] = useState<(MealMenu & { avgRating?: number; totalRatings?: number })[]>([]);
  const [myRatings, setMyRatings] = useState<FoodRating[]>([]);
  const [loading, setLoading] = useState(true);

  // Rating Modal
  const [activeRatingMeal, setActiveRatingMeal] = useState<MealType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = getLocalDateStr();

  const fetchMenuAndRatings = async () => {
    setLoading(true);
    try {
      const menuData = await api.menu.getByDate(selectedDate);
      setMenus(menuData);

      if (user) {
        const ratingsData = await api.ratings.myRatings(selectedDate);
        setMyRatings(ratingsData);
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuAndRatings();
  }, [selectedDate, user]);

  const handleRatingSubmit = async (mealType: MealType, rating: number, feedback: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    await api.ratings.submit({
      date: selectedDate,
      mealType,
      rating,
      feedback,
    });
    fetchMenuAndRatings();
  };

  // Date controls
  const shiftDate = (days: number) => {
    const current = parseLocalDate(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateStr(current));
  };

  const getMealMenu = (type: MealType) => {
    return menus.find((m) => m.mealType === type);
  };

  const getMyMealRating = (type: MealType) => {
    return myRatings.find((r) => r.mealType === type);
  };

  // Determine current ongoing meal based on time
  const getCurrentMealType = (): MealType => {
    const now = new Date();
    const hrs = now.getHours();
    if (hrs >= 6 && hrs < 11) return 'breakfast';
    if (hrs >= 11 && hrs < 16) return 'lunch';
    if (hrs >= 16 && hrs < 19) return 'snacks';
    return 'dinner';
  };

  const currentMealType = getCurrentMealType();

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Central Mess Hall</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {user ? `Welcome, ${user.fullName}!` : 'Hostel Daily Mess Menu & Food Feedback'}
            </h1>
            
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              {user
                ? `Roll No: ${user.rollNumber} • Room: ${user.roomNumber} • ${user.year} ${user.branch}`
                : 'Browse daily meals, check nutrition & timings, and submit 1-5 star food ratings.'}
            </p>
          </div>

          {/* Quick Date Control */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button
                onClick={() => shiftDate(-1)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 text-center">
                <span className="block text-xs font-bold text-amber-400">
                  {selectedDate === todayStr ? "Today's Menu" : selectedDate}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {formatDateLabel(selectedDate)}
                </span>
              </div>

              <button
                onClick={() => shiftDate(1)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
              >
                Go to Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDashboardMode('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              dashboardMode === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Daily View & Meal Ratings</span>
          </button>

          <button
            onClick={() => setDashboardMode('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              dashboardMode === 'weekly'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Single-Page Everyday Table & Menu Board Photo</span>
          </button>
        </div>
      </div>

      {/* Announcements Marquee / Highlights */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start space-x-3 shadow-lg">
          <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1 flex-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>{announcements[0].title}</span>
              <span className="text-[10px] text-amber-400/80 font-normal">{announcements[0].date}</span>
            </div>
            <p className="text-slate-300">{announcements[0].content}</p>
          </div>
        </div>
      )}

      {dashboardMode === 'weekly' ? (
        <WeeklyMenuTable
          user={user}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setDashboardMode('daily');
          }}
        />
      ) : (
        <>
          {/* Dish Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search items (e.g. Paneer, Idli, Samosa, Biryani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Meal Grid (4 Meals) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((mealType) => {
              const meta = mealMeta[mealType];
              const menu = getMealMenu(mealType);
              const myRating = getMyMealRating(mealType);
              const Icon = meta.icon;
              const isOngoing = selectedDate === todayStr && currentMealType === mealType;

              // Search Filter check
              if (searchQuery && menu) {
                const matches = menu.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()));
                if (!matches) return null;
              }

              return (
                <div
                  key={mealType}
                  className={`relative rounded-2xl bg-slate-900 border ${
                    isOngoing ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-800'
                  } p-6 shadow-xl transition-all hover:border-slate-700 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Ongoing Meal Badge */}
                  {isOngoing && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-1 rounded-bl-xl shadow flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                      <span>SERVED NOW</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center border`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{meta.name}</h3>
                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{menu?.timing || meta.timing}</span>
                          </div>
                        </div>
                      </div>

                      {/* Avg Rating Pill */}
                      <div className="text-right">
                        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{menu?.avgRating ? menu.avgRating.toFixed(1) : 'New'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {menu?.totalRatings ? `${menu.totalRatings} ratings` : 'No ratings yet'}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items List */}
                    <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-semibold text-slate-300">Menu Spread</span>
                        {menu?.calories && (
                          <span className="flex items-center space-x-1 text-slate-400 text-[11px]">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span>~{menu.calories} kcal</span>
                          </span>
                        )}
                      </div>

                      {menu && menu.items.length > 0 ? (
                        <ul className="space-y-1.5">
                          {menu.items.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-200 flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <span className="leading-relaxed font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">
                          Menu update pending for this meal.
                        </p>
                      )}

                      {menu?.specialNotes && (
                        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-amber-400/90 flex items-center space-x-1">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>{menu.specialNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action / Student Rating status */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    {myRating ? (
                      <div className="flex-1 flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-emerald-500/20">
                        <div>
                          <div className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            <span>You Rated:</span>
                            <div className="flex items-center space-x-0.5 ml-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < myRating.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {myRating.feedback && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                              "{myRating.feedback}"
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => setActiveRatingMeal(mealType)}
                          className="text-xs text-amber-400 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!user) {
                            onOpenAuth();
                          } else {
                            setActiveRatingMeal(mealType);
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-semibold text-xs border border-slate-700/60 transition-all flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{user ? 'Rate This Meal' : 'Sign In to Rate Meal'}</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Interactive Rating Modal */}
      {activeRatingMeal && (
        <MealRatingModal
          isOpen={!!activeRatingMeal}
          onClose={() => setActiveRatingMeal(null)}
          mealType={activeRatingMeal}
          date={selectedDate}
          existingRating={getMyMealRating(activeRatingMeal)?.rating}
          existingFeedback={getMyMealRating(activeRatingMeal)?.feedback}
          onSubmit={handleRatingSubmit}
        />
      )}

    </div>
  );
};
