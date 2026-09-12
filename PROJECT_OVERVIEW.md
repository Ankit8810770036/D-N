# 🥗 Diet and Nutrition Planner Based on Health Metrics

> **Comprehensive Project Master File**  
> *Note for AI Assistants:* Read this file upon starting work in this workspace to get a complete understanding of the project architecture, features, API routes, database models, and run commands without needing to inspect individual files again.

---

## 📌 1. Project Overview & Features

**Diet & Nutrition Planner** is a full-stack health, nutrition, and meal-planning web application powered by **AI (Groq / Llama 3.3 70B)** and medically recognized health formulas.

### Key Capabilities & Modules
1. **🔐 Authentication & RBAC**: Laravel Sanctum token-based authentication with profile picture upload and Spatie role-based access control (User vs. Admin).
2. **📊 Health Profile & Metric Calculation**: Calculates BMI, BMR (Miffin-St Jeor), TDEE, water intake, ideal weight (Devine formula), and diet-type aware macro splits (Standard, Keto, Paleo).
3. **🤖 AI Meal Planner**: Generates personalized 7-day meal plans (Breakfast, Morning Snack, Lunch, Evening Snack, Dinner) using user health profiles and food preferences. Supports meal swapping, consumption tracking, and automatic grocery list generation.
4. **🍎 Food & Recipe Database**: 100+ seeded foods with full macro breakdowns. Cookbook with recipes and premium recipe gating.
5. **📈 Progress & Analytics**: Daily tracking of weight, calories, protein, carbs, fat, water, sleep, and exercise with interactive Recharts visualisations.
6. **🏆 Gamification & HealthCoins System**: Earn coins for daily logins, logging progress, completing workouts, hitting calorie targets, and streak milestones (7-day / 30-day). Redeem coins for premium access or payment discounts.
7. **💬 AI Chatbot**: Groq-powered AI nutritional assistant (`llama-3.3-70b-versatile`) with offline fallback logic.
8. **📄 PDF Health Reports**: Generates downloadable PDF health reports via `barryvdh/laravel-dompdf`.
9. **💳 Subscription & Payments**: Basic vs. Premium subscription integration with Razorpay.
10. **🛡 Admin Management Panel**: Admin stats, user management, and food database editing.

---

## 🏗 2. Tech Stack & Architecture

| Component | Framework / Tech | Description / Role |
|---|---|---|
| **Frontend** | React 18 + Vite 6 | SPA built with Tailwind CSS, React Router v6, React Query, Recharts, Headless UI, React Hot Toast |
| **Backend** | Laravel 12 (PHP 8.2+) | RESTful API backend handling auth, AI logic, calculation services, transactions, PDF exports |
| **Database** | MySQL 8.x | Relational DB storing users, profiles, foods, meal plans, progress logs, coins, transactions |
| **AI Integration** | Groq API (`llama-3.3-70b`) | Powers AI chatbot and intelligent meal planning recommendations |
| **Payments** | Razorpay SDK | Manages order creation, signature verification, and premium plan upgrades |
| **Socket Server** | Socket.io (Node.js) | Real-time notifications / communication server (`socket-server`) |

---

## 📁 3. Project Directory Structure

```
Diet and Nutrition Planner Based on Health Metrics/
├── PROJECT_OVERVIEW.md           # Master documentation file (This File)
├── backend/                      # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/Controllers/API/ # Auth, DietPlanner, Food, Recipe, Progress, Token, Chatbot, Report, Admin, Subscription
│   │   ├── Models/               # User, UserProfile, Food, MealPlan, MealItem, ProgressLog, Recipe, UserToken, TokenTransaction
│   │   └── Services/             # HealthCalculatorService, GeminiService, TokenService, AchievementService
│   ├── database/
│   │   ├── migrations/           # 23 database migrations
│   │   └── seeders/              # FoodSeeder (100+ items), RecipeSeeder
│   ├── routes/api.php            # All REST API endpoints
│   └── .env                      # Database & API configuration
├── frontend/                     # React 18 + Vite 6 Client Application
│   ├── src/
│   │   ├── pages/                # Login, Register, Dashboard, Profile, Planner, Progress, Reports, ShoppingList, Cookbook, Admin
│   │   ├── components/           # AppLayout, Navbar, Modals, Cards, Charts
│   │   ├── context/              # AuthContext, ThemeContext
│   │   └── services/             # Axios API client integrations
│   ├── package.json              # Frontend npm dependencies
│   └── vite.config.js            # Vite configuration
└── socket-server/                # Socket.io Server logic
```

---

## 🌐 4. Key API Endpoints & Routes

### Public Routes
- `POST /api/register` — Create account
- `POST /api/login` — Login and receive Sanctum Bearer token
- `GET /api/foods` — Browse food database

### Authenticated Routes (`Authorization: Bearer {token}`)
- `GET /api/me` — User details & plan type
- `GET /api/profile` & `PUT /api/profile/update` — Health profile & metrics
- `POST /api/generate-plan` & `GET /api/meal-plan` — AI 7-day meal plan
- `GET /api/grocery-list` & `PUT /api/grocery-toggle` — Shopping list management
- `POST /api/log-progress` & `GET /api/analytics` — Daily health log & trends
- `GET /api/tokens` & `POST /api/tokens/daily-login` — HealthCoin wallet & rewards
- `POST /api/chat` — Groq AI chatbot endpoint
- `GET /api/report/pdf` — Download PDF health report
- `POST /api/payment/create-order` & `POST /api/payment/verify` — Razorpay payment flow

### Admin Routes (`can:admin` middleware)
- `GET /api/admin/stats` — Platform analytics
- `GET /api/admin/users` & `PUT /api/admin/users/{user}` — User management
- `PUT /api/foods/{food}` & `DELETE /api/foods/{food}` — Food catalog management

---

## ⚡ 5. Commands to Run the Project

### 🚀 Running the Development Servers

To run the full project, you need to start **both** the backend and frontend servers:

#### 1. Backend (Laravel API Server)
Open a terminal in the root workspace and run:
```powershell
cd backend
php artisan serve
```
> 📍 Backend will run at: `http://127.0.0.1:8000`

#### 2. Frontend (React + Vite App)
Open a second terminal in the root workspace and run:
```powershell
cd frontend
npm run dev
```
> 📍 Frontend will run at: `http://localhost:5173`

---

### 🔧 First-Time Environment Setup (If setup from scratch)

#### Backend Setup:
```powershell
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Ensure MySQL database 'diet_planner' is created in phpMyAdmin/MySQL
php artisan migrate --seed
```

#### Frontend Setup:
```powershell
cd frontend
npm install
```

---

## 🤖 AI Assistant Instruction

When loading this workspace:
1. Refer to this `PROJECT_OVERVIEW.md` file for full context on architecture, routes, database tables, and run commands.
2. Do **not** re-scan or view every file unless specifically debugging or implementing a target feature.
3. Backend commands must be executed in the `./backend` folder (`cd backend`).
4. Frontend commands must be executed in the `./frontend` folder (`cd frontend`).
