# 🥗 Diet & Nutrition Planner — Backend API

A full-featured **Laravel 12** REST API powering the Diet & Nutrition Planner application. It handles user authentication, AI-driven meal planning, health metric calculations, gamification, subscription payments, and more.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features Overview](#-features-overview)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Services Layer](#-services-layer)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running Tests](#-running-tests)

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **PHP** | ^8.2 | Core language |
| **Laravel** | ^12.0 | Backend framework |
| **MySQL** | 8.x | Primary database |
| **Laravel Sanctum** | ^4.0 | API token authentication |
| **Spatie Permissions** | ^6.25 | Role-based access control |
| **barryvdh/laravel-dompdf** | ^3.1 | PDF report generation |
| **Groq API (Llama 3.3 70B)** | — | AI chatbot & meal intelligence |
| **Razorpay** | — | Payment gateway |
| **Vite + Tailwind CSS** | — | Frontend asset bundling |

---

## ✨ Features Overview

### 1. 🔐 Authentication (Laravel Sanctum)
- **Register** with name, email, and password
- **Login** returns a Bearer token for all protected routes
- **Logout** revokes the current token
- **Profile photo upload** — stored on the server, URL returned
- All protected routes use `auth:sanctum` middleware

---

### 2. 📊 Health Profile & Metric Calculations
Powered by `HealthCalculatorService` using medically recognized formulas:

| Metric | Formula Used |
|---|---|
| **BMI** | `weight(kg) ÷ height(m)²` |
| **BMR** | Mifflin-St Jeor Equation (gender-aware) |
| **TDEE** | `BMR × Activity Multiplier` (5 activity levels) |
| **Calorie Target** | Lose: `TDEE - 500` · Maintain: `TDEE` · Gain: `TDEE + 300` |
| **Macro Split** | Protein 30% · Carbs 45% · Fat 25% (adjusted per goal & diet type) |
| **Water Intake** | `weight × 0.033 L/day` |
| **Ideal Weight** | Devine Formula (gender-aware) |

Supports **diet-type-aware macro splits**: Standard, Keto, and Paleo.

User profile stores:
- Age, gender, height, weight
- Activity level, fitness goal (lose / maintain / gain)
- Food preference (vegetarian, non-vegetarian, vegan, keto, paleo)
- Medical conditions (diabetes, hypertension, etc.)

---

### 3. 🤖 AI Meal Planner (`DietPlannerController`)
The core feature of the app — generates a personalized 7-day meal plan:

- Reads the user's calorie target, macros, food preferences, and allergies
- Intelligently selects foods from the database to match nutritional targets
- Distributes meals across: **Breakfast, Morning Snack, Lunch, Evening Snack, Dinner**
- Supports **meal item swapping** — replace any food with a nutritionally similar alternative
- Supports **meal consumption tracking** — mark individual meal items as eaten
- Generates a **grocery list** from the active meal plan
- Grocery items can be toggled as bought/not-bought

---

### 4. 🍎 Food Database (`FoodController`)
- Pre-seeded with **100+ foods** covering Indian and international cuisines
- Each food stores: calories, protein, carbs, fat, fiber, category, food preference tags
- **Public routes**: Browse and view individual foods (no login required)
- **Authenticated routes**: Add custom foods to the database
- **Admin-only routes**: Edit and delete foods

---

### 5. 📖 Cookbook & Recipes (`RecipeController`)
- Full CRUD API for recipes using `apiResource`
- Each recipe has: name, description, instructions, image URL, premium flag
- Recipes contain **ingredients** with quantity and unit
- Premium recipes are only accessible to premium subscribers
- Seeded with sample recipes (Protein Oatmeal, Quinoa Chickpea Salad, etc.)

---

### 6. 📈 Progress Tracking (`ProgressController`)
Users can log daily health data:
- **Weight** tracking over time
- **Calorie intake** vs. target
- **Macro breakdown** — protein, carbs, fat consumed
- **Water intake** (litres)
- **Sleep hours**
- **Exercise minutes**

Analytics endpoint returns trend data for charts and dashboard widgets.

---

### 7. 🏆 Gamification — HealthCoins System (`TokenService` + `AchievementService`)

A full coin economy to drive user engagement:

#### Earning Coins
| Action | Coins | Frequency |
|---|---|---|
| Daily Login | +5 | Once/day |
| Progress Logged | +10 | Once/day |
| Workout Logged | +15 | Once/day |
| Calorie Target Hit | +10 | Once/day |
| Meals Consumed | +10 | Once/day |
| 7-Day Streak | +50 | Once ever |
| 30-Day Streak | +200 | Once ever |

#### Redeeming Coins
- **Free premium month** — redeem enough coins for full access
- **Partial discount** — use coins to reduce the Razorpay payment amount

#### Idempotency
- Daily rewards use **IST midnight resets** to prevent duplicate awards
- Milestone bonuses (streaks) can only be earned **once ever**, enforced via transaction audit log

#### Badges (`AchievementService`)
| Badge | Trigger |
|---|---|
| `starter` | First progress log |
| `streak_7` | 7-day consecutive logging streak |
| `streak_30` | 30-day consecutive logging streak |
| `culinary_explorer` | Generated 5 meal plans |

---

### 8. 💬 AI Chatbot (`ChatbotController` + `GeminiService`)
- Powered by **Groq API** using the `llama-3.3-70b-versatile` model
- Personalized system prompt includes user's health profile context
- Handles questions about: calories, macros, weight loss, hydration, breakfast, diabetes, BMI, sleep, supplements
- **Smart fallback responses** — keyword-aware offline responses when API is unavailable or rate-limited
- Rate limit handling returns intelligent pre-written answers (no blank errors)

---

### 9. 📄 PDF Report Generation (`ReportController`)
- Uses **barryvdh/laravel-dompdf** to generate downloadable health reports
- Report includes: user profile summary, calorie targets, macro breakdown, progress trends
- Available as `/api/report/pdf` (download) and `/api/report/summary` (JSON)

---

### 10. 💳 Subscription & Payments (`SubscriptionController`)
Integrated with **Razorpay** payment gateway:

| Step | Endpoint | What happens |
|---|---|---|
| 1 | `POST /payment/create-order` | Creates a Razorpay order, returns `order_id` |
| 2 | Frontend opens Razorpay checkout | User pays via UPI/card/netbanking |
| 3 | `POST /payment/verify` | Verifies HMAC-SHA256 signature, upgrades user to Premium |
| — | `POST /unsubscribe` | Downgrades user back to Basic plan |

- Premium plan gives access to premium recipes, advanced analytics, and PDF exports
- Subscription stored on user: `plan_type`, `subscription_id`, `subscribed_at`, `subscription_expires_at`
- HealthCoins can be used to **reduce the final payment amount** before creating the order

---

### 11. 🛡 Admin Panel (`AdminController`)
Protected by `can:admin` middleware (Spatie Permissions):

- `GET /admin/stats` — platform-wide statistics
- `GET /admin/users` — list all users with profiles
- `PUT /admin/users/{user}` — update any user's data
- `POST /admin/refresh-cache` — clear and rebuild application cache
- Admin can also **edit and delete foods** from the database

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/API/
│   │       ├── AuthController.php          # Register, login, logout, profile photo
│   │       ├── HealthProfileController.php # View & update health profile
│   │       ├── DietPlannerController.php   # Meal plan generation & management
│   │       ├── FoodController.php          # Food database CRUD
│   │       ├── RecipeController.php        # Cookbook CRUD
│   │       ├── ProgressController.php      # Daily health log & analytics
│   │       ├── TokenController.php         # HealthCoin wallet & daily login
│   │       ├── ChatbotController.php       # AI chat endpoint
│   │       ├── ReportController.php        # PDF & summary reports
│   │       ├── SubscriptionController.php  # Razorpay payment flow
│   │       └── AdminController.php         # Admin-only management
│   ├── Models/
│   │   ├── User.php                        # Core user model + plan_type
│   │   ├── UserProfile.php                 # Health metrics & preferences
│   │   ├── Food.php                        # Food item with macros
│   │   ├── MealPlan.php                    # Generated weekly plan
│   │   ├── MealItem.php                    # Individual food in a meal slot
│   │   ├── ProgressLog.php                 # Daily health entry
│   │   ├── Recipe.php                      # Recipe with premium flag
│   │   ├── RecipeIngredient.php            # Ingredients per recipe
│   │   ├── UserBadge.php                   # Earned achievement badges
│   │   ├── UserToken.php                   # HealthCoin wallet balance
│   │   ├── TokenTransaction.php            # Coin earn/spend audit log
│   │   └── DietNotification.php            # In-app notifications
│   └── Services/
│       ├── HealthCalculatorService.php     # BMI, BMR, TDEE, macros, water
│       ├── GeminiService.php               # Groq AI API integration
│       ├── TokenService.php                # HealthCoin award/spend logic
│       └── AchievementService.php          # Badge & streak tracking
├── database/
│   ├── migrations/                         # 23 migration files
│   └── seeders/
│       ├── FoodSeeder.php                  # Seeds 100+ foods
│       └── RecipeSeeder.php                # Seeds sample recipes
├── routes/
│   └── api.php                             # All API route definitions
├── .env                                    # Local environment config (gitignored)
├── .env.example                            # Template for environment setup
├── artisan                                 # Laravel CLI tool
├── composer.json                           # PHP dependencies
├── phpunit.xml                             # Test configuration
└── vite.config.js                          # Frontend asset bundling
```

---

## 🗄 Database Schema

| Table | Purpose |
|---|---|
| `users` | Core auth + `plan_type`, subscription fields, profile photo |
| `user_profiles` | Height, weight, age, goal, activity level, food preference |
| `foods` | Food database with full macro breakdown |
| `meal_plans` | A generated plan linked to a user |
| `meal_items` | Individual food entries in a meal slot (breakfast, lunch, etc.) |
| `progress_logs` | Daily weight, calories, macros, water, sleep, exercise |
| `recipes` | Cookbook recipes with premium gating |
| `recipe_ingredients` | Ingredient list per recipe |
| `user_badges` | Earned achievement badges per user |
| `user_tokens` | HealthCoin wallet (current balance) |
| `token_transactions` | Full audit trail of every coin earned or spent |
| `diet_notifications` | In-app notification messages |
| `personal_access_tokens` | Sanctum API tokens |
| `jobs` / `cache` / `sessions` | Laravel queue, caching, session storage |

---

## 🌐 API Endpoints

### Public Routes (No Auth Required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Create a new account |
| POST | `/api/login` | Login and receive Bearer token |
| GET | `/api/foods` | Browse all foods |
| GET | `/api/foods/{id}` | View a single food |

### Authenticated Routes (`Authorization: Bearer {token}`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/logout` | Logout (revoke token) |
| GET | `/api/me` | Get current user data |
| POST | `/api/profile/photo` | Upload profile photo |
| GET | `/api/profile` | Get health profile |
| PUT | `/api/profile/update` | Update health profile |
| POST | `/api/generate-plan` | Generate AI meal plan |
| GET | `/api/meal-plan` | Get active meal plan |
| GET | `/api/grocery-list` | Get grocery list |
| PUT | `/api/grocery-toggle` | Toggle grocery item bought |
| PUT | `/api/meal-item/{id}/swap` | Swap a food in the plan |
| PUT | `/api/meal-item/{id}/consume` | Mark food as consumed |
| POST | `/api/log-progress` | Log daily health data |
| GET | `/api/analytics` | Get progress analytics |
| GET | `/api/tokens` | HealthCoin wallet balance |
| POST | `/api/tokens/redeem` | Redeem coins for discount |
| POST | `/api/tokens/daily-login` | Claim daily login reward |
| POST | `/api/chat` | AI chatbot message |
| POST | `/api/foods` | Add a custom food |
| GET | `/api/report/pdf` | Download PDF health report |
| GET | `/api/report/summary` | Get report summary (JSON) |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment & upgrade |
| POST | `/api/unsubscribe` | Cancel Premium subscription |
| GET/POST/PUT/DELETE | `/api/recipes` | Cookbook CRUD (apiResource) |

### Admin-Only Routes (`can:admin` middleware)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{user}` | Update any user |
| POST | `/api/admin/refresh-cache` | Clear application cache |
| PUT | `/api/foods/{food}` | Edit a food item |
| DELETE | `/api/foods/{food}` | Delete a food item |

---

## ⚙️ Services Layer

| Service | Responsibility |
|---|---|
| `HealthCalculatorService` | Pure calculation logic — BMI, BMR, TDEE, macros, water, ideal weight |
| `GeminiService` | Groq API integration with smart keyword-aware offline fallbacks |
| `TokenService` | Idempotent coin award/spend with IST-aware daily reset logic |
| `AchievementService` | Streak calculation + badge awarding + milestone coin bonuses |

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- MySQL 8.x
- Node.js & npm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd backend

# 2. Install PHP dependencies
composer install

# 3. Install Node dependencies
npm install

# 4. Set up environment
cp .env.example .env
php artisan key:generate

# 5. Configure your database in .env
# DB_DATABASE=diet_planner
# DB_USERNAME=root
# DB_PASSWORD=your_password

# 6. Run migrations and seed data
php artisan migrate
php artisan db:seed

# 7. Start the development server
php artisan serve

# 8. (Optional) Start all services together
composer run dev
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `APP_KEY` | Laravel encryption key (auto-generated) | ✅ |
| `DB_DATABASE` | MySQL database name | ✅ |
| `DB_USERNAME` | MySQL username | ✅ |
| `DB_PASSWORD` | MySQL password | ✅ |
| `GROQ_API_KEY` | Groq AI API key (for chatbot & meal planning) | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay public key | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | ✅ |
| `APP_URL` | Backend base URL | ✅ |

---

## 🧪 Running Tests

```bash
# Run all tests
php artisan test

# Run only unit tests
php artisan test --testsuite=Unit

# Run only feature tests
php artisan test --testsuite=Feature
```

> Tests use an **in-memory SQLite database** (configured in `phpunit.xml`) — your real MySQL data is never touched during testing.

---

## 📦 Key Packages

| Package | Purpose |
|---|---|
| `laravel/sanctum` | Stateless API token authentication |
| `spatie/laravel-permission` | Role & permission management (admin gating) |
| `barryvdh/laravel-dompdf` | Generate downloadable PDF health reports |
| `laravel/tinker` | Interactive REPL for debugging |
| `phpunit/phpunit` | Automated testing framework |

---

