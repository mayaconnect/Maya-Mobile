# API Routes (short)

Brief one-line description for each API route.

## Admin (prefix: `api/v1/admin`, Role: Admin)
- `GET api/v1/admin/users` � List users (paginated).
- `GET api/v1/admin/users/{id}` � Get user by ID.
- `PUT api/v1/admin/users/{id}` � Update user profile.
- `DELETE api/v1/admin/users/{id}` � Delete user.
- `POST api/v1/admin/users/{id}/roles` � Assign/update user roles.
- `GET api/v1/admin/audit-logs` � Get paginated audit logs.
- `GET api/v1/admin/debug/claims` � Dump token claims (auth).
- `GET api/v1/admin/debug/inrole?role=...` � Check role membership (auth).

## Auth (prefix: `api/v1/auth`)
- `POST api/v1/auth/register` � Register a new user.
- `POST api/v1/auth/login` � Login with email/password, returns tokens.
- `POST api/v1/auth/refresh` � Refresh access token with a refresh token.
- `POST api/v1/auth/logout` � Revoke a refresh token (auth).
- `POST api/v1/auth/request-password-reset` � Request password reset (idempotent).
- `POST api/v1/auth/reset-password` � Reset password using reset token.
- `POST api/v1/auth/request-password-reset-code` � Request reset code (email/SMS).
- `POST api/v1/auth/verify-password-reset-code` � Verify reset code and issue reset token.
- `GET api/v1/auth/me` � Get current authenticated user info.
- `PUT api/v1/auth/me` � Update current user's profile.
- `POST api/v1/auth/upload-avatar` � Upload avatar image (multipart, max 5MB).

## Clients (prefix: `api/clients`)
- `GET api/clients` � List clients (Admin).
- `GET api/clients/{id}` � Get client by ID (Admin).
- `POST api/clients` � Create client (Admin).
- `PUT api/clients/{id}` � Update client (Admin).
- `DELETE api/clients/{id}` � Delete client (Admin).
- `GET api/clients/me/has-subscription` � Check if current user has an active subscription.
- `GET api/clients/me/subscription` � Get current user's active subscription.

## Helpers (prefix: `api/helpers`)
- `POST api/helpers/seed-dummy` � Execute stored proc to insert development dummy data (dev only).
- `POST api/helpers/rollback-dummy` � Execute stored proc to remove dummy data (dev only).
- `POST api/helpers/clear-cache` � Request clearing tracked memory cache keys (Admin).

## Partners (prefix: `api/partners`)
- `GET api/partners` � List partners with filters/pagination (Admin).
- `GET api/partners/{id}` � Get partner by ID (Admin).
- `POST api/partners` � Create partner (Admin).
- `PUT api/partners/{id}` � Update partner (Admin).
- `DELETE api/partners/{id}` � Delete partner (Admin).

## Profiles (prefix: `api/v1/profiles`)
- `POST api/v1/profiles` � Create profile (placeholder, returns 501).

## QR (prefix: `api/qr`)
- `GET api/qr/current` � Issue current QR token and base64 image (Client, Admin).
- `POST api/qr/issue-token-frontend` � Issue or return frontend token without image (Client, Admin).
- `POST api/qr/validate` � Validate scanned QR and create transaction (Partner, Admin).
    
## Stores (prefix: `api/stores`)
- `POST api/stores/search` � Search stores by location/filters with pagination (auth).
- `GET api/stores/{id}` � Get store details (includes IsUsual flag for requesting user) (auth).

## Subscriptions (prefix: `api/subscriptions`)
- `GET api/subscriptions` � List subscriptions (Admin).
- `POST api/subscriptions` � Create subscription (Admin).
- `PUT api/subscriptions/{id}` � Update subscription (Admin).
- `DELETE api/subscriptions/{id}` � Delete subscription (Admin).

## Transactions (prefix: `api/transactions`)
- `GET api/transactions/partner/{partnerId}` � Get partner transactions; optional `storeId`, pagination (Partner, Admin).
- `GET api/transactions/user/{userId}` � Get user transactions (pagination) (auth).
- `GET api/transactions/store/{storeId}/scancount` � Count scans for a store since optional date (Partner, Admin).
- `GET api/transactions/user/{userId}/savings/{period}` � Get savings for user by period (`day|week|month|year`) (auth).
- `GET api/transactions/user/{userId}/savings/by-category` � Get user savings grouped by partner category (auth).
