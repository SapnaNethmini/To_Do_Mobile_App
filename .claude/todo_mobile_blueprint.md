# TODO Mobile App — Master Blueprint (React Native + Expo)

> Production-grade blueprint for a React Native + Expo mobile client that **reuses the existing Node.js + Express + SQLite backend** and matches the design language of the existing web app. This is a separate codebase from the web project, but shares the same API contract, business rules, and visual identity.

**Companion to:** `C:\Users\sapna\Desktop\TO_DO\To_do_web\todo_blueprint.md`
**Web backend (reused):** `C:\Users\sapna\Desktop\TO_DO\To_do_web\server`
**Web frontend (style reference):** `C:\Users\sapna\Desktop\TO_DO\To_do_web\client`

---

## Table of Contents

1. [Goals & Non-Goals](#1-goals--non-goals)
2. [Tech Stack](#2-tech-stack)
3. [Backend Integration (Reuse Strategy)](#3-backend-integration-reuse-strategy)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [Expo Setup](#6-expo-setup)
7. [Navigation](#7-navigation)
8. [API Layer](#8-api-layer)
9. [State Management](#9-state-management)
10. [Authentication on Mobile](#10-authentication-on-mobile)
11. [UI / UX Design System](#11-ui--ux-design-system)
12. [Screens](#12-screens)
13. [Validation Strategy](#13-validation-strategy)
14. [Backend Changes Required](#14-backend-changes-required)
15. [Security Considerations](#15-security-considerations)
16. [TypeScript Best Practices](#16-typescript-best-practices)
17. [Performance & UX Polish](#17-performance--ux-polish)
18. [Environment & Configuration](#18-environment--configuration)
19. [Testing Strategy](#19-testing-strategy)
20. [Implementation Phases](#20-implementation-phases)
21. [Debugging Cheatsheet](#21-debugging-cheatsheet)
22. [Acceptance Checklist](#22-acceptance-checklist)

---

## 1. Goals & Non-Goals

**Goals**
- Native mobile experience for the same TODO product (Register / Login / Logout, full CRUD, status filter).
- **Reuse the existing backend without forking** — same endpoints, same validation, same data.
- Visual + interaction parity with the web app (Slate / Indigo theme, dark-mode, rounded-xl cards, optimistic updates, skeletons).
- Real-device testing via Expo Go from day one.
- Production-shippable architecture: layered, typed, testable.

**Non-Goals**
- Building a second backend or duplicating SQLite logic on-device.
- Offline-first sync engine. (We cache last-known list for snappy startup, but writes require network.)
- Push notifications, biometrics, or social login in v1 — see "Future".

---

## 2. Tech Stack

| Concern              | Choice                                                            | Why                                                                 |
|----------------------|-------------------------------------------------------------------|---------------------------------------------------------------------|
| Runtime              | React Native (via Expo SDK 50+)                                   | Fastest path; OTA updates; Expo Go for instant device testing       |
| Language             | TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)     | Same standard as web app                                            |
| Navigation           | **Expo Router** (file-based)                                      | First-class Expo support, deep linking out of the box, less boilerplate than React Navigation |
| HTTP                 | `axios` + interceptors                                            | Same client we use on web — easy to mirror behavior                 |
| Server state         | `@tanstack/react-query` v5                                        | Caching, retries, mutations, optimistic updates, pull-to-refresh    |
| Auth state           | React Context (`AuthProvider`) on top of React Query              | Small, app-wide, doesn't justify Redux                              |
| Token storage        | `expo-secure-store` (iOS Keychain / Android Keystore)             | Encrypted at rest; safer than `AsyncStorage` for JWTs               |
| Cache (non-secret)   | `@react-native-async-storage/async-storage`                       | React Query cache persistence, last-seen filter, theme              |
| Validation           | `zod` (shared style with backend)                                 | Single mental model across stack                                    |
| Forms                | `react-hook-form` + `@hookform/resolvers/zod`                     | Best-in-class for RN; controlled fields + Zod                       |
| Styling              | `nativewind` v4 (Tailwind for RN) + design tokens                 | Matches web app's Tailwind utilities                                |
| Icons                | `@expo/vector-icons` (Feather/Lucide subset)                      | Bundled with Expo, no native linking                                |
| Animations           | `react-native-reanimated` v3 + `Layout` animations                | Smooth add/edit/delete transitions                                  |
| Safe area / gestures | `react-native-safe-area-context`, `react-native-gesture-handler`  | Required by Expo Router and Reanimated                              |

### Deliberate trade-offs

- **Expo Router over React Navigation directly.** Expo Router *uses* React Navigation under the hood, so we keep its power (stack/tabs/modal) while gaining file-based routes that mirror the web app's mental model (`/login`, `/(app)/index`, `/(app)/todos/[id]`).
- **React Query over hand-rolled hooks.** Web app uses Context only; on mobile, list refresh, retries, and optimistic mutations are non-trivial enough that Query pays for itself.
- **SecureStore over AsyncStorage** for the JWT — `AsyncStorage` is plain text on disk.

---

## 3. Backend Integration (Reuse Strategy)

> ⚠️ **No new backend.** The mobile app talks to the existing Express server at `To_do_web/server`.

### 3.1 Same REST contract

Every endpoint listed in `todo_blueprint.md §6` is consumed verbatim:

```
POST   /api/auth/register
POST   /api/auth/login        ← issues JWT
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/todos?status=…&limit=…&cursor=…
POST   /api/todos
GET    /api/todos/:id
PATCH  /api/todos/:id
DELETE /api/todos/:id
```

Error envelope is identical (`{ error: { code, message, fields? } }`), so the client's error normalizer works the same as on web.

### 3.2 The `localhost` problem

A mobile device — emulator or physical — does **not** share `localhost` with your dev machine. Map per environment:

| Environment                          | What `localhost` means there                                    | What to use for `API_URL`                                          |
|--------------------------------------|-----------------------------------------------------------------|--------------------------------------------------------------------|
| iOS Simulator (Mac)                  | The simulator's own loopback                                    | `http://localhost:4000/api` works (simulator shares host network)  |
| Android Emulator (AVD)               | The emulator VM, **not** your dev machine                       | `http://10.0.2.2:4000/api` (AVD's alias for host loopback)         |
| Physical device on Expo Go (Wi-Fi)   | The phone itself                                                | `http://<your-LAN-IP>:4000/api`, e.g. `http://192.168.1.42:4000/api` |
| Tunnelled (Expo `--tunnel`)          | Phone reaches you via ngrok-style tunnel                        | A **public HTTPS** URL — backend must also be reachable publicly   |
| Production                           | Public internet                                                 | `https://api.yourdomain.com/api` (HTTPS mandatory)                 |

**Find your LAN IP:**
- Windows: `ipconfig` → IPv4 address on the active adapter.
- macOS/Linux: `ifconfig | grep inet` or `ip addr`.

Both phone and dev machine must be on the **same Wi-Fi**. Corporate / guest networks often block peer traffic — use a personal hotspot if so.

**Bind the dev server to all interfaces.** Express defaults are fine, but if you ever bound it to `127.0.0.1`, change to `0.0.0.0` so the phone can reach it.

### 3.3 Configuration pattern

Use `app.config.ts` + `expo-constants` instead of bare `.env`, so the API URL travels with each build profile:

```ts
// app.config.ts
import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'TODO',
  slug: 'todo-mobile',
  scheme: 'todo',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api',
  },
  // ...
};
export default config;
```

```ts
// src/config/env.ts
import Constants from 'expo-constants';
import { z } from 'zod';

const schema = z.object({ apiUrl: z.string().url() });
export const env = schema.parse(Constants.expoConfig?.extra);
```

Per-developer override via `.env` (gitignored):

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:4000/api
```

Fail fast at boot if the URL is malformed — same philosophy as the backend's Zod env validation.

### 3.4 CORS

CORS is a **browser** mechanism — native React Native does not enforce it, so requests from Expo Go succeed even if the backend's `Access-Control-Allow-Origin` doesn't list the device. **However:** if you ever load the app via the Expo *web* preview, CORS does apply. To keep both targets working, add the LAN dev origin(s) to the backend's `CORS_ORIGIN` list (see §14).

### 3.5 JWT — the big behavioral split

| Aspect              | Web                                            | Mobile                                                   |
|---------------------|------------------------------------------------|----------------------------------------------------------|
| Where the token lives | `httpOnly` `Secure` `SameSite=Strict` cookie | `Authorization: Bearer <token>` header, token in SecureStore |
| Why                 | Browsers can't read httpOnly cookies → XSS-safe | RN has no cookie jar by default; SecureStore is OS-encrypted |
| CSRF concern        | Yes (mitigated by SameSite + double-submit)    | None — header-only auth isn't sent automatically by anything |
| Logout              | `clearCookie` + blacklist `jti`                | Delete from SecureStore + `POST /logout` to blacklist `jti` |

The backend already signs the JWT — we just need it to **also accept it from the `Authorization` header** in addition to the cookie (see §14).

---

## 4. Architecture

Same dependency-inward philosophy as the web app, scaled to a mobile codebase.

```
   UI (screens, components)
            │
            ▼
   Hooks (useAuth, useTodos)        ← React Query + Context glue
            │
            ▼
   Services / API modules           ← business-y composition (e.g. login())
            │
            ▼
   API client (axios + interceptors) ← single HTTP entry point
            │
            ▼
   Backend (existing Express server)
```

| Layer        | Responsibility                                                        | Never touches                          |
|--------------|------------------------------------------------------------------------|----------------------------------------|
| `screens/`   | Layout + composition. No fetch logic, no business rules.               | axios, AsyncStorage directly           |
| `components/`| Pure presentational + small interactive widgets.                       | navigation, network                    |
| `hooks/`     | React Query queries/mutations, Context bridges.                        | UI primitives                          |
| `services/`  | Multi-step flows (e.g. `login` = call API → store token → set state).  | UI                                     |
| `api/`       | One file per resource; thin wrappers over axios; type the responses.   | components / screens                   |
| `context/`   | App-wide state holders (Auth, Theme).                                  | UI internals                           |
| `utils/`     | Pure helpers (date, format, error normalize).                          | React, network                         |
| `types/`     | Shared types + Zod schemas (mirrors backend domain).                   | runtime concerns                       |

**File-size rule:** ≤ ~150 lines, one responsibility per file (same as web app).

---

## 5. Project Structure

```
To_do_mobile/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout: providers, splash, theme
│   ├── (auth)/
│   │   ├── _layout.tsx           # Stack for unauthenticated screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/                    # Authenticated group; redirects to /login if no token
│   │   ├── _layout.tsx           # Tab or stack layout for the main app
│   │   ├── index.tsx             # Dashboard / todo list
│   │   ├── todos/
│   │   │   └── [id].tsx          # Todo detail + edit
│   │   └── settings.tsx          # Logout, theme toggle
│   └── +not-found.tsx
│
├── src/
│   ├── api/
│   │   ├── client.ts             # axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── todos.api.ts
│   │   └── errors.ts             # normalize backend error envelope
│   │
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Badge, Skeleton, Toast, EmptyState
│   │   ├── todos/                # TodoItem, TodoForm, FilterTabs
│   │   └── layout/               # Screen, Header
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTodos.ts           # list, create, update, delete (React Query)
│   │   ├── useDebouncedValue.ts
│   │   └── useColorScheme.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts       # login/register/logout flows (token + state)
│   │   └── token.storage.ts      # SecureStore wrapper
│   │
│   ├── config/
│   │   ├── env.ts                # validated Constants.expoConfig.extra
│   │   └── queryClient.ts        # React Query defaults
│   │
│   ├── theme/
│   │   ├── colors.ts             # tokens (light + dark)
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   │
│   ├── schemas/
│   │   ├── auth.schema.ts        # mirrors backend Zod
│   │   └── todos.schema.ts
│   │
│   ├── types/
│   │   ├── todo.ts
│   │   ├── user.ts
│   │   └── api.ts                # ApiError, Paginated<T>, etc.
│   │
│   └── utils/
│       ├── format.ts
│       └── tryAsync.ts
│
├── assets/                       # icon, splash, fonts
├── app.config.ts
├── babel.config.js
├── metro.config.js
├── tailwind.config.js            # nativewind preset
├── global.css                    # nativewind directives
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

**Why this scales:**
- Routes are colocated under `app/` (Expo Router), but **business logic lives in `src/`** — routes stay thin.
- `(auth)` and `(app)` route groups give us per-group layouts (different headers, auth gating) without polluting URLs.
- `api/` and `services/` are deliberately separate: `api/` returns DTOs, `services/` orchestrates side effects.
- Theme tokens are centralized so light/dark and a future re-skin are one-file changes.

---

## 6. Expo Setup

### 6.1 Initialize

```bash
# pick a directory next to To_do_web; for this project it's already To_do_mobile/
npx create-expo-app@latest . --template blank-typescript

# core deps
npx expo install expo-router expo-linking expo-constants expo-secure-store \
  expo-status-bar expo-splash-screen expo-font \
  react-native-safe-area-context react-native-screens react-native-gesture-handler \
  react-native-reanimated

# data + forms + validation
npm i axios @tanstack/react-query zod react-hook-form @hookform/resolvers \
  @react-native-async-storage/async-storage

# styling
npm i nativewind tailwindcss
npx tailwindcss init

# dev
npm i -D @types/react @types/react-native typescript
```

### 6.2 `app.json` / `app.config.ts` essentials

```jsonc
{
  "expo": {
    "scheme": "todo",
    "plugins": ["expo-router", "expo-secure-store"],
    "experiments": { "typedRoutes": true }
  }
}
```

### 6.3 Babel

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-reanimated/plugin'], // must be last
  };
};
```

### 6.4 Run with Expo Go

```bash
npx expo start                # QR code; press a / i / w
npx expo start --tunnel       # if you're on a hostile Wi-Fi
npx expo start --clear        # nuke Metro cache
```

Scan the QR code with the **Expo Go** app (Android: any camera; iOS: the Expo Go app's scanner).

---

## 7. Navigation

**Choice: Expo Router (file-based).**

Why over plain React Navigation:
- Mirrors the web app's mental model of routes — easier handoff between codebases.
- Built-in deep linking via `scheme: "todo"` (e.g. `todo://todos/123` opens the detail screen).
- Group folders `(auth)` / `(app)` let us redirect-gate without nesting providers inside every screen.

### Auth gating pattern

```tsx
// app/(app)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout() {
  const { status } = useAuth();
  if (status === 'loading') return null;          // splash stays up
  if (status === 'unauthenticated') return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: true }} />;
}
```

A symmetric guard in `app/(auth)/_layout.tsx` redirects already-logged-in users away from `/login`.

---

## 8. API Layer

### 8.1 Axios instance + interceptors

```ts
// src/api/client.ts
import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/services/token.storage';
import { normalizeApiError } from './errors';

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await tokenStorage.clear();
      // router redirect handled by AuthContext via event bus or query invalidation
    }
    return Promise.reject(normalizeApiError(err));
  },
);
```

### 8.2 Error normalization

The backend returns `{ error: { code, message, fields? } }`. We collapse axios's many failure shapes into one:

```ts
// src/api/errors.ts
import { AxiosError } from 'axios';

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  status: number;
};

export function normalizeApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: Partial<ApiError> } | undefined;
    return {
      code: data?.error?.code ?? 'NETWORK_ERROR',
      message: data?.error?.message ?? err.message ?? 'Network error',
      fields: data?.error?.fields,
      status: err.response?.status ?? 0,
    };
  }
  return { code: 'UNKNOWN', message: 'Unexpected error', status: 0 };
}
```

Every screen consumes the same shape — `error.fields?.email` lights up the email input, `error.message` goes into a toast.

### 8.3 Resource modules

```ts
// src/api/auth.api.ts
import { api } from './client';
import type { User } from '@/types/user';

export const authApi = {
  register: (input: { username: string; email: string; password: string }) =>
    api.post<{ data: User }>('/auth/register', input).then(r => r.data.data),
  login: (input: { email: string; password: string }) =>
    api.post<{ data: { user: User; token: string } }>('/auth/login', input).then(r => r.data.data),
  me: () => api.get<{ data: User }>('/auth/me').then(r => r.data.data),
  logout: () => api.post('/auth/logout').then(() => undefined),
};
```

```ts
// src/api/todos.api.ts
import { api } from './client';
import type { Todo } from '@/types/todo';

export type TodoStatus = 'all' | 'active' | 'completed';

export const todosApi = {
  list: (params: { status?: TodoStatus; cursor?: string; limit?: number } = {}) =>
    api.get<{ data: { items: Todo[]; nextCursor: string | null } }>('/todos', { params })
       .then(r => r.data.data),
  create: (input: { title: string; description?: string }) =>
    api.post<{ data: Todo }>('/todos', input).then(r => r.data.data),
  update: (id: string, patch: Partial<Pick<Todo, 'title' | 'description' | 'completed'>>) =>
    api.patch<{ data: Todo }>(`/todos/${id}`, patch).then(r => r.data.data),
  remove: (id: string) => api.delete(`/todos/${id}`).then(() => undefined),
};
```

---

## 9. State Management

| What                          | Where it lives           | Why                                                                 |
|-------------------------------|--------------------------|---------------------------------------------------------------------|
| Current user, auth status     | `AuthContext` + SecureStore | App-wide, infrequently changes, drives navigation gating         |
| Todo list, mutations          | React Query              | Caching, retries, pagination, optimistic updates, pull-to-refresh   |
| Theme (light/dark/system)     | `ThemeContext` + AsyncStorage | App-wide, user-controlled                                       |
| Form state                    | `react-hook-form`        | Local to a screen; avoids re-renders                                |
| Ephemeral UI (modals, toasts) | Local `useState`         | Doesn't justify globalization                                       |

### React Query setup

```ts
// src/config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnReconnect: 'always',
    },
    mutations: { retry: 0 },
  },
});
```

### `useTodos` — typical query/mutation pair

```ts
// src/hooks/useTodos.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todosApi, type TodoStatus } from '@/api/todos.api';
import type { Todo } from '@/types/todo';

const qk = {
  list: (status: TodoStatus) => ['todos', 'list', status] as const,
};

export const useTodoList = (status: TodoStatus) =>
  useQuery({ queryKey: qk.list(status), queryFn: () => todosApi.list({ status }) });

export const useUpdateTodo = (status: TodoStatus) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Todo> }) => todosApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.list(status) });
      const prev = qc.getQueryData<{ items: Todo[] }>(qk.list(status));
      qc.setQueryData(qk.list(status), (old: any) => ({
        ...old,
        items: old.items.map((t: Todo) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.list(status), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.list(status) }),
  });
};
```

The same optimistic pattern from the web app's Dashboard, just expressed in Query primitives.

---

## 10. Authentication on Mobile

### 10.1 Token storage

```ts
// src/services/token.storage.ts
import * as SecureStore from 'expo-secure-store';

const KEY = 'todo.jwt';

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) =>
    SecureStore.setItemAsync(KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    }),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
```

> ⚠️ `expo-secure-store` is **not available in Expo Go on Web**. That's fine — we don't ship to web. On native (iOS/Android Expo Go), it's backed by Keychain / Keystore.

### 10.2 AuthContext

```tsx
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth.api';
import { tokenStorage } from '@/services/token.storage';
import type { User } from '@/types/user';

type Status = 'loading' | 'authenticated' | 'unauthenticated';
type Ctx = {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { (async () => {
    const token = await tokenStorage.get();
    if (!token) return setStatus('unauthenticated');
    try {
      const me = await authApi.me();
      setUser(me); setStatus('authenticated');
    } catch {
      await tokenStorage.clear();
      setStatus('unauthenticated');
    }
  })(); }, []);

  const login: Ctx['login'] = async (email, password) => {
    const { user, token } = await authApi.login({ email, password });
    await tokenStorage.set(token);
    setUser(user); setStatus('authenticated');
  };

  const register: Ctx['register'] = async (input) => {
    await authApi.register(input);
    await login(input.email, input.password);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore — we still clear locally */ }
    await tokenStorage.clear();
    setUser(null); setStatus('unauthenticated');
  };

  return <AuthCtx.Provider value={{ status, user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
```

### 10.3 Persistence after restart

`tokenStorage.get()` runs on first render → if present, we hit `/auth/me` to rehydrate `user`. If the token is expired/revoked, the 401 interceptor clears storage and we fall through to `unauthenticated`. No login screen flash because the `(app)` layout returns `null` while `status === 'loading'` (splash stays visible).

### 10.4 Best practices

- **Never log the token.** Redact it in any debug printing.
- **Don't put it in `console.log`, query string, or AsyncStorage.** SecureStore only.
- **Short access TTL** (15 min, same as web). For mobile UX we may add refresh tokens later (see "Future").
- **Logout always clears local storage**, even if the network call fails.

---

## 11. UI / UX Design System

> **Goal:** a user who knows the web app should feel at home. Same color tokens, same spacing rhythm, same component vocabulary — translated to native primitives.

### 11.1 Design tokens (mirror Tailwind config of web app)

```ts
// src/theme/colors.ts
export const colors = {
  light: {
    bg:        '#F8FAFC', // slate-50
    surface:   '#FFFFFF',
    surfaceAlt:'#F1F5F9', // slate-100
    border:    '#E2E8F0', // slate-200
    text:      '#0F172A', // slate-900
    textMuted: '#64748B', // slate-500
    primary:   '#4F46E5', // indigo-600
    primaryFg: '#FFFFFF',
    success:   '#16A34A',
    danger:    '#DC2626',
  },
  dark: {
    bg:        '#0F172A', // slate-900
    surface:   '#1E293B', // slate-800
    surfaceAlt:'#334155', // slate-700
    border:    '#334155',
    text:      '#F1F5F9',
    textMuted: '#94A3B8',
    primary:   '#818CF8', // indigo-400
    primaryFg: '#0F172A',
    success:   '#4ADE80',
    danger:    '#F87171',
  },
};
```

```ts
// src/theme/spacing.ts
export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };
export const radius  = { sm: 6, md: 10, lg: 14, xl: 20, '2xl': 28, full: 9999 };
```

```ts
// src/theme/typography.ts
export const typography = {
  fontFamily: { sans: 'Inter_400Regular', medium: 'Inter_500Medium', bold: 'Inter_700Bold' },
  size:   { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
  lh:     { tight: 1.2, normal: 1.4, relaxed: 1.6 },
};
```

Load the **Inter** font via `expo-font` in the root layout — same family used on web for visual continuity.

### 11.2 NativeWind: shared utility vocabulary

Configure `tailwind.config.js` to mirror the web app's tokens:

```js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { /* re-export tokens from src/theme/colors.ts */ },
      borderRadius: { xl: '20px', '2xl': '28px' },
      fontFamily: { sans: ['Inter_400Regular'], medium: ['Inter_500Medium'], bold: ['Inter_700Bold'] },
    },
  },
};
```

Now `className="bg-surface dark:bg-surface rounded-xl shadow-md p-4"` works on a `<View>` and reads like the web JSX.

### 11.3 Component vocabulary (matches web `components/ui/`)

| Web component       | Mobile equivalent (`src/components/ui/`)                                |
|---------------------|--------------------------------------------------------------------------|
| `Button`            | `<Button variant="primary|secondary|ghost|danger" size loading />`       |
| `Input`             | `<Input label error helperText leftIcon ... />` wraps `TextInput`        |
| `Card`              | `<Card>` — rounded-2xl, border, soft shadow, padded                       |
| `Modal`             | Expo Router modal route + reanimated slide                               |
| `Toast`             | Custom toaster on top of `react-native-toast-message`                    |
| `Skeleton`          | Animated shimmer block for loading states                                |
| `Badge`             | Filter pill / completed marker                                           |
| `EmptyState`        | Illustration + heading + CTA — same copy as web                          |

### 11.4 Visual rules (parity with web)

- **Cards:** `rounded-2xl`, 1px hairline border, `shadow-md` light / no shadow dark, ~16px padding.
- **Spacing rhythm:** 4 / 8 / 12 / 16 / 24 — same Tailwind 4px grid as web.
- **Touch targets:** ≥ 44 × 44 pt (Apple HIG); icon-only buttons get padding to meet that.
- **Dark mode:** follow system by default, user can override in Settings; persist choice in AsyncStorage.
- **Motion:** Reanimated `Layout` springs on list inserts/removes; 150–200ms easing for state changes; never block the JS thread.

### 11.5 UX must-haves

- **Loading → skeleton, not spinner** (match web's Dashboard).
- **Pull-to-refresh** on the todo list (`RefreshControl`).
- **Inline edit** on tap of a todo title — same affordance as web.
- **Optimistic updates** on toggle/delete with rollback on failure.
- **Empty state** mirrors web copy and illustration.
- **Field-level errors** from `error.fields` light up the relevant `<Input>`; top-level `error.message` goes into a toast.
- **Keyboard handling:** `KeyboardAvoidingView` on auth + edit screens; "Done" key submits.
- **Haptics** on success (create/complete) and error — `expo-haptics`, light impact.
- **Safe areas** respected via `react-native-safe-area-context` everywhere.

---

## 12. Screens

| Route                        | Screen          | Notes                                                                  |
|------------------------------|-----------------|------------------------------------------------------------------------|
| `/(auth)/login`              | Login           | Email + password, validation via Zod, "Don't have an account?" link    |
| `/(auth)/register`           | Register        | username + email + password with strength hints                        |
| `/(app)/`                    | Dashboard       | Filter tabs, todo list, FAB to add, pull-to-refresh, skeletons         |
| `/(app)/todos/[id]`          | TodoDetail      | Full edit form: title, description, completed toggle, delete           |
| `/(app)/settings`            | Settings        | User info, theme toggle, Logout                                        |
| `+not-found`                 | NotFound        | Friendly fallback                                                      |

**Dashboard interactions:**
- Filter tabs: All / Active / Completed (segmented control style).
- Tap a row → navigate to detail.
- Long-press or trailing icon → delete with confirm sheet.
- Inline checkbox toggles `completed` (optimistic).
- FAB at bottom-right opens a modal route to create a todo.

---

## 13. Validation Strategy

- **Schemas in `src/schemas/`** mirror the backend ones from `todo_blueprint.md §7`.
- **`react-hook-form` + Zod resolver** for forms; the same rules run on submit, reducing wasted round-trips.
- **Server is still the source of truth.** Even if client validation passes, surface backend `VALIDATION_ERROR.fields` next to the offending input.
- **Trim/normalize on the client too** (lowercase email) so the request matches what the server stores.

```ts
// src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().transform(s => s.toLowerCase().trim()),
  password: z.string().min(1, 'Password required'),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(255).transform(s => s.toLowerCase().trim()),
  password: z.string().min(8).max(72)
    .regex(/[A-Z]/, 'uppercase required')
    .regex(/[a-z]/, 'lowercase required')
    .regex(/[0-9]/, 'digit required')
    .regex(/[^A-Za-z0-9]/, 'symbol required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

---

## 14. Backend Changes Required

> **Database:** zero changes. Schema, queries, and indexes stay as-is.

The backend currently authenticates via `httpOnly` cookies. To support a native client we need **two small additions** — both backwards compatible with the web app.

### 14.1 Accept `Authorization: Bearer <token>`

In `presentation/middleware/auth.mw.ts`, fall back to the header when the cookie is missing:

```ts
const cookieToken = req.cookies?.access;
const headerToken = req.headers.authorization?.startsWith('Bearer ')
  ? req.headers.authorization.slice(7)
  : undefined;
const token = cookieToken ?? headerToken;
if (!token) throw new DomainError('UNAUTHORIZED', 'Missing token', 401);
```

### 14.2 Return the token in the login response

Web ignores the body (it uses the cookie); mobile reads `data.token`:

```ts
// presentation/controllers/auth.ctrl.ts (login)
res.cookie('access', token, cookieOpts);                   // for web
res.status(200).json({ data: { user: toUserDto(user), token } }); // for mobile
```

This is safe: returning the token over the same TLS channel that set the cookie doesn't increase exposure.

### 14.3 CORS allowlist

Add LAN dev origins (and Expo dev URLs if you ever load via web):

```env
# backend/.env
CORS_ORIGIN=http://localhost:5173,http://192.168.1.42:8081,http://192.168.1.42:19006
```

```ts
// presentation/app.ts
const allowed = env.CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) =>
    !origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('CORS')),
  credentials: true,
}));
```

CORS is irrelevant for native RN traffic but needed if you preview on web.

### 14.4 Bind to all interfaces

If `server.ts` calls `app.listen(PORT, '127.0.0.1', ...)`, change to `app.listen(PORT, '0.0.0.0', ...)` (or omit the host) so phones on the LAN can reach it.

### 14.5 (Optional, recommended later) Refresh tokens

Mobile sessions live longer than browser sessions. Adding a `/auth/refresh` endpoint backed by a refresh token (longer TTL, single-use, rotated) is the standard fix. Out of scope for v1.

---

## 15. Security Considerations

| Concern                    | Mobile mitigation                                                              |
|----------------------------|--------------------------------------------------------------------------------|
| Token at rest              | `expo-secure-store` (Keychain / Keystore). Never `AsyncStorage`.               |
| Token in transit           | **HTTPS in production, no exceptions.** HTTP is dev-only on a trusted LAN.     |
| Token in logs              | Redact `Authorization` header + login response body in any debug printing.    |
| Cleartext traffic (Android)| Use `usesCleartextTraffic: false` for prod builds; enable only for dev variant.|
| iOS ATS                    | Don't add blanket `NSAllowsArbitraryLoads` — scope exceptions to dev hosts.    |
| Token leakage to deep links| Never accept a JWT via deep link query; only via the login API.                |
| Backend trust              | API-only communication; no direct DB access from mobile.                       |
| Authorization              | Already enforced server-side per the web blueprint — mobile inherits it.       |
| 401 handling               | Interceptor clears SecureStore + flips Auth state → user lands on `/login`.    |
| Jailbreak / root           | Out of scope for v1; SecureStore is best-effort there. Document as a risk.     |
| Dependency hygiene         | `npm audit` in CI; pin Expo SDK; review native module additions.               |
| App secrets in `extra`     | `expoConfig.extra` is **public** — only put non-secret config (API URL, flags).|
| Accidental http://         | `env.ts` Zod schema requires `z.string().url()`; in prod we tighten to `https`.|

---

## 16. TypeScript Best Practices

Same rules as the web app, plus a few RN-specific ones:

1. `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.
2. Path aliases: `@/api`, `@/hooks`, `@/types`, etc. — set in `tsconfig.json` *and* `babel.config.js` (via `babel-plugin-module-resolver` if needed; Expo Router supports `@/*` natively when configured).
3. **No `any`** — use `unknown` and narrow.
4. `z.infer` types everywhere a Zod schema exists.
5. Branded types for `UserId`, `TodoId` to prevent ID mix-ups.
6. **Typed routes** via `experiments.typedRoutes` in `app.json` — autocompletes `router.push('/(app)/todos/[id]')`.
7. Strictly typed React Query: `useQuery<Todo[], ApiError>`.
8. Discriminated unions for screen state: `type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error', error: ApiError } | { kind: 'success', data: T }`.

---

## 17. Performance & UX Polish

| Layer        | Technique                                                                    |
|--------------|------------------------------------------------------------------------------|
| Lists        | `FlatList` with `keyExtractor`, `getItemLayout` when row height is fixed     |
| Lists        | `removeClippedSubviews`, `windowSize`, `initialNumToRender` tuned to content |
| Reanimated   | Layout animations on insert/remove instead of LayoutAnimation (smoother)     |
| Network      | React Query caching + `staleTime` + background refetch                       |
| Images/icons | `expo-image` for any remote/asset imagery (caching, blurhash)                |
| Bundle       | Tree-shake icon set; import single icons not whole packs                     |
| Cold start   | `expo-splash-screen` held until fonts + auth check resolve                   |
| Re-renders   | `react-hook-form` keeps form state out of React; memoize list rows           |
| Animations   | Always run on UI thread (Reanimated `worklet`s)                              |

---

## 18. Environment & Configuration

`.env.example`:
```env
# Pick the right one for your dev setup; LAN IP for physical devices.
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api          # Android emulator
# EXPO_PUBLIC_API_URL=http://localhost:4000/api       # iOS simulator
# EXPO_PUBLIC_API_URL=http://192.168.1.42:4000/api    # physical device on Wi-Fi
# EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api  # production
```

Build profiles in `eas.json` (when you adopt EAS Build) carry the right URL per env:

```jsonc
{
  "build": {
    "development": { "env": { "EXPO_PUBLIC_API_URL": "http://192.168.1.42:4000/api" } },
    "preview":     { "env": { "EXPO_PUBLIC_API_URL": "https://staging-api.yourdomain.com/api" } },
    "production":  { "env": { "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api" } }
  }
}
```

---

## 19. Testing Strategy

| Layer            | Tooling                                        | Scope                                              |
|------------------|------------------------------------------------|----------------------------------------------------|
| Unit             | `jest` + `@testing-library/react-native`       | Components, hooks, utilities, schemas              |
| API              | `msw` (Mock Service Worker for RN) + `jest`    | API modules, interceptor behavior, error normalize |
| Schema           | `jest`                                         | Zod schemas accept/reject as expected              |
| Integration      | RN Testing Library + Query test wrappers       | Login flow, list+create+toggle+delete              |
| E2E (later)      | Maestro or Detox                               | Full device flows: launch → login → CRUD           |
| Manual on device | Expo Go on iOS + Android                       | Real network behavior, gesture feel, dark mode     |

**Coverage targets:** services + hooks 80%, components 60%, utils 100%.

---

## 20. Implementation Phases

### Phase 1 — Foundation (½ day)
1. `npx create-expo-app`, install deps from §6.1.
2. Configure NativeWind, Babel, fonts, splash, app icon.
3. `env.ts` with Zod validation; `app.config.ts` reads `EXPO_PUBLIC_API_URL`.
4. Set up `tsconfig.json` strict + path aliases; ESLint + Prettier.
5. Verify `npx expo start` runs in Expo Go on your phone.

### Phase 2 — Navigation skeleton
1. `app/_layout.tsx` with providers (Query, Auth, Theme, SafeArea, GestureHandler).
2. `(auth)` and `(app)` route groups with redirect-gated `_layout.tsx`.
3. Placeholder screens routing top-to-bottom.

### Phase 3 — API integration
1. Axios instance + request/response interceptors (§8.1).
2. `auth.api.ts`, `todos.api.ts` with typed responses.
3. `normalizeApiError` + small `ApiError` test fixture.
4. Smoke test: hit `/auth/me` from a debug button, observe 401.

### Phase 4 — Backend changes (one-shot)
1. Update web backend per §14: header fallback, login returns token, CORS allowlist, bind 0.0.0.0.
2. Re-run web app — confirm cookie auth still works (no regressions).

### Phase 5 — Authentication flow
1. SecureStore wrapper + `AuthContext`.
2. Login + Register screens with `react-hook-form` + Zod.
3. Field-level error rendering from `error.fields`.
4. Persist + rehydrate via `/auth/me` on cold start.
5. Logout calls API + clears SecureStore + resets Query cache.

### Phase 6 — Todo screens
1. Dashboard list with filter tabs, skeleton, empty state, pull-to-refresh.
2. FAB → modal route to create.
3. Inline checkbox toggle, optimistic.
4. Detail screen with edit + delete.

### Phase 7 — State + UX polish
1. React Query mutations w/ optimistic updates and rollback for all CRUD.
2. Toasts via `react-native-toast-message`.
3. Reanimated layout transitions on list mutations.
4. Dark mode + theme persistence.
5. Haptics on key actions.

### Phase 8 — Style alignment with web
1. Side-by-side review against the web app: typography, spacing, card shape, color contrast in both themes.
2. Component-by-component diff vs `client/src/components/ui/`.
3. Empty state copy and visuals match.

### Phase 9 — Test on Expo Go
1. Android emulator + iOS simulator + at least one physical device.
2. Verify token persists across app reload.
3. Verify 401 on tampered token kicks user back to `/login`.
4. Verify pull-to-refresh, optimistic rollback (toggle airplane mode mid-mutation).

### Phase 10 — Hardening
1. `npm audit`; pin Expo SDK.
2. Confirm `Authorization` header is redacted in any logs.
3. Confirm prod build URL is `https://`; reject `http://` in prod via env schema.
4. Lint, typecheck, tests green.
5. Production build via EAS (`eas build -p android --profile preview`).

---

## 21. Debugging Cheatsheet

| Symptom                                                          | Likely cause                                              | Fix                                                                       |
|------------------------------------------------------------------|-----------------------------------------------------------|---------------------------------------------------------------------------|
| `Network Error` on physical device, works on simulator           | `localhost` doesn't resolve to your laptop                | Use LAN IP (`http://192.168.x.x:4000/api`) and same Wi-Fi                 |
| Works on iOS sim, fails on Android emulator                      | Android emulator's `localhost` is the VM                  | Use `http://10.0.2.2:4000/api`                                            |
| `cleartext HTTP traffic not permitted` on Android prod           | Default network security config blocks HTTP              | Use HTTPS in prod, or scope cleartext to dev-only network config         |
| `App Transport Security` blocks request on iOS                   | iOS blocks plain HTTP                                    | HTTPS in prod; for dev, scope ATS exception to dev host only             |
| Login succeeds but next request 401s                             | Token not being sent or stored                            | Check SecureStore write, Authorization header in interceptor             |
| 401 on every request after cold start                            | Token expired and you're not clearing                    | Verify response interceptor clears storage on 401                        |
| CORS error, but only in Expo *web* preview                       | Browser enforces CORS; native doesn't                    | Add origin to backend `CORS_ORIGIN`                                       |
| Reanimated crash on first install                                | Babel plugin missing / not last                           | Add `react-native-reanimated/plugin` as the **last** Babel plugin        |
| `expo-secure-store` errors on Web                                | Web is unsupported                                        | Don't ship to web, or guard with `Platform.OS !== 'web'`                 |
| Phone can't see laptop                                           | Different networks / AP isolation                         | Same Wi-Fi, or use `npx expo start --tunnel`                              |
| Backend rejects login payload                                    | Email casing / trailing whitespace                        | `transform(s => s.toLowerCase().trim())` in client schema too            |

---

## 22. Acceptance Checklist

- [ ] `npx expo start` runs cleanly; QR code opens in Expo Go on a real device
- [ ] User can register; weak passwords rejected with field-level errors
- [ ] User can log in; JWT stored in SecureStore; survives app restart
- [ ] `/auth/me` rehydrates user on cold start; expired token kicks to login
- [ ] User can create, read, update, delete their todos
- [ ] Filter All / Active / Completed works; cursor pagination loads more
- [ ] Cross-user todo access returns 404 (parity with web)
- [ ] Optimistic updates roll back on network failure
- [ ] Pull-to-refresh works on the list
- [ ] Skeletons show during initial loads (no spinners as the primary indicator)
- [ ] Empty state matches web copy + visual style
- [ ] Dark mode follows system; user override persists
- [ ] Touch targets ≥ 44pt; safe areas respected
- [ ] No `any` in TS; strict mode passes; ESLint clean
- [ ] Prod env requires HTTPS API URL (Zod-enforced)
- [ ] No tokens in logs; 401 interceptor reliably clears state
- [ ] Backend changes (§14) merged and verified — web app still works

---

## Appendix — Future enhancements

- Refresh token + silent rotation (longer mobile sessions).
- Push notifications via `expo-notifications` for due-date reminders.
- Offline-first with `@tanstack/query-async-storage-persister` + outbox queue for writes.
- Biometric unlock to gate the JWT (`expo-local-authentication`).
- EAS Update for OTA JS updates without store review.
- Sentry / PostHog for crash + product analytics.

---

**Status:** Approved blueprint — ready for Phase 1 implementation.
