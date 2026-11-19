import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb, hashPassword, saveDb } from './src/server/db';
import crypto from 'crypto';

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());

// Token map in memory (simple session token system)
const activeSessions: Map<string, { userId: number; role: string; rollNumber: string }> = new Map();

function generateToken(userId: number, role: string, rollNumber: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { userId, role, rollNumber });
  return token;
}

// Authentication middleware
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session) {
    // If server restarted, check token format or fallback to mock check for session
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  (req as any).user = session;
  next();
}

// Admin authorization middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privilege required' });
  }
  next();
}

async function initServer() {
  const db = await getDb();

  // Helper SQL execution wrappers
  function queryAll(sql: string, params: any[] = []): any[] {
    try {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (err) {
      console.error('SQL Exec Error:', err);
      return [];
    }
  }

  function runExec(sql: string, params: any[] = []) {
    db.run(sql, params);
    saveDb();
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { fullName, rollNumber, email, password, year, branch, roomNumber, role } = req.body;

      if (!fullName || !rollNumber || !email || !password) {
        return res.status(400).json({ error: 'Missing required registration fields' });
      }

      const existingRoll = queryAll('SELECT id FROM users WHERE roll_number = ?', [rollNumber]);
      if (existingRoll.length > 0) {
        return res.status(400).json({ error: 'Roll number is already registered' });
      }

      const existingEmail = queryAll('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email address is already registered' });
      }

      const passHash = hashPassword(password);
      const userRole = role === 'admin' ? 'admin' : 'student';

      runExec(
        `INSERT INTO users (full_name, roll_number, email, password_hash, year, branch, room_number, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, rollNumber, email, passHash, year || '1st', branch || 'General', roomNumber || 'N/A', userRole]
      );

      const created = queryAll('SELECT * FROM users WHERE roll_number = ?', [rollNumber])[0];
      const token = generateToken(created.id, created.role, created.roll_number);

      const userObj = {
        id: created.id,
        fullName: created.full_name,
        rollNumber: created.roll_number,
        email: created.email,
        year: created.year,
        branch: created.branch,
        roomNumber: created.room_number,
        role: created.role,
        createdAt: created.created_at,
      };

      res.json({ token, user: userObj });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body; // identifier can be rollNumber or email
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Roll number/Email and password are required' });
      }

      const passHash = hashPassword(password);
      const users = queryAll(
        'SELECT * FROM users WHERE (roll_number = ? OR email = ?) AND password_hash = ?',
        [identifier, identifier, passHash]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid login credentials' });
      }

      const user = users[0];
      const token = generateToken(user.id, user.role, user.roll_number);

      const userObj = {
        id: user.id,
        fullName: user.full_name,
        rollNumber: user.roll_number,
        email: user.email,
        year: user.year,
        branch: user.branch,
        roomNumber: user.room_number,
        role: user.role,
        createdAt: user.created_at,
      };

      res.json({ token, user: userObj });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Auth: Get Current User Profile
  app.get('/api/auth/me', authenticate, (req, res) => {
    const session = (req as any).user;
    const users = queryAll('SELECT * FROM users WHERE id = ?', [session.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];
    res.json({
      id: user.id,
      fullName: user.full_name,
      rollNumber: user.roll_number,
      email: user.email,
      year: user.year,
      branch: user.branch,
      roomNumber: user.room_number,
      role: user.role,
      createdAt: user.created_at,
    });
  });

  // Students Management (Admin)
  app.get('/api/students', authenticate, requireAdmin, (req, res) => {
    try {
      const students = queryAll("SELECT id, full_name as fullName, roll_number as rollNumber, email, year, branch, room_number as roomNumber, role, created_at as createdAt FROM users WHERE role = 'student' ORDER BY id DESC");
      res.json(students);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/students', authenticate, requireAdmin, (req, res) => {
    try {
      const { fullName, rollNumber, email, password, year, branch, roomNumber } = req.body;
      const passHash = hashPassword(password || 'student123');

      runExec(
        `INSERT INTO users (full_name, roll_number, email, password_hash, year, branch, room_number, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, rollNumber, email, passHash, year, branch, roomNumber, 'student']
      );

      res.json({ message: 'Student created successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create student' });
    }
  });

  app.put('/api/students/:id', authenticate, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, email, year, branch, roomNumber } = req.body;

      runExec(
        `UPDATE users SET full_name = ?, email = ?, year = ?, branch = ?, room_number = ? WHERE id = ? AND role = 'student'`,
        [fullName, email, year, branch, roomNumber, id]
      );

      res.json({ message: 'Student updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/students/:id', authenticate, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      runExec(`DELETE FROM users WHERE id = ? AND role = 'student'`, [id]);
      res.json({ message: 'Student deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Menu Routes
  app.get('/api/menu', (req, res) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const rows = queryAll('SELECT * FROM menus WHERE date = ?', [date]);

      // Calculate avg ratings for each meal
      const ratings = queryAll(
        `SELECT meal_type, AVG(rating) as avg_rating, COUNT(*) as rating_count 
         FROM ratings WHERE date = ? GROUP BY meal_type`,
        [date]
      );

      const ratingMap: Record<string, { avg: number; count: number }> = {};
      ratings.forEach((r) => {
        ratingMap[r.meal_type] = {
          avg: Math.round(Number(r.avg_rating) * 10) / 10,
          count: Number(r.rating_count),
        };
      });

      const parsedMenus = rows.map((r) => ({
        id: r.id,
        date: r.date,
        mealType: r.meal_type,
        items: JSON.parse(r.items || '[]'),
        timing: r.timing,
        calories: r.calories,
        specialNotes: r.special_notes,
        updatedAt: r.updated_at,
        avgRating: ratingMap[r.meal_type]?.avg || 0,
        totalRatings: ratingMap[r.meal_type]?.count || 0,
      }));

      res.json(parsedMenus);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Weekly Master Menu Schedule endpoint (7 days Monday - Sunday in a single payload)
  app.get('/api/menu/weekly', (req, res) => {
    try {
      const now = new Date();
      const defaultDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const refDateStr = (req.query.date as string) || defaultDateStr;
      
      const [y, m, d] = refDateStr.split('-').map(Number);
      const refDate = new Date(y, (m || 1) - 1, d || 1);
      
      const dayOfWeek = refDate.getDay(); // 0 is Sunday
      const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(y, (m || 1) - 1, (d || 1) + distanceToMonday);

      const daysOfWeekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const result = [];

      for (let i = 0; i < 7; i++) {
        const curDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const year = curDate.getFullYear();
        const month = String(curDate.getMonth() + 1).padStart(2, '0');
        const day = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const rows = queryAll('SELECT * FROM menus WHERE date = ?', [dateStr]);

        const mealMap: Record<string, any> = {
          breakfast: { date: dateStr, mealType: 'breakfast', items: [], timing: '8:00 AM – 9:00 AM' },
          lunch: { date: dateStr, mealType: 'lunch', items: [], timing: '12:30 PM – 1:30 PM' },
          snacks: { date: dateStr, mealType: 'snacks', items: [], timing: '5:00 PM – 5:30 PM' },
          dinner: { date: dateStr, mealType: 'dinner', items: [], timing: '8:00 PM – 9:00 PM' },
        };

        rows.forEach((r) => {
          mealMap[r.meal_type] = {
            id: r.id,
            date: r.date,
            mealType: r.meal_type,
            items: JSON.parse(r.items || '[]'),
            timing: r.timing,
            calories: r.calories,
            specialNotes: r.special_notes,
            updatedAt: r.updated_at,
          };
        });

        result.push({
          day: daysOfWeekNames[i],
          date: dateStr,
          breakfast: mealMap.breakfast,
          lunch: mealMap.lunch,
          snacks: mealMap.snacks,
          dinner: mealMap.dinner,
        });
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings & Mess Menu Image API
  app.get('/api/settings/menu-image', (req, res) => {
    try {
      const rows = queryAll("SELECT value, updated_at as updatedAt FROM settings WHERE key = 'mess_menu_image'");
      if (rows.length === 0) {
        return res.json({ imageUrl: null, updatedAt: null, notes: '' });
      }
      const data = JSON.parse(rows[0].value);
      res.json({
        imageUrl: data.imageUrl || null,
        updatedAt: rows[0].updatedAt,
        notes: data.notes || '',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/menu-image', authenticate, requireAdmin, (req, res) => {
    try {
      const { imageUrl, notes } = req.body;
      const valueStr = JSON.stringify({ imageUrl, notes: notes || '' });

      runExec(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('mess_menu_image', ?, CURRENT_TIMESTAMP)`,
        [valueStr]
      );

      res.json({ message: 'Mess menu image updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/menu', authenticate, requireAdmin, (req, res) => {
    try {
      const { date, mealType, items, timing, calories, specialNotes } = req.body;

      if (!date || !mealType || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid menu input data' });
      }

      runExec(
        `INSERT OR REPLACE INTO menus (date, meal_type, items, timing, calories, special_notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [date, mealType, JSON.stringify(items), timing || '', calories || 0, specialNotes || '']
      );

      res.json({ message: 'Menu updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/menu/:id', authenticate, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      runExec('DELETE FROM menus WHERE id = ?', [id]);
      res.json({ message: 'Menu item deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Food Rating Routes
  app.get('/api/ratings', (req, res) => {
    try {
      const date = req.query.date as string;
      const mealType = req.query.mealType as string;

      let sql = `
        SELECT r.id, r.student_id as studentId, r.date, r.meal_type as mealType, r.rating, r.feedback, r.created_at as createdAt,
               u.full_name as studentName, u.roll_number as studentRollNumber, u.room_number as roomNumber
        FROM ratings r
        JOIN users u ON r.student_id = u.id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (date) {
        conditions.push('r.date = ?');
        params.push(date);
      }
      if (mealType) {
        conditions.push('r.meal_type = ?');
        params.push(mealType);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY r.id DESC';

      const results = queryAll(sql, params);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student submits/updates rating (1 rating per student per meal per day constraint)
  app.post('/api/ratings', authenticate, (req, res) => {
    try {
      const session = (req as any).user;
      const { date, mealType, rating, feedback } = req.body;

      if (!date || !mealType || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
      }

      // SQLite INSERT OR REPLACE for student_id + date + meal_type UNIQUE key
      runExec(
        `INSERT OR REPLACE INTO ratings (student_id, date, meal_type, rating, feedback, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [session.userId, date, mealType, rating, feedback || '']
      );

      res.json({ message: 'Rating submitted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Student gets their own ratings for a specific date
  app.get('/api/ratings/my', authenticate, (req, res) => {
    try {
      const session = (req as any).user;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const myRatings = queryAll(
        'SELECT id, date, meal_type as mealType, rating, feedback, created_at as createdAt FROM ratings WHERE student_id = ? AND date = ?',
        [session.userId, date]
      );

      res.json(myRatings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Announcements Routes
  app.get('/api/announcements', (req, res) => {
    try {
      const announcements = queryAll(
        'SELECT id, title, content, priority, target_year as targetYear, created_by as createdBy, date FROM announcements ORDER BY id DESC'
      );
      res.json(announcements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/announcements', authenticate, requireAdmin, (req, res) => {
    try {
      const { title, content, priority, targetYear } = req.body;
      const today = new Date().toISOString().split('T')[0];

      runExec(
        `INSERT INTO announcements (title, content, priority, target_year, created_by, date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, content, priority || 'medium', targetYear || 'all', 'Mess Administration', today]
      );

      res.json({ message: 'Announcement created' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/announcements/:id', authenticate, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      runExec('DELETE FROM announcements WHERE id = ?', [id]);
      res.json({ message: 'Announcement deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Analytics Route (Admin)
  app.get('/api/analytics', authenticate, requireAdmin, (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const totalStudentsCount = queryAll("SELECT COUNT(*) as count FROM users WHERE role = 'student'")[0]?.count || 0;
      
      const todayAvg = queryAll('SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE date = ?', [today])[0];
      
      const recentFeedbacks = queryAll(
        `SELECT r.id, r.student_id as studentId, r.date, r.meal_type as mealType, r.rating, r.feedback, r.created_at as createdAt,
                u.full_name as studentName, u.roll_number as studentRollNumber
         FROM ratings r
         JOIN users u ON r.student_id = u.id
         WHERE r.feedback IS NOT NULL AND r.feedback != ''
         ORDER BY r.id DESC LIMIT 15`
      );

      // Meal summaries for today
      const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
      const mealSummaries = meals.map((m) => {
        const stats = queryAll('SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE date = ? AND meal_type = ?', [today, m])[0];
        
        // Rating distribution 1-5
        const distRows = queryAll('SELECT rating, COUNT(*) as c FROM ratings WHERE date = ? AND meal_type = ? GROUP BY rating', [today, m]);
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distRows.forEach((row) => {
          dist[row.rating] = row.c;
        });

        return {
          mealType: m,
          avgRating: stats?.avg ? Math.round(Number(stats.avg) * 10) / 10 : 0,
          totalRatings: stats?.count || 0,
          distribution: dist,
        };
      });

      res.json({
        totalStudents: Number(totalStudentsCount),
        todayAvgRating: todayAvg?.avg ? Math.round(Number(todayAvg.avg) * 10) / 10 : 0,
        totalFeedbacksToday: Number(todayAvg?.count || 0),
        mealSummaries,
        recentFeedbacks,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initServer();
