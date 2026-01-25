---
name: firebase-hackathon-workflow
description: Implements hackathon-friendly Firebase client flows for this repo (Google Auth, users/{uid} profile onboarding, Firestore queries/writes, Storage uploads). Use when working on login, onboarding, vets listing, requests messaging, or any Firebase Auth/Firestore/Storage code.
---

# Firebase Hackathon Workflow (client-only)

## Quick start (what to follow by default)

- **Client-only Firebase** (no `firebase-admin`, no server sessions).
- Use `@/lib/firebase` for `auth`, `db`, `storage`.
- Auth state + profile state live in `AuthProvider`; do not re-invent auth state per page.
- Protected pages should be wrapped with `RequireAuth`.

## Workflow: add/modify a profile field

1. Update `UserProfile` in `src/lib/users.ts` (type-only change).
2. Update the onboarding form (`src/app/onboarding/page.tsx`) to collect the field.
3. Persist via `updateUserProfile(uid, patch)` and ensure `updatedAt` is set.
4. If the field should affect routing/gating, rely on `profile.profileComplete` (keep gating simple).

## Workflow: write a new Firestore collection

1. Define a minimal TS type in the page or a small `src/lib/*.ts` helper.
2. Use `serverTimestamp()` for `createdAt`/`updatedAt`.
3. Prefer `onSnapshot(query(...))` for lists that should live-update.
4. Keep queries simple (test mode); add indexes only if needed.

## Workflow: Storage upload

- Store user-owned files under predictable prefixes:
  - `avatars/{uid}`
  - `request-attachments/{requestId}/{filename}` (if added later)
- After upload, call `getDownloadURL` and store the URL in Firestore.

## Validation checklist

- [ ] No imports from removed root `firebase.ts`
- [ ] No server-only Firebase code
- [ ] No dark mode classes added
- [ ] `bun run lint` passes

