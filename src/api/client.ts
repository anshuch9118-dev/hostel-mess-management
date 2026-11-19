import { User, MealMenu, FoodRating, Announcement, AdminAnalytics, MealType, YearGroup, DaySchedule, MessMenuConfig } from '../types';

const TOKEN_KEY = 'mess_auth_token';
const USER_KEY = 'mess_user_data';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `HTTP error ${res.status}`);
  }

  return json as T;
}

export const api = {
  auth: {
    register: (data: {
      fullName: string;
      rollNumber: string;
      email: string;
      password: string;
      year: YearGroup;
      branch: string;
      roomNumber: string;
      role?: 'student' | 'admin';
    }) => apiFetch<{ token: string; user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: { identifier: string; password: string }) =>
      apiFetch<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    me: () => apiFetch<User>('/api/auth/me'),
  },

  menu: {
    getByDate: (date: string) => apiFetch<(MealMenu & { avgRating?: number; totalRatings?: number })[]>(`/api/menu?date=${date}`),
    getWeekly: (date?: string) => apiFetch<DaySchedule[]>(`/api/menu/weekly${date ? `?date=${date}` : ''}`),
    save: (data: { date: string; mealType: MealType; items: string[]; timing: string; calories?: number; specialNotes?: string }) =>
      apiFetch<{ message: string }>('/api/menu', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ message: string }>(`/api/menu/${id}`, { method: 'DELETE' }),
  },

  settings: {
    getMenuImage: () => apiFetch<MessMenuConfig>('/api/settings/menu-image'),
    saveMenuImage: (data: { imageUrl: string | null; notes?: string }) =>
      apiFetch<{ message: string }>('/api/settings/menu-image', { method: 'POST', body: JSON.stringify(data) }),
  },

  ratings: {
    get: (date?: string, mealType?: string) => {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (mealType) params.append('mealType', mealType);
      return apiFetch<FoodRating[]>(`/api/ratings?${params.toString()}`);
    },
    myRatings: (date: string) => apiFetch<FoodRating[]>(`/api/ratings/my?date=${date}`),
    submit: (data: { date: string; mealType: MealType; rating: number; feedback?: string }) =>
      apiFetch<{ message: string }>('/api/ratings', { method: 'POST', body: JSON.stringify(data) }),
  },

  students: {
    list: () => apiFetch<User[]>('/api/students'),
    create: (data: { fullName: string; rollNumber: string; email: string; password?: string; year: YearGroup; branch: string; roomNumber: string }) =>
      apiFetch<{ message: string }>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { fullName: string; email: string; year: YearGroup; branch: string; roomNumber: string }) =>
      apiFetch<{ message: string }>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ message: string }>(`/api/students/${id}`, { method: 'DELETE' }),
  },

  announcements: {
    list: () => apiFetch<Announcement[]>('/api/announcements'),
    create: (data: { title: string; content: string; priority: 'high' | 'medium' | 'low'; targetYear: string }) =>
      apiFetch<{ message: string }>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ message: string }>(`/api/announcements/${id}`, { method: 'DELETE' }),
  },

  analytics: {
    get: () => apiFetch<AdminAnalytics>('/api/analytics'),
  },
};
