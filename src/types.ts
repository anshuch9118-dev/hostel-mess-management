export type Role = 'admin' | 'student';

export type YearGroup = '1st' | '2nd' | '3rd' | '4th';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface User {
  id: number;
  fullName: string;
  rollNumber: string;
  email: string;
  year: YearGroup;
  branch: string;
  roomNumber: string;
  role: Role;
  createdAt: string;
}

export interface MenuItem {
  name: string;
  category?: string; // e.g. Main, Side, Beverage, Dessert
  isSpecial?: boolean;
  isJain?: boolean;
}

export interface MealMenu {
  id: number;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  items: string[]; // List of dish names
  timing: string; // e.g., "07:30 AM - 09:30 AM"
  calories?: number;
  specialNotes?: string;
  updatedAt: string;
}

export interface FoodRating {
  id: number;
  studentId: number;
  studentName?: string;
  studentRollNumber?: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  rating: number; // 1 to 5
  feedback?: string;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  targetYear: 'all' | YearGroup;
  createdBy: string;
  date: string;
}

export interface MealRatingSummary {
  mealType: MealType;
  avgRating: number;
  totalRatings: number;
  distribution: { [key: number]: number }; // star count -> frequency
}

export interface AdminAnalytics {
  totalStudents: number;
  todayAvgRating: number;
  totalFeedbacksToday: number;
  mealSummaries: MealRatingSummary[];
  recentFeedbacks: FoodRating[];
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DaySchedule {
  day: DayOfWeek;
  date: string;
  breakfast: MealMenu;
  lunch: MealMenu;
  snacks: MealMenu;
  dinner: MealMenu;
}

export interface MessMenuConfig {
  imageUrl: string | null;
  updatedAt: string;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
