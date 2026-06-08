# Library App — Setup Guide

## Prerequisites

Install these before starting:

1. **Node.js 20 LTS** — https://nodejs.org
2. **PostgreSQL 16** — https://www.postgresql.org/download/windows/

---

## Step-by-Step Setup

### 1. Install dependencies

```bash
cd library-app
npm install
```

### 2. Create your database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE library_db;
```

### 3. Configure environment variables

```bash
# Copy the example file
copy .env.example .env
```

Then edit `.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — any long random string (run `openssl rand -base64 32` in Git Bash)

Example `.env`:
```
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/library_db"
NEXTAUTH_SECRET="abc123xyz..."
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Seed the admin account

```bash
npm run db:seed
```

This creates: `admin@library.local` / `Admin@1234`

### 6. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Adding Books

You have two options:

**Option A — Prisma Studio (GUI)**
```bash
npm run db:studio
```
Opens a visual browser at http://localhost:5555 — click "Book" → "Add record"

**Option B — Admin API** (use Postman or curl)
```bash
curl -X POST http://localhost:3000/api/admin/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "9780132350884",
    "category": "Computer Science",
    "publisher": "Prentice Hall",
    "year": 2008,
    "totalCopies": 3,
    "description": "A handbook of agile software craftsmanship."
  }'
```

---

## Member Flow

1. User visits `/membership/apply` and fills the form
2. Admin logs in at `/login` (admin@library.local / Admin@1234)
3. Admin visits `/admin` → clicks "Approve" next to the member
4. Member can now sign in at `/login` with their email
   - Default password is set during seed; for new members, set it manually via Prisma Studio

---

## Project Structure

```
app/
  page.tsx              — Landing page with 3D hero
  search/               — Public book search
  book/[id]/            — Book detail page
  membership/apply/     — Membership application form
  membership/rules/     — Library rules page
  login/                — Sign in page
  dashboard/            — Member account (loans, holds)
  dashboard/history/    — Borrowing history
  admin/                — Admin member management
  api/                  — All backend API routes

components/
  hero/                 — Three.js 3D floating books
  search/               — BookCard component
  layout/               — Navbar + Footer

lib/
  db.ts                 — Prisma client singleton
  auth.ts               — NextAuth config
  utils.ts              — Helpers (dates, fines, IDs)

prisma/
  schema.prisma         — Database schema
  seed.ts               — Admin account seeder
```
