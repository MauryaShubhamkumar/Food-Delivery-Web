# FastBite Super Admin & Platform Management — Phase 5 Technical Documentation

## 1. Overview
Phase 5 establishes a dedicated **Platform Administration System** (`/super-admin/*`) completely separate from individual single-restaurant administration (`/admin/*`). It allows FastBite SaaS owners (`SUPER_ADMIN` role) to manage platform-wide restaurants, users, orders, reviews, Gross Order Volume (GMV) analytics, and onboarding tracking.

---

## 2. Platform Architecture & Separation of Concerns

```mermaid
flowchart TD
    A[Authenticated User Identity] --> B{Role Check}
    B -- SUPER_ADMIN --> C[/super-admin Platform Dashboard]
    C --> C1[Platform KPIs & GMV Analytics]
    C --> C2[All Restaurants Management]
    C --> C3[All Platform Users]
    C --> C4[Platform Orders & Reviews]
    
    B -- RESTAURANT_OWNER / MANAGER / KITCHEN --> D[/admin Restaurant Workspace]
    D --> D1[Own Restaurant Only - Tenant Isolated]
    
    B -- CUSTOMER --> E[Customer Storefront & Checkout]
```

---

## 3. Super Admin API Specifications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/super-admin/stats` | `super_admin` | Platform KPIs (Stores active/setup/inactive, Users count by role, Total Orders, Total GMV). |
| `GET` | `/api/super-admin/restaurants` | `super_admin` | Server-side paginated, searchable (`name`, `slug`, `email`, `phone`), and status-filterable restaurant listing. |
| `GET` | `/api/super-admin/restaurants/:id` | `super_admin` | Detailed view of single restaurant, owner profile, product count, order count, and GMV revenue. |
| `PUT` | `/api/super-admin/restaurants/:id/status` | `super_admin` | Status toggle (`ACTIVE` / `INACTIVE`). Preserves all historical data. |
| `GET` | `/api/super-admin/users` | `super_admin` | Server-side paginated & searchable platform users listing with role filters. |
| `GET` | `/api/super-admin/orders` | `super_admin` | All-restaurant platform order listing with status filtering and item breakdown. |
| `GET` | `/api/super-admin/reviews` | `super_admin` | Platform-wide review moderation listing with rating filters and visibility toggles. |
| `PUT` | `/api/super-admin/reviews/:id/visibility` | `super_admin` | Toggle public visibility flag for a customer review. |
| `GET` | `/api/super-admin/analytics` | `super_admin` | Timeframe filters (`today`, `7d`, `30d`, `month`, `year`) and restaurant GMV revenue leaderboard. |
| `GET` | `/api/super-admin/onboarding-stuck` | `super_admin` | Lists restaurants currently stuck in setup mode (`onboarding_completed = FALSE`). |

---

## 4. Gross Order Volume (GMV) vs SaaS Revenue
- **Gross Order Value (GMV)**: Calculated as `SUM(orders.amount)` across completed/active customer orders.
- **Explicit Terminology**: GMV is explicitly labeled as **Gross Order Volume** to prevent confusion with SaaS subscription revenue (which will be added in a future phase).

---

## 5. Security, Role & IDOR Protection
- **Strict Role Verification**: All `/api/super-admin/*` routes execute `authMiddleware` + `requireRole('super_admin')`.
- **403 Forbidden Response**: Customers, Restaurant Owners, Managers, and Kitchen Staff attempting to query `/api/super-admin/*` APIs receive HTTP 403.
- **Deactivation Safety**: Restaurant deactivation updates `restaurants.status = 'inactive'`, making public storefronts unavailable while preserving historical orders, products, and metrics.

---

## 6. Default Super Admin Bootstrapping
If no `super_admin` user exists in the database during server startup, `db.js` automatically seeds:
- **Email**: `superadmin@fastbite.com`
- **Password**: `SuperAdmin@123` (Hashed with bcrypt)
- **Role**: `super_admin`
