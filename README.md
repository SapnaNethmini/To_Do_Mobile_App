# TODO Mobile

React Native + Expo mobile client for the TODO app. Shares the same Express + SQLite backend as the web client.

## Requirements

- Node.js 20+
- Expo Go installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- The backend server running (`../To_do_web/server`)

## Backend setup (one-time)

The backend at `../To_do_web/server` requires four small changes before the mobile app can connect. These are already applied — verify by running the web app's full flow (register → login → CRUD → logout) and confirming it still passes.

If starting from scratch, see `spec.md §5` for the exact diff.

## Environment setup

Create a `.env` file in this directory:

```
EXPO_PUBLIC_API_URL=http://<your-machine-ip>:4000/api
```

| Target | URL |
|--------|-----|
| iOS Simulator | `http://localhost:4000/api` |
| Android Emulator | `http://10.0.2.2:4000/api` |
| Physical device (Expo Go) | `http://<your-LAN-IP>:4000/api` |

To find your LAN IP on Windows: open PowerShell and run `ipconfig \| Select-String "IPv4"`.

> Your LAN IP changes when you switch networks or the DHCP lease renews. Update `.env` and restart with `--clear` when that happens.

## Install

```bash
npm install
```

## Run

```bash
# Start Metro — scan the QR code in Expo Go
npx expo start

# Clear Metro cache (do this after changing .env)
npx expo start --clear

# If LAN routing fails (AP isolation / different subnets)
npx expo start --tunnel

# Target a specific platform
npx expo start --ios
npx expo start --android
```

## Typecheck / Lint / Test

```bash
npx tsc --noEmit          # TypeScript strict check
npx eslint . --ext .ts,.tsx   # ESLint
npx jest                  # Run all tests
npx jest --coverage       # With coverage report
npm audit --omit=dev      # Prod-dependency audit
```

## Project structure

```
app/
  _layout.tsx             Root provider tree
  (auth)/                 Login + Register screens
  (app)/                  Dashboard, Todo detail, Settings
src/
  api/                    Axios client + endpoint functions
  components/             UI primitives and feature components
  config/                 Env validation (Zod)
  context/                AuthContext, ThemeContext
  hooks/                  React Query hooks (useTodos, useAuth)
  schemas/                Zod validation schemas
  services/               Token storage (SecureStore)
  theme/                  Palette, spacing, typography tokens
  types/                  Shared TypeScript types
assets/                   Images, icons, splash
```

## Production notes

- Set `APP_ENV=production` in your EAS build profile (`eas.json` is included).
- The env validator (`src/config/env.ts`) enforces `https://` API URLs in production — the app will refuse to boot with an `http://` URL when `APP_ENV=production`.
- JWTs are stored in `expo-secure-store` (Keychain on iOS, Keystore on Android) — never in AsyncStorage.
- No tokens are logged anywhere in the codebase.
