# BongPizza POS — Restaurant Billing & Order Management System

A high-performance, professional, responsive React + Vite POS frontend connected to the BongPizza Node.js, Express, MongoDB backend.

---

## 🎨 Theme & Brand Design System

- **Primary Yellow:** `#FFC928`
- **Primary Red:** `#D62828`
- **White Surfaces:** `#FFFFFF`
- **Page Background:** `#FFFDF8`
- **Secondary Background:** `#FAFAFA`
- **Primary Text:** `#222222`
- **Secondary Text:** `#6B7280`
- **Borders:** `#E5E7EB`
- **Light Theme Only:** Strict no-gradient, no-neon, clean restaurant software aesthetic.
- **Thermal Printing:** Dedicated CSS print styles supporting 58mm, 80mm roll paper, and A4 billing.

---

## 🚀 Key Features

1. **Public Landing Page:**
   - Hero section, feature cards, and workflow visualization.
   - **Get Started** button: dynamically checks session with backend (`/api/user/me`); navigates to `/dashboard` if authenticated, or `/login` if not.
   - **Login** button: navigates to `/login`.

2. **Single-Role Authentication (`user`):**
   - Clean 10-digit mobile number + password login.
   - Show/hide password control.
   - Session restoration on page refresh via Redux Toolkit and backend tokens/cookies.
   - All authenticated users have full access to all POS modules.

3. **POS Billing Workflow (New Order):**
   - Order types: **Dine-In**, **Takeaway / Pickup**, and **Delivery**.
   - Dining table picker organized by Sections / Table Groups (Ground Floor, Terrace, Balcony).
   - Menu catalog with categories (Pizzas, Sides & Starters, Beverages, Desserts), search, and availability checks.
   - Shopping cart with live subtotal, configurable CGST/SGST taxes, discounts, and authoritative net totals.

4. **Live Orders (Core Biller Feature):**
   - Auto-refresh polling every 10 seconds.
   - Real-time status badges for Kitchen fulfillment and Payment settlement.
   - Filter tabs: Active, Unpaid, Partially Paid, Paid, Completed, Cancelled, All.
   - Quick actions: Settle, Update Kitchen Status, Generate Receipt, Cancel.

5. **Authoritative Settle Order Modal:**
   - Multi-tender support: Cash, UPI (with transaction reference), Card.
   - Supports split payments (e.g. ₹300 Cash + ₹700 UPI).
   - Validates payment limits against remaining balance.
   - Immediate receipt preview upon completion.

6. **Kitchen Order Tickets (KOT):**
   - Real-time Kitchen display for chefs.
   - Allowed status transitions: `pending` → `preparing` → `ready` → `served`.
   - Dedicated high-contrast thermal KOT print slip.

7. **Receipts & Invoicing:**
   - Thermal preview formatted for 58mm, 80mm, and A4 paper.
   - Clean black-on-white layout with GST number, breakdown, and shop footer.
   - One-click browser thermal printing.

8. **Table & Floor Management:**
   - Manage table sections (Ground Floor, Balcony, Terrace).
   - Add/remove dining tables with seat capacities.

9. **Menu Management:**
   - Add/edit pizza dishes and drinks.
   - Toggle stock availability instantaneously.
   - Create new categories.

10. **Sales Analytics & Reports:**
    - Date range presets (Today, Yesterday, Last 7 Days, Last 30 Days, Custom Range).
    - Gross subtotal, discounts, tax collections, net sales.
    - Tender-wise breakdown (Cash in hand vs UPI vs Card).
    - Top 10 Best-Selling pizzas and dishes.

---

## 💻 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React icons, React Router DOM v7, Redux Toolkit, React Redux.
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, CORS.

---

## 🛠️ How to Run Locally

### 1. Backend Server
```bash
cd server
npm install
npm run start   # Runs on http://localhost:7070
```

### 2. Frontend Client
```bash
cd client
npm install
npm run dev     # Runs on http://localhost:5173
```

### 3. Demo Biller Credentials
- **Mobile Number:** `9876543210`
- **Password:** `admin123`
*(A convenient "Auto-Fill Demo Credentials" button is also present on the login screen).*

---

## 🧪 Acceptance Testing

Execute the settlement test suite against the live backend:
```bash
cd server
node src/test_settlement.js
```
All 10 settlement acceptance tests (**Test A through Test J**) pass 100%.
