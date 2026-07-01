# Dazz Drones CRM

A Next.js CRM dashboard for **Dazz Drones** — European drone services. Connects to your existing Supabase database and provides a clean blue-and-white interface to manage all incoming data.

## Features

- **Dashboard overview** — Stats and counts across all Supabase tables
- **Booking Requests** — View, edit, and update status of incoming requests
- **Convert to Booking** — One-click conversion creates a record in the `bookings` table
- **All data tables** — Callback requests, contact forms, career applications, enterprise leads, pilot data, users, and more

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy the example env file and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Find these in **Supabase Dashboard → Project Settings → API**.

### 3. Run the SQL migration

In the Supabase SQL Editor, run the migration at:

```
supabase/migrations/001_create_bookings_table.sql
```

This creates the `bookings` table and adds a `status` column to `booking_requests` if missing.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

- **[RBAC — Roles, Teams & Permissions](docs/RBAC.md)** — How access control works: roles, teams, user overrides, permission merging, and enforcement.

## Booking Workflow

1. New requests appear in **Booking Requests**
2. Click **View** to open a request
3. Edit fields and change status (pending → reviewing → rejected)
4. Click **Convert to Booking** to create a confirmed booking
5. Converted bookings appear in the **Bookings** section

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- Lucide Icons
