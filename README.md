<div align="center">

# 🥗 NutriPlan AI
### *Next-Gen Health-Metric Driven AI Diet & Nutrition Planner*

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Laravel](https://img.shields.io/badge/Laravel_12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/)
[![PHP](https://img.shields.io/badge/PHP_8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq AI](https://img.shields.io/badge/Llama_3.3_70B-Groq_AI-F55036?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)
[![OpenFoodFacts](https://img.shields.io/badge/OpenFoodFacts-Barcode_Scanner-22C55E?style=for-the-badge)](https://world.openfoodfacts.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2340?style=for-the-badge&logo=razorpay&logoColor=528FF0)](https://razorpay.com/)

<p align="center">
  <b>An enterprise-grade, clinical-standard nutrition intelligence platform tailoring daily meal plans to individual metabolic profiles, chronic health conditions, and real-time biometric progress.</b>
  <br />
  Featuring automated AI meal generation (Groq Llama-3.3-70B), Mifflin-St Jeor & Devine metabolic algorithms, live camera barcode scanning with OpenFoodFacts integration, gamified HealthCoins reward economy, automated grocery lists, and interactive biometric analytics.
</p>

</div>

---

## 🌟 Key Features

### 🧬 Metabolic & Clinical Health Profile
- **Clinical Biomarker Calculations:** Computes BMI, BMR via **Mifflin-St Jeor formula**, Total Daily Energy Expenditure (TDEE), and ideal body weight via the **Devine formula**.
- **Condition-Aware Nutrition Filters:** Dynamic rules adjusting macronutrient distributions and food filtering for **Diabetes** (Glycemic Index $\le$ 55), **Hypertension** (low-sodium enforcement), **Thyroid**, **Heart Disease**, and **PCOD**.
- **Dietary Preferences & Allergens:** Full support for Vegetarian, Vegan, Jain, Keto, and Paleo diet types with strict allergen avoidance (Gluten, Dairy, Nuts, Eggs, Soy, Shellfish).

### 🤖 Intelligent AI Meal Planner
- **Automated Daily & 7-Day Meal Plans:** Distributes target calories and macros across Breakfast (25%), Lunch (35%), Snacks (10%), and Dinner (30%).
- **Smart Ingredient Swap Engine:** One-click swap algorithm that finds equivalent caloric alternatives preserving your dietary constraints.
- **Consumption Tracking:** Real-time check-off system that recalculates daily consumed calories, logs streaks, and awards HealthCoins.
- **Automated Grocery List Generator:** Aggregates ingredients across upcoming meal plans with category sorting, quantity summation, and interactive purchase checklists.

### 📷 Smart Barcode & Custom Food Database
- **Live Camera Barcode Scanner:** Real-time camera viewfinder scanning EAN-13 and UPC barcodes powered by HTML5-QRCode.
- **Backend OpenFoodFacts Proxy:** High-speed server-side lookup with official User-Agent authentication, caching, and nutrition fallback mapping.
- **Multi-Tenant Custom Foods:** Allows users to save private custom foods that are isolated to their personal database and automatically prioritized in future meal plan generation.

### 🪙 Gamification & Daily Health Challenges
- **HealthCoins Reward Economy:** Earn virtual currency for daily logins, completing meals, hitting water goals, and logging progress.
- **Interactive Daily Challenges:** Direct-action challenge cards guiding users to specific sections to complete daily wellness tasks.
- **Milestone Badges & Streaks:** Visual celebration overlays and badges for 7-day, 14-day, and 30-day consistent logging streaks.
- **Coin Redemption:** Redeem earned HealthCoins for subscription discounts or premium feature unlocks.

### 💬 24/7 AI Health & Nutrition Assistant
- **Groq Llama 3.3 70B Integration:** Context-aware nutritional assistant offering instant dietary advice, ingredient substitutes, and custom recipes with conversational memory and offline fallback intelligence.

### 📈 Biometric Analytics & PDF Clinical Reports
- **Interactive Trend Charts:** Recharts-powered graphs monitoring weight trajectories, macro splits, daily water volume, sleep duration, and active calories burned.
- **Exportable PDF Health Summaries:** Generates downloadable clinical health progress reports via DomPDF.

### 🛡️ Admin Console & Role-Based Access
- **Platform Analytics Dashboard:** Real-time platform metrics on total registered users, premium conversion rates, and food items cataloged.
- **Food & Recipe Catalog Management:** Full administrative CRUD controls for global food items, macro adjustments, and recipe collections.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Frontend)"]
        SPA["React 18 + Vite SPA"]
        Contexts["Auth, Theme & Audio Contexts"]
        Scanner["HTML5 Barcode Scanner"]
        Charts["Recharts Visualizations"]
    end

    subgraph APIGateway ["Backend Gateway (Laravel 12)"]
        Sanctum["Laravel Sanctum Auth"]
        Throttle["Rate Limiters & CORS Guard"]
        Controllers["API Controllers"]
    end

    subgraph ServicesLayer ["Core Intelligence & Services"]
        CalcEngine["HealthCalculatorService (BMR/TDEE/Macros)"]
        MealEngine["DietPlannerController (Auto-Planner & Swap)"]
        BarcodeProxy["FoodController Barcode Proxy"]
        TokenService["Token & Gamification Service"]
        GroqService["Groq AI Client (Llama 3.3 70B)"]
        PDFService["DomPDF Report Generator"]
    end

    subgraph DataLayer ["Data & External Providers"]
        MySQL[("MySQL 8.0 Database")]
        CacheStore[("File / Redis Cache")]
        OpenFoodFacts["OpenFoodFacts Global DB"]
        Razorpay["Razorpay Payment Gateway"]
        GroqCloud["Groq Cloud AI API"]
    end

    SPA -->|HTTPS / REST API| Sanctum
    Scanner -->|Barcode Scans| BarcodeProxy
    Sanctum --> Throttle
    Throttle --> Controllers

    Controllers --> CalcEngine
    Controllers --> MealEngine
    Controllers --> BarcodeProxy
    Controllers --> TokenService
    Controllers --> GroqService
    Controllers --> PDFService

    MealEngine <--> MySQL
    TokenService <--> MySQL
    BarcodeProxy -->|Authenticated HTTP| OpenFoodFacts
    BarcodeProxy <--> CacheStore
    GroqService <--> GroqCloud
    Controllers <--> Razorpay
```

---

## 💻 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | React 18, Vite 6, React Router v6, React Query (TanStack Query v5) |
| **Styling & UI** | Tailwind CSS, Lucide React, Headless UI, Framer Motion, React Hot Toast |
| **Charts & Analytics** | Recharts Interactive SVG Visualizations |
| **Barcode Scanner** | HTML5-QRCode, OpenFoodFacts V0/V2 API |
| **Backend API** | Laravel 12, PHP 8.2+, Laravel Sanctum, Spatie Permission |
| **Calculation Engine** | Mifflin-St Jeor, Harris-Benedict, Devine Formula, Macro Distribution Algorithms |
| **Database & Cache** | MySQL 8.0, Laravel Database Query Builder, In-Memory Cache |
| **AI Engine** | Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) |
| **PDF Generation** | `barryvdh/laravel-dompdf` (DomPDF) |
| **Payment Gateway** | Razorpay SDK (Order Creation, Webhook & Signature Verification) |
| **Real-time Server** | Socket.io Node.js server (`socket-server`) |

---

## 📁 Repository Structure

```
Diet and Nutrition Planner Based on Health Metrics/
├── backend/                      # Laravel 12 REST API Server
│   ├── app/
│   │   ├── Http/Controllers/API/ # Auth, DietPlanner, Food, Recipe, Progress, Token, Chatbot, Report, Admin
│   │   ├── Models/               # User, UserProfile, Food, MealPlan, MealItem, ProgressLog, Recipe, UserToken
│   │   └── Services/             # HealthCalculatorService, Gemini/Groq Service, TokenService
│   ├── config/                   # CORS, Sanctum, Database, App configurations
│   ├── database/
│   │   ├── migrations/           # 26 Database schema migrations
│   │   └── seeders/              # Comprehensive FoodSeeder (100+ items) & RecipeSeeder
│   ├── routes/
│   │   └── api.php               # All RESTful API route definitions
│   └── composer.json             # PHP dependencies
│
├── frontend/                     # React 18 + Vite Client Application
│   ├── src/
│   │   ├── components/           # AppLayout, Navbar, Sidebar, BarcodeScanner, Onboarding, Chatbot
│   │   ├── context/              # AuthContext (Multi-tenant token isolation), ThemeContext
│   │   ├── pages/                # Dashboard, Planner, Progress, Reports, GroceryList, Cookbook, Profile, Admin
│   │   ├── services/             # Axios API interceptors & OpenFoodFacts service
│   │   ├── App.jsx               # Application route tree & route guards
│   │   └── main.jsx              # React root mount
│   ├── package.json              # Frontend npm dependencies
│   └── vite.config.js            # Vite build setup with code-splitting
│
├── socket-server/                # Standalone Socket.io real-time server
│   ├── server.js                 # Event broadcasting server
│   └── package.json              # Node.js dependencies
│
├── PROJECT_OVERVIEW.md           # Master project specification
└── README.md                     # Project documentation (This file)
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **PHP**: `8.2` or higher (with `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd` extensions enabled)
- **Composer**: `v2.x`
- **Node.js**: `v18.x` or `v20.x`
- **MySQL**: `v8.0`
- **npm** or **yarn**

---

### 1. Clone the Repository
```bash
git clone https://github.com/Ankit8810770036/D-N.git
cd "Diet and Nutrition Planner Based on Health Metrics"
```

---

### 2. Backend Setup (Laravel 12 API)

```bash
cd backend

# Install PHP dependencies
composer install

# Create environment configuration
cp .env.example .env

# Generate application key
php artisan key:generate
```

Configure your `.env` database and API credentials:
```env
APP_NAME="NutriPlan AI"
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=diet_planner
DB_USERNAME=root
DB_PASSWORD=

GROQ_API_KEY=your_groq_api_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Run database migrations and seed default foods and recipes:
```bash
php artisan migrate --seed

# Start the Laravel backend API server
php artisan serve
```
> 📍 Backend runs at: **`http://127.0.0.1:8000`**

---

### 3. Frontend Setup (React 18 + Vite)

In a new terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
> 📍 Frontend runs at: **`http://localhost:5173`**

---

### 4. Real-Time Socket Server *(Optional)*

In a third terminal:
```bash
cd socket-server
npm install
npm start
```
> 📍 Socket Server runs at: **`http://localhost:6001`**

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|:---:|
| `POST` | `/api/register` | Register new user account | Public |
| `POST` | `/api/login` | Authenticate & issue Sanctum Bearer token | Public |
| `POST` | `/api/forgot-password` | Request password reset token | Public |
| `POST` | `/api/reset-password` | Update password via reset token | Public |
| `GET` | `/api/me` | Fetch authenticated user profile & subscription tier | Authenticated |
| `GET` | `/api/profile` | Retrieve biometric metrics (BMR, TDEE, Macros) | Authenticated |
| `PUT` | `/api/profile/update` | Update health stats & re-calculate target metrics | Authenticated |
| `POST` | `/api/generate-plan` | AI generate customized daily meal plan | Authenticated |
| `GET` | `/api/meal-plan` | Retrieve daily meal plan for selected date | Authenticated |
| `PUT` | `/api/meal-item/{id}/swap` | Calorie-equivalent ingredient swap | Authenticated |
| `PUT` | `/api/meal-item/{id}/consume` | Toggle item consumption & update calories log | Authenticated |
| `GET` | `/api/grocery-list` | Get aggregated grocery shopping list | Authenticated |
| `GET` | `/api/barcode/lookup/{code}` | OpenFoodFacts authenticated barcode search | Public |
| `GET` | `/api/foods` | Browse global + user's private custom foods | Authenticated |
| `POST` | `/api/foods` | Add new private custom food to personal DB | Premium / Admin |
| `POST` | `/api/log-progress` | Log daily weight, water, sleep & activity | Authenticated |
| `GET` | `/api/tokens` | Get HealthCoins balance, daily streaks & challenges | Authenticated |
| `POST` | `/api/tokens/daily-login` | Claim daily login reward coins | Authenticated |
| `POST` | `/api/chat` | AI Nutritional chatbot consultation (Groq Llama 3.3) | Authenticated |
| `GET` | `/api/report/pdf` | Download clinical PDF summary report | Authenticated |
| `GET` | `/api/admin/stats` | Retrieve platform-wide metrics & user stats | Admin |

---

## 🛡️ Security & Multi-Tenant Isolation

- **Sanctum Multi-Tenant Scoping:** Private custom food items, daily progress logs, and generated meal plans are strictly scoped by `user_id`, preventing any cross-user data leakage.
- **Client Cache Purging:** Frontend auth context automatically clears all TanStack Query caches, user states, and local storage tokens upon user transitions or logout.
- **Input Sanitization & Validation:** Strict form request validations, numeric boundary constraints, and type casting prevent SQL injection and payload tampering.

---

## 📄 License

This project is open-source and available under the **MIT License**.

---

<div align="center">
  <sub>Built with ❤️ by <b>Ankit Kumar Singh</b>. Star ⭐ this repository if you find it helpful!</sub>
</div>
