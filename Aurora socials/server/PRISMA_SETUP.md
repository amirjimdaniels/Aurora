# Prisma Setup Guide for Aurora Social

## Database: PostgreSQL

Aurora Social uses PostgreSQL for reliable, cross-platform database consistency.

## Quick Start

### Option 1: Docker (Recommended)

1. **Start PostgreSQL container:**
   ```bash
   cd server
   docker-compose up -d
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL** on your system:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql`

2. **Create database:**
   ```sql
   CREATE DATABASE aurora_social;
   ```

3. **Update `.env`** with your connection string:
   ```
   DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/aurora_social?schema=public"
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate dev
   ```

### Option 3: Cloud PostgreSQL (Supabase, Railway, Render, etc.)

1. Create a PostgreSQL database on your preferred provider
2. Copy the connection string
3. Update `.env` with the connection string
4. Run migrations: `npx prisma migrate dev`

## Environment Setup

Copy `.env.example` to `.env` and update the DATABASE_URL:
```bash
cp .env.example .env
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma studio` | Open database browser |
| `npx prisma db seed` | Run seed script |
| `npx prisma db push` | Push schema changes without migrations |

## Seeding the Database

```bash
npx prisma db seed
```

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL is running
- Check that the port 5432 is not blocked
- Verify your connection string credentials

### Migration Failed
- Try `npx prisma migrate reset` to reset the database
- Check for syntax errors in schema.prisma

### Docker Issues
- Ensure Docker Desktop is running
- Try `docker-compose down && docker-compose up -d`

## Legacy SQLite Setup (Not Recommended)

If you need to use SQLite for development:
1. Change `provider = "postgresql"` to `provider = "sqlite"` in `schema.prisma`
2. Update `.env`: `DATABASE_URL="file:./dev.db"`
3. Run `npx prisma migrate dev`
