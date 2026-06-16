---
name: Session-based auth pattern for this project
description: How auth is wired in WICHI System — express-session, connect-pg-simple, bcryptjs, session role storage.
---

## The Rule
- Sessions use `express-session` + `connect-pg-simple` (PostgreSQL session store, table auto-created).
- On login, store BOTH `userId` and `userRole` in the session to avoid a DB round-trip in auth middleware.
- `SESSION_SECRET` env var is required; falls back to a dev default.
- `secure: false` in cookie config — set to `true` when behind HTTPS in production.
- Default super_admin: username `admin`, password regenerated with bcrypt whenever re-seeding.

**Why:** Storing userRole in session allows simple inline role checks (`req.session.userRole`) without a DB query per request.

**How to apply:** When adding new protected routes, check `(req.session as any).userRole` for role-based access.
