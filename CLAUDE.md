# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maya is a React Native mobile application built with Expo Router for managing commercial partners, stores, transactions, and subscriptions. The app supports both regular users (who scan QR codes at partner stores) and partners/operators (who validate QR codes and process transactions).

## Development Commands

### Basic Commands
```bash
npm start              # Start Expo development server
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in web browser

npm run lint           # Lint the codebase
npm run lint:fix       # Fix linting errors automatically
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
npm run type-check     # Run TypeScript type checking
```

### Testing
```bash
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:ci        # Run tests in CI mode (for CI/CD pipelines)
```

### Server Scripts (Windows PowerShell)
```bash
npm run server:start   # Start backend server (PowerShell script)
npm run server:check   # Check server status
npm run server:quick   # Quick server start (batch script)
```

## Architecture

### File-Based Routing (Expo Router)

The app uses Expo Router for navigation with file-based routing:

- `app/_layout.tsx` - Root layout with auth context, theme provider, and offline sync initialization
- `app/index.tsx` - Initial landing/onboarding screen
- `app/(tabs)/` - Bottom tab navigation for authenticated users
  - `home.tsx` - Home screen for regular users (QR scanning)
  - `partner-home.tsx` - Home screen for partners (QR validation)
  - `partners.tsx` - Browse partner stores
  - `stores-map.tsx` - Map view of stores
  - `subscription.tsx` - Subscription management
  - `history.tsx` - Transaction history
  - `profile.tsx` - User profile
- `app/connexion/` - Authentication flows (login, signup, forgot password)
- `app/onboarding/` - Onboarding screens (onboarding-2, onboarding-3, onboarding-4)

The tab bar is conditionally hidden for partner users (determined by email patterns or role).

### Feature-Based Organization

Features are organized by business domain in the `features/` directory:

- `features/auth/` - Authentication logic
- `features/home/` - Home screens and QR code functionality
- `features/partner-home/` - Partner-specific home screens
- `features/partners/` - Partner browsing and management
- `features/stores-map/` - Store map visualization
- `features/subscription/` - Subscription management
- `features/history/` - Transaction history
- `features/profile/` - User profile management
- `features/onboarding/` - Onboarding flows

Each feature typically contains:
- `components/` - Feature-specific components
- `screens/` - Screen components
- `services/` - API services (e.g., `qrApi.ts`, `transactionsApi.ts`)
- `hooks/` - Feature-specific hooks
- `types.ts` - TypeScript type definitions

### Core Services Architecture

#### API Client (`services/shared/api-client.ts`)

The `ApiClient` class provides:
- Automatic authentication token injection via `AuthService.getAccessToken()`
- Request/response logging in development mode
- Timeout handling with AbortController
- Automatic retry with exponential backoff
- Error transformation to typed `ApiError` objects
- HTTP methods: `get()`, `post()`, `put()`, `patch()`, `delete()`

All API calls should use `ApiClient` instead of raw `fetch()`.

#### Authentication (`services/auth.service.ts`)

Modular authentication system split across multiple files:
- `auth.login.ts` - Login logic
- `auth.oauth.ts` - OAuth (Google) authentication
- `auth.password-reset.ts` - Password reset flows
- `auth.profile.ts` - User profile management
- `auth.tokens.ts` - Token storage and refresh
- `auth.types.ts` - Auth-related TypeScript types
- `auth.config.ts` - Auth configuration

The `AuthService` handles token management, persistence with AsyncStorage, and automatic token refresh. The `useAuth()` hook provides authentication state and methods throughout the app.

#### Offline Sync (`utils/offline-sync.ts`)

Automatic offline request queueing and synchronization:
- Stores failed requests in AsyncStorage
- Monitors network state changes (using @react-native-community/netinfo if available)
- Automatically retries queued requests when connection is restored
- Initialized in `app/_layout.tsx` on app startup
- Periodic sync every 30 seconds when online

### State Management

- **Authentication**: Context-based via `hooks/use-auth.tsx` and `contexts/app-context.tsx`
- **API calls**: Custom hook `hooks/use-api.ts` for data fetching with caching
- **Network status**: `hooks/use-network.ts` for network monitoring
- **Debouncing**: `hooks/use-debounced.ts` for optimized user input

### Configuration

- `config/api.config.ts` - Centralized API configuration including:
  - Base URL (from `EXPO_PUBLIC_API_BASE_URL` env variable)
  - Timeout values (default: 30s, upload: 60s, download: 120s)
  - Retry settings (3 max attempts with exponential backoff)
  - All API endpoints organized by domain
  - Logging configuration (enabled in `__DEV__` mode)

### Path Aliases

TypeScript path alias `@/*` resolves to the project root:
```typescript
import { ApiClient } from '@/services/shared/api-client';
import { useAuth } from '@/hooks/use-auth';
```

### QR Code System

The QR code system has two flows:

**Client Flow** (regular users):
- `QrApi.getCurrentQrCode()` - Fetches QR code with token and base64 image
- Tokens are cached in AsyncStorage under `@maya_partner_qr_token`
- Tokens expire after 5 minutes (auto-refreshed)

**Partner Flow** (stores/operators):
- `QrApi.validateQrToken()` - Validates scanned QR token and creates transaction
- Requires `partnerId`, `storeId`, `operatorUserId`
- Automatically extracts user IDs from `AuthService.getCurrentUserInfo()` if not provided
- Processes transaction with amount, discount, and person count

**Important**: The QR API uses a different base URL (`/api` instead of `/api/v1`). This is handled automatically via `QR_API_BASE_URL` in `qrApi.ts`.

## Code Style and Quality

### Import Ordering

ESLint is configured to enforce import order:
1. React and React Native
2. Expo packages
3. External packages
4. Internal packages (`@/...`)
5. Parent/sibling imports

Use alphabetical sorting within groups.

### Testing

- Jest configuration in `jest.config.js`
- Test files: `**/__tests__/**/*.test.{ts,tsx}` or `**/*.test.{ts,tsx}` or `**/*.spec.{ts,tsx}`
- Path alias `@/*` is configured in Jest
- Coverage threshold: 50% for branches, functions, lines, and statements
- Coverage collected from `services/`, `components/`, `hooks/`, and `features/`

### TypeScript

- Strict mode enabled
- All files use TypeScript (`.ts`, `.tsx`)
- Type definitions co-located with features (e.g., `features/home/types.ts`)
- Shared types in `types/` directory
- JSX set to `react-native` mode

## Key Implementation Patterns

### Role-Based UI

Partner/operator users are identified by:
- Email containing "partner", "partenaire", "operator", "opérateur"
- User object with `role` property: "partner", "operator", "StoreOperator"
- User object with `isPartner` or `isOperator` boolean

Tab navigation is hidden for partner users (see `app/(tabs)/_layout.tsx:44-63`).

### Authentication Flow

1. User loads app → `AuthProvider` checks `AuthService.isAuthenticated()`
2. If authenticated, attempts to fetch user info from API, falls back to local storage
3. Unauthenticated users redirect to `/connexion/login` (see `app/(tabs)/_layout.tsx:18-20`)
4. After login, user data is stored locally and in context

### API Error Handling

All API errors are transformed to `ApiError` objects with:
- `status` - HTTP status code
- `message` - User-friendly error message
- `url` - The endpoint that failed
- `originalError` - Raw error for debugging

Use the error handling patterns in `services/shared/errors.ts`.

### Responsive Design

Use `utils/responsive.ts` helper `responsiveSpacing()` for consistent spacing across device sizes.

## Environment Variables

Create a `.env` file at the root:
```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

This is accessed via `process.env.EXPO_PUBLIC_API_BASE_URL` in the codebase.

## Documentation References

For detailed information, refer to:
- **ARCHITECTURE.md** - Complete architecture documentation (if exists)
- **README_ARCHITECTURE.md** - Architecture usage guide (if exists)
- **OPTIMIZATION.md** - Performance optimization guide (if exists)
- **OPTIMIZATIONS_SUMMARY.md** - Summary of optimizations (if exists)
- **SETUP_IMPROVEMENTS.md** - Setup and contribution guidelines (if exists)
