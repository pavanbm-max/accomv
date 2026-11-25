# Pre-Registration & Participant Data Collection Portal

A standalone **Pre-Registration and Participant Data Collection Portal** built with **React + Vite + TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase** (PostgreSQL, Auth, RLS). All currency calculations are in INR (₹) using Indian numeric standards (`formatINR`).

---

## 📌 Portal Purpose & Architecture

**This is a pre-registration system, NOT an online payment system.**

1. **Pre-Registration Flow:**
   - Participants submit identification, academic department, semester, event category, accommodation requirements, and meal demands.
   - Dynamic live cost calculation provides an estimated breakdown before submission.
   - No payment gateway integrations, no UPI QR codes, no online payment collection, and no automated emails.
   - Actual accommodation and meal charges are collected later by the respective hostel coordinator on campus.

2. **Dedicated Confirmation Page:**
   - Displays a unique human-readable Pre-Registration Reference ID (`PRE-2026-XXXXXX`).
   - Summary of participant details, accommodation days, and meal demands.
   - Transparent itemized estimation of accommodation and meal charges.
   - Highlighted notice informing participants that no online payment is required and to wait for coordinator contact.

3. **Coordinator Admin Operations:**
   - View, search, and filter all pre-registration submissions.
   - Track **Coordinator Follow-up Status**:
     - `Pending Contact`
     - `Contacted`
     - `Awaiting Payment`
     - `Confirmed`
     - `Cancelled`
   - Real-time aggregate metrics:
     - Total pre-registrations
     - Total accommodation participants
     - Total requested accommodation days
     - Kitchen meal demand (Breakfast, Lunch, Dinner counts)
     - Estimated charges pipeline
   - Export full participant directory to CSV/Excel.

---

## 💰 Service & Tariff Estimation Logic

| Service | Price | Calculation |
|---|---:|---|
| **Accommodation** | ₹200 / person / day | `Participants × Days × ₹200` |
| **Breakfast** | ₹50 / person / meal | `Participants × Breakfast Meals × ₹50` |
| **Lunch** | ₹60 / person / meal | `Participants × Lunch Meals × ₹60` |
| **Dinner** | ₹60 / person / meal | `Participants × Dinner Meals × ₹60` |

---

## 📁 Project Structure

```
├── schema.sql                                 # Complete Supabase database schema for pre-registration
├── supabase/
│   └── migrations/
│       └── 20261125000000_preregistration_portal.sql  # Schema migration
├── src/
│   ├── components/                            # Modular UI components
│   │   ├── CountUp.tsx                        # Animated numeric stats counter
│   │   ├── FollowupStatusBadge.tsx            # Color-coded follow-up status badges
│   │   ├── Modal.tsx                          # Accessible modal dialog
│   │   ├── Navbar.tsx                         # Header with coordinator login
│   │   ├── OrderSummary.tsx                   # Live estimated accommodation & meal breakdown
│   │   ├── PricingSettingsCard.tsx            # Tariff administration card
│   │   └── TiltCard.tsx                       # Institutional card wrapper
│   ├── context/                               # Theme, Auth, and Toast contexts
│   ├── lib/
│   │   ├── api.ts                             # Pre-registration API client & calculations
│   │   ├── formatters.ts                      # Currency & Date formatters
│   │   └── supabase.ts                        # Supabase client initialization
│   ├── pages/                                 # Public pre-registration & confirmation
│   │   ├── RegisterPage.tsx                   # Main pre-registration form & meal selections
│   │   ├── ConfirmationPage.tsx               # Dedicated reference & estimation confirmation
│   │   └── admin/                             # Coordinator administration
│   │       ├── AdminDashboardPage.tsx         # Operations metrics & meal demand cards
│   │       ├── AdminRegistrationsPage.tsx     # Directory, search, filters & follow-up tracking
│   │       ├── AdminAnnouncementsPage.tsx     # Broadcast announcements
│   │       ├── AdminUsersPage.tsx             # Coordinator staff management
│   │       └── AdminSettingsPage.tsx          # System tariff configuration
│   ├── types/                                 # TypeScript interfaces & types
│   ├── App.tsx                                # Application router
│   └── main.tsx
├── .env.example                               # Environment template
└── package.json
```

---

## ⚙️ Environment Variables

Configure your dedicated Supabase project credentials in `.env`:

```env
# Frontend Supabase Configuration (Public Anon Key ONLY)
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-public-anon-key-here

# Optional: Server-side privileged operations (never expose to browser)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## 🗄️ Database Setup (New Supabase Project)

1. Open your newly created Supabase project.
2. Navigate to the **SQL Editor**.
3. Copy and execute the contents of [`schema.sql`](file:///d:/accom%20-v2/schema.sql).
4. The script creates:
   - `registrations` (participant & accommodation records)
   - `meal_requirements` (breakfast, lunch, and dinner counts)
   - `admin_followups` (coordinator status tracking & logs)
   - `profiles` (coordinator portal users)
   - `announcements` & `settings`
   - Row Level Security (RLS) policies and performance indexes.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```
