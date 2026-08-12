# FastBite SaaS Security Policy & Architecture

## 1. Authentication Security
- **JWT Verification**: Token signature and expiration (`7d`) are strictly enforced server-side.
- **Fail-Fast Startup Validation**: `JWT_SECRET` must be defined in environment variables. Default fallback strings are rejected in production.
- **Password Security**: Passwords are salted and hashed using `bcryptjs` (salt factor 10). Passwords are never logged, returned in API payloads, or exposed to the frontend.

## 2. Authorization & RBAC
- Access control is enforced at the controller level using `requireRole` and `requirePermission(PERMISSIONS.*)`.
- Roles supported: `super_admin`, `restaurant_owner`, `manager`, `kitchen_staff`, `customer`.
- Super Admin routes (`/api/super-admin/*`) are protected strictly by `ROLES.SUPER_ADMIN` token validation.

## 3. Multi-Tenant Isolation
- Every database query for restaurant data is scoped to `restaurant_id` derived directly from the authenticated user token (`req.restaurantId`).
- Cross-tenant resource access (IDOR) results in `403 Forbidden` or `404 Not Found`.

## 4. Input Validation & Mass Assignment Protection
- All input strings, numbers, status enums, and UPI UTR formats are validated on the backend.
- Arbitrary request body fields (`role`, `restaurant_id`, `is_active`) are explicitly stripped and normalized.

## 5. Rate Limiting & Protection
- **Global API Rate Limiter**: 300 requests / 15 mins.
- **Auth Endpoint Limiter**: 30 requests / 15 mins for `/api/user/login` and `/api/user/register`.
- **Order Placement Limiter**: 30 submissions / 15 mins for `/api/order/place`.

## 6. Audit Logging & Failures
- Critical actions (`PAYMENT_APPROVED`, `PAYMENT_REJECTED`, `RESTAURANT_STATUS_CHANGED`, `ORDER_CANCELLATION`, `MANUAL_ADJUSTMENT`) are recorded in the `audit_logs` database table.
- Production error responses mask internal SQL details and stack traces while logging correlation IDs (`X-Request-ID`).
