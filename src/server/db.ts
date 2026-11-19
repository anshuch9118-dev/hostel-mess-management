import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';
import crypto from 'crypto';

let db: Database | null = null;
const DB_PATH = path.join(process.cwd(), 'data', 'mess_db.sqlite');

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'mess_app_salt_2026', 1000, 64, 'sha512').toString('hex');
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize Schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      year TEXT NOT NULL,
      branch TEXT NOT NULL,
      room_number TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
      items TEXT NOT NULL,
      timing TEXT NOT NULL,
      calories INTEGER DEFAULT 0,
      special_notes TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, meal_type)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      feedback TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date, meal_type),
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      target_year TEXT DEFAULT 'all',
      created_by TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDb();

  // Seed Admin if not present
  const adminCheck = db.exec("SELECT * FROM users WHERE role = 'admin'");
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    seedInitialData(db);
  } else {
    // Always update/refresh the current week's 7-day menu with the user's latest schedule
    seedWeeklyMenus(db);
  }

  return db;
}

function seedWeeklyMenus(database: Database) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const localToday = new Date(y, m, d);
  const currentDayOfWeek = localToday.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(y, m, d + distanceToMonday);

  const weeklyMenuTemplates = [
    {
      dayName: 'Monday',
      breakfast: { items: ['Aloo Paratha', 'Curd', 'Tea', 'Pickle'], cal: 480, timing: '8:00 AM – 9:00 AM', notes: 'Monday Breakfast' },
      lunch: { items: ['Arhar Dal', 'Green Vegetable', 'Rice', 'Roti', 'Salad'], cal: 720, timing: '12:30 PM – 1:30 PM', notes: 'Monday Lunch' },
      snacks: { items: ['Chana Chaat', 'Tea', 'Sauce'], cal: 280, timing: '5:00 PM – 5:30 PM', notes: 'Monday Evening Snacks' },
      dinner: { items: ['Dal Makhani / Mix Dal', 'Mix Vegetable', 'Rice', 'Roti', 'Salad', 'Pickles'], cal: 780, timing: '8:00 PM – 9:00 PM', notes: 'Monday Dinner' }
    },
    {
      dayName: 'Tuesday',
      breakfast: { items: ['Puri', 'Aloo Tamatar', 'Tea'], cal: 460, timing: '8:00 AM – 9:00 AM', notes: 'Tuesday Breakfast' },
      lunch: { items: ['Malka Masoor Dal', 'Aloo Shimla', 'Rice', 'Roti', 'Salad'], cal: 700, timing: '12:30 PM – 1:30 PM', notes: 'Tuesday Lunch' },
      snacks: { items: ['Chowmein', 'Sauce', 'Tea'], cal: 320, timing: '5:00 PM – 5:30 PM', notes: 'Tuesday Evening Snacks' },
      dinner: { items: ['Paneer Dish', 'Aloo Bhujia', 'Rice', 'Roti', 'Salad'], cal: 810, timing: '8:00 PM – 9:00 PM', notes: 'Tuesday Dinner' }
    },
    {
      dayName: 'Wednesday',
      breakfast: { items: ['2 Eggs', 'Sandwich', '2 Bananas', 'Tea', 'Milk'], cal: 510, timing: '8:00 AM – 9:00 AM', notes: 'Wednesday Breakfast' },
      lunch: { items: ['Chole', 'Mix Vegetable', 'Rice', 'Roti', 'Salad', 'Boondi Raita'], cal: 750, timing: '12:30 PM – 1:30 PM', notes: 'Wednesday Lunch' },
      snacks: { items: ['Bhel Puri', 'Rabri'], cal: 340, timing: '5:00 PM – 5:30 PM', notes: 'Wednesday Evening Snacks' },
      dinner: { items: ['Tadka Chana Dal', 'Seasonal Vegetable', 'Matar Zeera', 'Rice', 'Roti', 'Salad', 'Gulab Jamun'], cal: 840, timing: '8:00 PM – 9:00 PM', notes: 'Wednesday Dinner' }
    },
    {
      dayName: 'Thursday',
      breakfast: { items: ['Aloo Pyaz / Gobhi Paratha', 'Curd', 'Tea', 'Pickle'], cal: 490, timing: '8:00 AM – 9:00 AM', notes: 'Thursday Breakfast' },
      lunch: { items: ['Kadhi Pakoda', 'Aloo Jeera', 'Rice', 'Roti', 'Salad'], cal: 730, timing: '12:30 PM – 1:30 PM', notes: 'Thursday Lunch' },
      snacks: { items: ['Pasta', 'Tea'], cal: 310, timing: '5:00 PM – 5:30 PM', notes: 'Thursday Evening Snacks' },
      dinner: { items: ['Rajma', 'Mix Vegetable', 'Rice', 'Roti', 'Salad', 'Pickles'], cal: 790, timing: '8:00 PM – 9:00 PM', notes: 'Thursday Dinner' }
    },
    {
      dayName: 'Friday',
      breakfast: { items: ['Plain Paratha', 'Sabji', 'Tea', 'Pickle'], cal: 450, timing: '8:00 AM – 9:00 AM', notes: 'Friday Breakfast' },
      lunch: { items: ['Aloo Soyabean', 'Fried Rice', 'Green Chutney', 'Roti', 'Salad'], cal: 760, timing: '12:30 PM – 1:30 PM', notes: 'Friday Lunch' },
      snacks: { items: ['Samosa', 'Tea'], cal: 300, timing: '5:00 PM – 5:30 PM', notes: 'Friday Evening Snacks' },
      dinner: { items: ['Poori', 'Aloo Tamatar Sabji', 'Rice', 'Kheer / Ice Cream', 'Roti', 'Salad'], cal: 830, timing: '8:00 PM – 9:00 PM', notes: 'Friday Dinner' }
    },
    {
      dayName: 'Saturday',
      breakfast: { items: ['Pav Bhaji', 'Tea'], cal: 470, timing: '8:00 AM – 9:00 AM', notes: 'Saturday Breakfast' },
      lunch: { items: ['Rajma', 'Kali Chana Dal', 'Rice', 'Roti', 'Salad', 'Pickles'], cal: 740, timing: '12:30 PM – 1:30 PM', notes: 'Saturday Lunch' },
      snacks: { items: ['Cutlet', 'Tea'], cal: 330, timing: '5:00 PM – 5:30 PM', notes: 'Saturday Evening Snacks' },
      dinner: { items: ['Arhar Dal', 'Seasonal Vegetable', 'Rice', 'Roti', 'Salad', 'Pickles'], cal: 760, timing: '8:00 PM – 9:00 PM', notes: 'Saturday Dinner' }
    },
    {
      dayName: 'Sunday',
      breakfast: { items: ['2 Bananas', 'Bread Jam', 'Milk', 'Tea', 'Sauce'], cal: 430, timing: '8:00 AM – 9:00 AM', notes: 'Sunday Breakfast' },
      lunch: { items: ['Chole Bhature', 'Rice', 'Salad', '½ Lemon', 'Fried Chilli', 'Boondi Raita'], cal: 880, timing: '12:30 PM – 1:30 PM', notes: 'Sunday Special Lunch' },
      snacks: { items: ['Biscuits', 'Tea'], cal: 220, timing: '5:00 PM – 5:30 PM', notes: 'Sunday Evening Snacks' },
      dinner: { items: ['Egg Curry / Paneer', 'Rice', 'Roti', 'Salad'], cal: 820, timing: '8:00 PM – 9:00 PM', notes: 'Sunday Special Dinner' }
    }
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const tmpl = weeklyMenuTemplates[i];

    database.run(
      `INSERT OR REPLACE INTO menus (date, meal_type, items, timing, calories, special_notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [dateStr, 'breakfast', JSON.stringify(tmpl.breakfast.items), tmpl.breakfast.timing, tmpl.breakfast.cal, tmpl.breakfast.notes]
    );
    database.run(
      `INSERT OR REPLACE INTO menus (date, meal_type, items, timing, calories, special_notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [dateStr, 'lunch', JSON.stringify(tmpl.lunch.items), tmpl.lunch.timing, tmpl.lunch.cal, tmpl.lunch.notes]
    );
    database.run(
      `INSERT OR REPLACE INTO menus (date, meal_type, items, timing, calories, special_notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [dateStr, 'snacks', JSON.stringify(tmpl.snacks.items), tmpl.snacks.timing, tmpl.snacks.cal, tmpl.snacks.notes]
    );
    database.run(
      `INSERT OR REPLACE INTO menus (date, meal_type, items, timing, calories, special_notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [dateStr, 'dinner', JSON.stringify(tmpl.dinner.items), tmpl.dinner.timing, tmpl.dinner.cal, tmpl.dinner.notes]
    );
  }

  saveDb();
}

function seedInitialData(database: Database) {
  const adminPass = hashPassword('admin123');
  database.run(
    `INSERT INTO users (full_name, roll_number, email, password_hash, year, branch, room_number, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Mess Chief Warden', 'ADMIN001', 'admin@mess.hostel.edu', adminPass, '4th', 'Administration', 'Office-01', 'admin']
  );

  // Seed sample students
  const student1Pass = hashPassword('student123');
  database.run(
    `INSERT INTO users (full_name, roll_number, email, password_hash, year, branch, room_number, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Aarav Sharma', '2023CS101', 'aarav@hostel.edu', student1Pass, '3rd', 'Computer Science', 'B-302', 'student']
  );
  database.run(
    `INSERT INTO users (full_name, roll_number, email, password_hash, year, branch, room_number, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Priya Patel', '2024EC205', 'priya@hostel.edu', student1Pass, '2nd', 'Electronics', 'A-108', 'student']
  );
  database.run(
    `INSERT INTO users (full_name, roll_number, email, password_hash, year, branch, room_number, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Rohan Verma', '2025ME312', 'rohan@hostel.edu', student1Pass, '1st', 'Mechanical', 'C-204', 'student']
  );

  // Seed 7 days of current week (Monday through Sunday)
  seedWeeklyMenus(database);

  // Today's date YYYY-MM-DD
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;

  // Seed sample ratings
  database.run(
    `INSERT INTO ratings (student_id, date, meal_type, rating, feedback)
     VALUES (?, ?, ?, ?, ?)`,
    [2, today, 'breakfast', 5, 'Idlis were fresh and sambar was nice and piping hot!']
  );
  database.run(
    `INSERT INTO ratings (student_id, date, meal_type, rating, feedback)
     VALUES (?, ?, ?, ?, ?)`,
    [3, today, 'breakfast', 4, 'Good breakfast, chutneys were tasty.']
  );
  database.run(
    `INSERT INTO ratings (student_id, date, meal_type, rating, feedback)
     VALUES (?, ?, ?, ?, ?)`,
    [2, today, 'lunch', 4, 'Paneer butter masala was rich and flavorful. Service was smooth.']
  );

  // Seed announcements
  database.run(
    `INSERT INTO announcements (title, content, priority, target_year, created_by, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Special Sunday Ice Cream & Grand Feast Menu',
      'This Sunday lunch & dinner will feature special Kadhai Paneer, Butter Naan, Veg Pulao, and Ice Cream sundaes for all students.',
      'high',
      'all',
      'Mess Management',
      today
    ]
  );
  database.run(
    `INSERT INTO announcements (title, content, priority, target_year, created_by, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Mess Inspection & Cleanliness Audit',
      'Regular hygiene audit was conducted yesterday and mess hygiene rated 5/5 stars by the University Health Committee.',
      'medium',
      'all',
      'Mess Supervisor',
      today
    ]
  );

  saveDb();
}
