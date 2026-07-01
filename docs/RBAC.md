# RBAC — Roles, Teams & Permissions

This document explains how access control works in the Dazz Drones CRM: the data model, how permissions are combined, what overrides what, and where enforcement happens in the codebase.

---

## Overview

Access is **permission-based**, not hard-coded per user. Every CRM staff member gets a set of permission strings like `bookings:read` or `admin_users:manage`. The app checks these on every protected page and server action.

Permissions come from **four layers**:

1. **Role** — baseline for everyone with that job title  
2. **Teams** — extra access from group membership (additive)  
3. **User grants** — one-off extras for a specific person  
4. **User denials** — explicit revokes for a specific person  

**Super Admin** bypasses all checks in application code.

---

## Database tables

| Table | Purpose |
|-------|---------|
| `crm_modules` | Registry of CRM sections (`bookings`, `booking_requests`, …) |
| `crm_permissions` | Catalog of permission keys (`bookings:read`, …) |
| `crm_roles` | Roles (`super_admin`, `admin`, custom roles) |
| `crm_role_permissions` | Many-to-many: which permissions each role has |
| `crm_profiles` | CRM staff linked to `auth.users`; each user has **one role** |
| `crm_teams` | Named groups |
| `crm_team_members` | Users in teams (can belong to multiple teams) |
| `crm_team_module_access` | Per team: read/write on each module |
| `crm_user_permission_overrides` | Per user: grant (`granted=true`) or deny (`granted=false`) |
| `crm_audit_logs` | Admin action history |

Schema and seed data: `supabase/migrations/007_crm_auth_rbac.sql`

---

## Permission format

Permissions use the pattern **`{module_key}:{action}`**.

### Common actions

| Action | Typical use |
|--------|-------------|
| `read` | View lists and detail pages |
| `write` | Edit existing records |
| `create` | Create new records (e.g. manual booking) |
| `delete` | Delete table rows |
| `convert` | Convert booking request → booking (includes status workflow buttons) |
| `manage` | Full admin for that module (users, teams, roles, modules) |

### Modules (seeded)

**Operations**

- `dashboard`, `bookings`, `booking_requests`, `callback_requests`, `contact_requests`, `career_applications`, `enterprise_requests`

**Legacy**

- `legacy_data` — pilot registrations, for-businesses, platform users tables

**Administration**

- `admin_users`, `admin_teams`, `admin_roles`, `admin_modules`, `admin_audit`

---

## How effective permissions are calculated

Implemented in `src/lib/auth/permission-resolution.ts` → `mergeEffectivePermissions()`.

```
effective = (role permissions ∪ team permissions ∪ user grants) − user denials
```

### Priority (what overrides what)

| Priority | Layer | Behaviour |
|----------|--------|-----------|
| Highest | **Super Admin** (`role.key === 'super_admin'`) | All checks return true in app code |
| High | **User deny** | Removes a permission even if role and team granted it |
| Medium | **User grant** | Adds a permission role/team did not provide |
| Base | **Role** | Default set for everyone with that role |
| Additive | **Team** | Adds permissions on top of role (union, not replace) |

**Important**

- Role and team **do not override each other** — permissions are **merged** (union).
- Only **user denials** can revoke something that role or team granted.
- Only **Super Admin** ignores denials (hard bypass in code).

### Team → permission mapping

When a user belongs to an **active** team with module access:

| Team setting | Permissions added |
|--------------|-------------------|
| Read on module | `{module}:read` |
| Write on module | `{module}:write` |
| Write on `bookings` | Also adds `bookings:create` |

Team write does **not** auto-grant `booking_requests:convert` — that must come from the role or a user grant.

Inactive teams and inactive users (`crm_profiles.is_active = false`) are ignored.

---

## Worked example

**User:** Anmol  
**Role:** Employee  
**Team:** Operations (read + write on `bookings`)

| Source | Permissions |
|--------|-------------|
| Role | `bookings:read`, `booking_requests:read` |
| Team | `bookings:read`, `bookings:write`, `bookings:create` |
| User deny | `bookings:create` |

**Effective result**

- `bookings:read` ✓  
- `bookings:write` ✓  
- `bookings:create` ✗ (denied)  
- `booking_requests:read` ✓  

---

## Session & enforcement

### Loading permissions at login

`src/lib/auth/session.ts` → `getAuthSession()`:

1. Load Supabase auth user  
2. Load `crm_profiles` + role  
3. Fetch role permissions, team permissions, user overrides  
4. Merge into `session.permissions`  
5. Set `session.isSuperAdmin` if role key is `super_admin`

### Page access

Routes map to modules in `src/lib/auth/nav-config.ts`.

- `canAccessModule(session, moduleKey)` — true if user has **any** permission starting with `{moduleKey}:`  
- Middleware / layouts call `requireModule()` or `requirePathAccess()` — redirects to `/forbidden` if denied  

### Server actions

`src/lib/auth/permissions.ts`:

- `assertPermission('bookings:write')` — throws if missing (used in server actions)  
- `requirePermission(...)` — redirects to `/forbidden` (used in pages)  
- `getModulePermissions(session, moduleKey)` — returns `{ read, write, create, delete, convert, manage }` for UI gating  

Examples in `src/lib/actions.ts`:

| Action | Permission required |
|--------|---------------------|
| Create manual booking | `bookings:create` |
| Update booking / change status | `bookings:write` |
| Delete booking row | `bookings:delete` |
| Edit booking request fields | `booking_requests:write` |
| Convert request / status buttons | `booking_requests:convert` |
| Manage CRM users | `admin_users:manage` |

### UI gating

Components receive permission flags from server components (e.g. `TablePage`, `BookingRequestDetail`) and hide buttons the user cannot use. **Always enforce on the server too** — UI hiding is not security.

### Database (RLS)

Supabase RLS policies use helpers like `crm_is_staff()` and `crm_is_super_admin()`. Fine-grained `{module}:{action}` checks are primarily enforced in **Next.js server actions**, not in every RLS policy.

Admin writes that bypass RLS use `SUPABASE_SERVICE_ROLE_KEY` via `createRbacDbClient()`.

---

## Admin UI guide

### Roles & Permissions (`/admin/roles`)

- Defines what each **role** can do  
- Uses a permission matrix (modules × actions)  
- System roles: `super_admin`, `admin` (cannot delete `super_admin` permissions in UI)  
- Custom roles can be created for job titles like Employee  

**Affects:** all users assigned that role.

### Teams (`/admin/teams`)

- Create teams and add members  
- Set **read** / **write** per module (operations modules only in team UI)  
- Write on bookings implicitly includes create  

**Affects:** all members of that team (additive on top of role).

### CRM Users → Permissions (`/admin/users`)

- Per-user **grant** or **deny** on any permission  
- **Deny** revokes access from role + team for that user only  
- **Grant** adds access the role/team did not provide  
- Super Admin users cannot be edited here (full access by design)  

**Affects:** one user only. This is the only way to revoke team-granted access for a single person.

### Modules (`/admin/modules`)

- Toggle modules **active/inactive** (dashboard cannot be disabled)  
- Adjust **sort order** for permission matrix and team module lists  
- Does **not** remove permissions from roles — mainly controls which modules appear in team setup  

**Requires:** `admin_modules:manage`

---

## Built-in roles (seed)

### Super Admin

- Role key: `super_admin`  
- Gets every permission in `crm_permissions` (seed)  
- App code short-circuits all permission checks  

### Admin

- Broad operational access: all request/booking tables, legacy read/delete, user/team admin, audit read  
- Does **not** include `admin_roles:manage` or `admin_modules:manage` by default (see migration seed)  

Custom roles start with no permissions until configured in Roles & Permissions.

---

## Booking-specific rules

| Capability | Permission |
|------------|------------|
| View bookings table | `bookings:read` |
| Edit fields / change status dropdown | `bookings:write` |
| Add manual booking | `bookings:create` |
| Delete booking row | `bookings:delete` |
| View booking requests | `booking_requests:read` |
| Edit request fields | `booking_requests:write` |
| Convert to booking + Mark pending/rejected/cancelled | `booking_requests:convert` |
| Delete booking request | `booking_requests:delete` |

Deleting a booking request with linked bookings: deletes bookings first if user has `bookings:delete`, otherwise unlinks if user has `bookings:write`.

---

## Key source files

| File | Responsibility |
|------|----------------|
| `src/lib/auth/permission-resolution.ts` | Merge role + team + overrides |
| `src/lib/auth/session.ts` | Build auth session and permission list |
| `src/lib/auth/permissions.ts` | Check helpers, module access, assert/require |
| `src/lib/auth/nav-config.ts` | Route ↔ module mapping, sidebar nav |
| `src/lib/auth/rbac-actions.ts` | Admin CRUD for roles, teams, modules |
| `src/lib/auth/user-permissions-actions.ts` | User override load/save |
| `src/lib/auth/permission-ui.ts` | Permission matrix labels, module groups |
| `src/components/admin/CrmRolesManager.tsx` | Roles UI |
| `src/components/admin/CrmTeamsManager.tsx` | Teams UI |
| `src/components/admin/UserPermissionsModal.tsx` | User overrides UI |
| `src/components/admin/PermissionMatrix.tsx` | Shared matrix for roles/users |

---

## Flow diagram

```
┌─────────────┐
│  CRM User   │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│    Role     │    │   Team(s)   │
│ permissions │    │ module R/W  │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └────────┬─────────┘
                ▼
         ┌─────────────┐
         │    UNION    │
         │  + grants   │
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │   − denies  │
         └──────┬──────┘
                ▼
    ┌───────────────────────┐
    │ session.permissions   │
    └───────────┬───────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
  Sidebar / UI     Server actions
  (hide buttons)   (assertPermission)

  Super Admin ──────────────────► bypass all checks
```

---

## Environment & setup

1. Run migrations through `007_crm_auth_rbac.sql` (and later migrations) in Supabase SQL Editor.  
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` for admin operations that bypass RLS.  
3. Bootstrap your first Super Admin user per instructions in migration `007`.  
4. Assign roles in **CRM Users**; configure teams and roles in **Administration**.

---

## FAQ

**Can a user have two roles?**  
No. Each profile has exactly one `role_id`. Use teams and user overrides for exceptions.

**If I turn a module Off in Modules admin, do users lose access?**  
Not automatically. Module active/inactive mainly affects team configuration UI. Access is still driven by permissions on roles/teams/overrides.

**How do I remove bookings access from one team member but not the whole team?**  
CRM Users → Permissions → **deny** `bookings:read` / `bookings:write` / etc. for that user.

**Why can someone edit but not convert booking requests?**  
`write` and `convert` are separate permissions. Status/convert buttons require `booking_requests:convert`.

**Where is the permission list stored at runtime?**  
In memory on `AuthSession.permissions`, rebuilt on each request via `getAuthSession()`.
