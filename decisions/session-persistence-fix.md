# Decision: Session Persistence Fix

**Date**: 2026-05-25  
**Status**: Implemented

## Problem

After a successful login, refreshing the browser redirected the user back to `/login` instead of staying on the current page.

## Root Causes

Four independent bugs combined to cause this:

### Client-side

1. **`isAuthenticated` not persisted** — `partialize` in `authStore.ts` saved `user` and `accessToken` but omitted `isAuthenticated`. On reload, Zustand rehydrated `user` from localStorage but `isAuthenticated` remained `false`, causing layout guards to redirect immediately.

2. **No silent session restore** — The access token (15 min JWT) is intentionally not persisted for security. Without a restore hook calling `/api/auth/refresh` on boot, the in-memory token was always `null` after a reload, so authenticated API calls would fail even if the user had a valid refresh cookie.

### Server-side (identified by `db-session-agent`)

3. **Refresh token was a JWT** — `signRefreshToken(payload)` created a verifiable JWT, meaning the token could be used even after the session row was deleted. Opaque tokens (`generateToken()` — crypto.randomBytes 32 bytes) bind validity to the database row, enabling true revocation.

4. **Token rotation used `update()` not a transaction** — `session.update({ refreshToken: newRefresh })` left the old token valid until the update completed. A `$transaction([delete old, create new])` ensures the window where both tokens are valid is zero.

## Solution

### `client/src/store/authStore.ts`
- Added `isAuthenticated` to `partialize` so it survives page reload.
- Added `isRestoring: boolean` (not persisted — always starts `true`).
- Removed `onRehydrateStorage` callback (direct state mutation in that callback is unsafe; simpler to just persist `isAuthenticated` directly).

### `client/src/hooks/useSessionRestore.ts` (new file)
- Called once at app root in `App.tsx`.
- If no `user` in store, marks `isRestoring = false` immediately (unauthenticated, redirect handled by guards).
- Otherwise POSTs to `/api/auth/refresh` with `{ withCredentials: true }` using the httpOnly cookie.
- On success: stores new access token.
- On failure: calls `logout()` to clear stale local state; guards redirect to `/login`.
- Always calls `setRestoring(false)` in `.finally()`.
- `timeout: 5000` prevents an unreachable server from leaving `isRestoring = true` forever (infinite spinner).

### `client/src/layouts/AdminLayout.tsx` + `ClientLayout.tsx`
- Added `isRestoring` check before auth guard: shows a centered spinner while restore is in flight, preventing a flash-redirect to `/login`.

### `server/src/services/auth.service.ts`
- `login()`: replaced `signRefreshToken(payload)` with `generateToken()`.
- `refresh()`: replaced `session.update()` with `prisma.$transaction([delete, create])` for atomic rotation.

## Alternatives Considered

| Approach | Why rejected |
|---|---|
| Persist `accessToken` to localStorage | Access tokens in localStorage are XSS-vulnerable; httpOnly cookie + silent refresh is the standard pattern |
| Keep JWT refresh token | Breaks revocation; the whole point of storing in DB is to be able to invalidate sessions server-side |
| Use `onRehydrateStorage` to set `isAuthenticated` | Requires direct state mutation in the callback — fragile, order-dependent, flagged as unsafe by code review |
| Increase access token TTL instead | Defeats the purpose of short-lived tokens; doesn't fix the rotation bug |

## Trade-offs

- **Extra network call on every boot**: `useSessionRestore` makes one `/api/auth/refresh` request on each hard reload. This is the standard SPA auth pattern and unavoidable if access tokens aren't persisted. The `timeout: 5000` bounds the worst case.
- **Slightly more complex auth flow**: The `isRestoring` state adds a boolean to track, but it's the minimal addition needed to prevent flash-redirects without race conditions.
- **Token rotation breaks concurrency**: If two tabs reload simultaneously, one will get a 401 on refresh (the other already rotated the token). Mitigation: the failed tab's `useSessionRestore` calls `logout()`, which clears the store. The next navigation will prompt re-login. This is acceptable for the current use case and the standard trade-off in single-use token rotation.
