# Hostel Mess Management System

A full-stack web application built to streamline daily hostel mess operations—allowing students to check daily and weekly meal schedules, submit 1–5 star ratings with feedback, and receive announcements, while giving the mess warden/admin a centralized dashboard to manage menus, review student feedback, and broadcast notices.

**Live Demo:** [https://hostel-mess-management-fgnh.onrender.com/](https://hostel-mess-management-fgnh.onrender.com/)

---

## Features

### Student Portal
- **Daily & Date-Wise Menu View:** Browse Breakfast, Lunch, Evening Snacks, and Dinner menus with serving timings, calorie estimates, and special notes.
- **Weekly Master Schedule:** View the complete Monday–Sunday mess timetable along with any uploaded mess notice board image.
- **Meal Ratings & Feedback:** Rate individual meals (1–5 stars) and share written comments/suggestions.
- **Digital Meal Pass:** Access a personalized student meal pass modal with roll number, branch, year, and room details.
- **Notice Board:** View mess announcements filtered by priority and target year group.

### Warden / Admin Dashboard
- **Analytics Overview:** Track registered student count, daily average meal ratings, rating distributions (1–5 stars), and recent student feedback comments.
- **Menu Management:** Create or update daily meal items, timings, calories, and special notes, or upload a photo of the physical mess menu board.
- **Announcements:** Publish priority-tagged notices (`high`, `medium`, `low`) targeted to all students or specific academic years.
- **Student Directory:** Search and view registered hostel residents and filter by year.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend:** Node.js, Express
- **Database:** SQLite (`sql.js` persisted to `data/mess_db.sqlite`)
- **Build & Tooling:** Vite, esbuild, tsx

---

## Project Structure

```text
├── server.ts                  # Express API server & production static serving
├── vite.config.ts             # Vite & Tailwind CSS configuration
├── package.json
├── index.html
└── src/
    ├── App.tsx                # Root application & role-based routing
    ├── types.ts               # Shared TypeScript interfaces
    ├── api/
    │   └── client.ts          # Frontend API client
    ├── utils/
    │   └── date.ts            # Local timezone date formatting helpers
    ├── server/
    │   └── db.ts              # SQLite schema initialization & seed data
    └── components/
        ├── AuthModal.tsx
        ├── Navbar.tsx
        ├── StudentDashboard.tsx
        ├── AdminDashboard.tsx
        ├── WeeklyMenuTable.tsx
        ├── MealRatingModal.tsx
        ├── MealPassModal.tsx
        └── NotificationDrawer.tsx