# 🥗 Metrivita — Diet & Nutrition Planner Based on Health Metrics

> **Comprehensive Project Master File**  
> *Note for AI Assistants:* Read this file upon starting work in this workspace to get a complete understanding of the project architecture, features, API routes, database models, and run commands without needing to inspect individual files again.

---

## 📌 1. Project Overview & Features

**Metrivita (Diet & Nutrition Planner)** is an enterprise-grade full-stack health, nutrition, and meal-planning web application powered by **AI (Groq / NVIDIA NIM / Llama 3.3 70B)** and medically recognized health formulas (Mifflin-St Jeor, Devine, ICMR-NIN).

### Key Capabilities & Modules
1. **🔐 Authentication & RBAC**: Laravel Sanctum token-based authentication with profile picture upload, asynchronous verification emails, and Spatie role-based access control (User vs. Admin).
2. **📊 Health Profile & Metric Calculation**: Calculates BMI, BMR (Mifflin-St Jeor), TDEE, water intake, ideal weight (Devine formula), dynamic recalibration prompts ($\pm 2\text{ kg}$ threshold), and diet-type aware macro splits (Standard, Keto, Paleo, Vegan, Jain).
3. **🤖 AI & Rule-Based Meal Planner**: Generates personalized daily and 7-day weekly meal plans (Breakfast, Morning Snack, Lunch, Evening Snack, Dinner) using authentic Indian foods. Supports smart ingredient swapping, calorie balancing pass, consumption tracking, and automatic grocery list generation.
4. **🍎 Food & Recipe Database**: 100+ seeded Indian foods with full macro breakdowns. Cookbook with recipes and premium recipe gating. Live camera barcode scanner with OpenFoodFacts lookup proxy.
5. **📈 Progress & Analytics**: Daily tracking of weight, calories, protein, carbs, fat, water, sleep, and exercise with interactive Recharts visualisations.
6. **🏆 Gamification & HealthCoins System**: Earn coins for daily logins, logging progress, completing workouts, hitting calorie targets, submitting feedback, and streak milestones (7-day / 14-day / 30-day). Redeem coins for premium access or payment discounts.
7. **💬 24/7 AI Health Chatbot**: Groq and NVIDIA NIM powered AI nutritional assistant with conversational memory, food estimation, and offline fallback logic.
8. **📄 PDF Health & Grocery Reports**: Generates downloadable PDF health reports and grocery shopping lists via `barryvdh/laravel-dompdf`.
9. **💳 Subscription & Payments**: Basic vs. Premium subscription integration with Razorpay and free token redemption.
10. **💬 User Feedback & Triage System**: Submit user ratings (1-5 stars), bug reports, feature requests, and device diagnostic info with instant +10 HealthCoin rewards and an Admin triage center.
11. **🛡 Admin Management Panel**: Platform analytics, user management, feedback triage, and food database editing.
12. **⚡ High-Performance Backend Architecture**: 
    - **Laravel Octane**: Application booted once in RAM for sub-10ms response latency and high concurrency.
    - **Advanced Composite Indexes**: Zero-bottleneck queries on `meal_plans`, `meal_items`, `progress_logs`, `feedbacks`, `recipes`, `token_transactions`, and `foods`.
    - **Asynchronous Background Queues**: Offloaded heavy tasks (`ProcessWeeklyAiMealPlan`, `SendVerificationEmailJob`, `GeneratePdfReportJob`) to prioritized Redis/Database queues (`high`, `default`, `low`).
13. **📱 Mobile & PWA Ergonomics**: 
    - Full Progressive Web App (PWA) with Service Worker caching and home-screen installation.
    - Safe area padding (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`), native tap targets, and backdrop scroll locking.
    - Chunk-split vendor bundles and 5-minute TanStack Query caching for instant 0ms page transitions.

---

## 🏗 2. Tech Stack & Architecture

| Component | Framework / Tech | Description / Role |
|---|---|---|
| **Frontend** | React 18 + Vite 6 | SPA built with Tailwind CSS, React Router v6, TanStack Query v5, Recharts, Headless UI, React Hot Toast |
| **Backend** | Laravel 12 (PHP 8.2+) | RESTful API backend handling auth, calculation engines, AI logic, PDF exports, and Octane daemon mode |
| **High Performance** | Laravel Octane & Horizon | In-memory application boot with FrankenPHP/RoadRunner + Redis multi-priority queues |
| **Database** | MySQL 8.x / PostgreSQL 16 | Relational DB storing users, profiles, foods, meal plans, progress logs, coins, transactions with composite indexes |
| **AI Integration** | Groq & NVIDIA NIM (`llama-3.3-70b`) | Powers AI chatbot and 7-day weekly meal planning recommendations with offline rule fallbacks |
| **Payments** | Razorpay SDK | Manages order creation, signature verification, and premium upgrades |
| **Socket Server** | Socket.io (Node.js) | Real-time notifications server (`socket-server`) |

---

## 📁 3. Project Directory Structure

```
Diet and Nutrition Planner Based on Health Metrics/
├── PROJECT_OVERVIEW.md           # Master documentation file (This File)
├── README.md                     # Public repository documentation & badges
├── backend/                      # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/Controllers/API/ # Auth, DietPlanner, Food, Recipe, Progress, Token, Chatbot, Report, Admin, Subscription, Feedback
│   │   ├── Jobs/                 # ProcessWeeklyAiMealPlan, SendVerificationEmailJob, GeneratePdfReportJob
│   │   ├── Models/               # User, UserProfile, Food, MealPlan, MealItem, ProgressLog, Recipe, UserToken, TokenTransaction, Feedback
│   │   ├── Providers/            # AppServiceProvider (Lazy Loading Guard, Gates)
│   │   └── Services/             # HealthCalculatorService, GroqService, NvidiaNimService, TokenService, AchievementService
│   ├── config/                   # octane.php, horizon.php, queue.php, services.php
│   ├── database/
│   │   ├── migrations/           # 28 migrations with composite performance indexes
│   │   └── seeders/              # FoodSeeder (100+ Indian foods), RecipeSeeder, DatabaseSeeder
│   ├── routes/api.php            # 54 REST API endpoints
│   └── .env                      # Database & API configuration
├── frontend/                     # React 18 + Vite 6 Client Application
│   ├── src/
│   │   ├── pages/                # Login, Register, Dashboard, Profile, Planner, Progress, Reports, ShoppingList, Cookbook, Admin, Feedback, Workouts
│   │   ├── components/           # AppLayout, Navbar, AuthNavbar, Modals, Cards, Charts, BarcodeScanner, ChatBot, ErrorBoundary
│   │   ├── context/              # AuthContext, ThemeContext
│   │   ├── hooks/                # useBodyScrollLock, useDebounce
│   │   └── services/             # Axios API client integrations
│   ├── package.json              # Frontend npm dependencies
│   └── vite.config.js            # Vite Rollup chunk splitting & build configuration
└── socket-server/                # Socket.io Server logic
```

---

## 🌐 4. Key API Endpoints & Routes (54 Routes)

### Public Routes
- `POST /api/register` — Create account (async email dispatch)
- `POST /api/login` — Login and receive Sanctum Bearer token
- `POST /api/forgot-password` & `POST /api/reset-password` — Password reset
- `GET /api/foods` — Browse food database with category/veg filters
- `GET /api/health-check` — System health and status check
- `GET /api/setup-db` — Remote deployment database migration runner

### Authenticated Routes (`Authorization: Bearer {token}`)
- `GET /api/me` — Current user payload, profile, and token balance
- `GET /api/profile` & `PUT /api/profile/update` — Health profile & metrics
- `POST /api/profile/recalibrate` — Recalibrate targets on weight change
- `POST /api/generate-plan` & `GET /api/meal-plan` — Daily diet plan & status
- `POST /api/generate-ai-weekly-plan` — 7-day AI meal plan (`async=true` queue support)
- `PUT /api/meal-item/{id}/consume` — Toggle meal consumption & award tokens
- `PUT /api/meal-item/{id}/swap` — Smart ingredient swap
- `GET /api/grocery-list` & `PUT /api/grocery-toggle` — Automated shopping list
- `GET /api/grocery-list/pdf` & `GET /api/report/pdf` — PDF export downloads
- `POST /api/log-progress` & `GET /api/analytics` — Daily biometric logging & trends
- `GET /api/tokens` & `POST /api/tokens/daily-login` & `POST /api/tokens/redeem` — HealthCoin economy
- `POST /api/feedback` — Submit feedback, ratings & receive +10 HealthCoins
- `POST /api/chat` & `POST /api/chat/log-food` — AI chatbot & food estimation
- `GET /api/barcode/lookup/{barcode}` — Barcode lookup with OpenFoodFacts proxy
- `GET /api/recipes` & `POST /api/recipes` — Cookbook & recipe builder
- `POST /api/payment/create-order` & `POST /api/payment/verify` — Razorpay payment flow

### Admin Routes (`can:admin` middleware)
- `GET /api/admin/stats` — Platform analytics (cached)
- `GET /api/admin/users`, `PUT /api/admin/users/{user}`, `DELETE /api/admin/users/{user}` — User management
- `GET /api/admin/export-users` — CSV user export
- `GET /api/admin/feedbacks`, `PUT /api/admin/feedbacks/{feedback}`, `DELETE /api/admin/feedbacks/{feedback}` — Feedback triage
- `POST /api/admin/refresh-cache` — System cache synchronization
- `PUT /api/foods/{food}` & `DELETE /api/foods/{food}` — Food catalog management

---

## ⚡ 5. Commands to Run the Project

### 🚀 Running the Development Servers

#### 1. Backend (Laravel API Server)
```powershell
cd backend
php artisan serve
```
> 📍 Backend will run at: `http://127.0.0.1:8000`

##### ⚡ High-Throughput & Low-Latency Daemon (Laravel Octane):
```powershell
cd backend
# Run with FrankenPHP / RoadRunner (In-memory multi-worker daemon)
php artisan octane:start --workers=4 --port=8000
```

##### ⚙️ Background Queue Worker:
```powershell
cd backend
php artisan queue:work --queue=high,default,low --tries=3
```

#### 2. Frontend (React + Vite App)
```powershell
cd frontend
npm run dev
```
> 📍 Frontend will run at: `http://localhost:5173`

---

## 🤖 AI Assistant Instruction

When loading this workspace:
1. Refer to this `PROJECT_OVERVIEW.md` file for full context on architecture, routes, database tables, and run commands.
2. Do **not** re-scan or view every file unless specifically debugging or implementing a target feature.
3. Backend commands must be executed in the `./backend` folder (`cd backend`).
4. Frontend commands must be executed in the `./frontend` folder (`cd frontend`).
