# Database Setup Guide

## Issue
The `DATABASE_URL` environment variable is not set, which is required for the application to connect to the PostgreSQL database.

## Solution Options

### Option 1: Run on Replit (Recommended)
This project is designed to run on Replit where the database is automatically provisioned.

1. Open this project on Replit
2. Replit will automatically provision a PostgreSQL database
3. The `DATABASE_URL` will be automatically set in the environment
4. Run: `pnpm --filter @workspace/api-server run dev`

### Option 2: Use a Cloud PostgreSQL Service
Use a cloud database service like Supabase, Neon, or Railway.

1. Create a free PostgreSQL database on one of these services:
   - [Supabase](https://supabase.com) - Free tier available
   - [Neon](https://neon.tech) - Free tier available
   - [Railway](https://railway.app) - Free tier available

2. Get your connection string (DATABASE_URL) from the service
3. Create a `.env` file in the project root:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   SESSION_SECRET=wichi-farms-secret-change-in-prod
   PORT=5000
   ```

4. Run the database schema migration:
   ```bash
   pnpm --filter @workspace/db run push
   ```

5. Start the server:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

### Option 3: Install PostgreSQL Locally
Install PostgreSQL on your Windows machine.

1. Download and install PostgreSQL from https://www.postgresql.org/download/windows/
2. During installation, set a password for the postgres user
3. Create a database:
   ```bash
   createdb agro_quote_system
   ```

4. Create a `.env` file in the project root:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/agro_quote_system
   SESSION_SECRET=wichi-farms-secret-change-in-prod
   PORT=5000
   ```

5. Run the database schema migration:
   ```bash
   pnpm --filter @workspace/db run push
   ```

6. Start the server:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

## Testing Database Connection

After setting up the DATABASE_URL, test the connection:

```bash
# Using the test script
npx tsx scripts/test-db-connection.ts

# Or using Drizzle
pnpm --filter @workspace/db run push
```

## Current Status

❌ `DATABASE_URL` environment variable is NOT set
❌ PostgreSQL is not installed locally
✅ Database schema files exist in `lib/db/src/schema/`
✅ Drizzle ORM configuration is correct
