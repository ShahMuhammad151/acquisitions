# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Node.js/Express REST API for user acquisition and authentication. Built with a layered MVC architecture using Drizzle ORM, PostgreSQL (Neon Serverless), JWT authentication, and Zod validation.

## Development Commands

### Server
- `npm run dev` - Start development server with hot reload (port 3000)

### Database (Drizzle ORM)
- `npm run db:generate` - Generate SQL migrations from schema changes in `src/models/*.js`
- `npm run db:migrate` - Apply pending migrations to database
- `npm run db:studio` - Open Drizzle Studio (visual database browser)

**Migration Workflow:** Modify schema → `db:generate` → review SQL in `drizzle/` → `db:migrate`

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format:check` - Check Prettier formatting
- `npm run format` - Auto-format with Prettier

**Linting Rules:** 2-space indent, single quotes, semicolons required, unix line endings. Unused vars starting with `_` are ignored.

## Architecture

### Layered Structure
```
Routes → Controllers → Services → Database
  ↓         ↓            ↓           ↓
Define   Validate   Business    Drizzle ORM
endpoints  input      logic     (PostgreSQL)
```

### Import Aliases (configured in package.json)
- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#models/*` → `./src/models/*`
- `#services/*` → `./src/services/*`
- `#middlewares/*` → `./src/middlewares/*`
- `#routes/*` → `./src/routes/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

**Always use these aliases** instead of relative paths for consistency.

### Core Components

**Entry Point:** `src/index.js` → `src/server.js` (loads env, starts Express server)

**App Setup:** `src/app.js` configures middleware stack (helmet, cors, morgan→winston, cookieParser)

**Database:** `src/config/database.js` exports `db` (Drizzle) and `sql` (Neon client). Schema in `src/models/*.js` uses Drizzle's pgTable syntax.

**Auth Flow (Sign-Up):**
1. Route: `POST /api/auth/sign-up` → `auth.route.js`
2. Controller: `auth.controller.js` validates with Zod → `signUpSchema`
3. Service: `auth.service.js` checks duplicates, hashes password (bcrypt), inserts user
4. Returns JWT (1d expiry) as httpOnly cookie (15min maxAge) + user data (no password)

**Utilities:**
- `jwt.js` - Sign/verify JWT tokens (uses JWT_SECRET from env)
- `cookies.js` - Secure cookie helpers (httpOnly, sameSite:Strict, secure in production)
- `format.js` - Format Zod validation errors for API responses
- `logger.js` - Winston logger (console in dev, file in production at `logs/`)

### Database Schema Patterns

Models use Drizzle ORM syntax:
```javascript
import {pgTable, serial, varchar, timestamp} from 'drizzle-orm/pg-core';

export const tableName = pgTable('table_name', {
  id: serial('id').primaryKey(),
  // ... columns
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

Query patterns:
```javascript
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

// Select with where
await db.select().from(users).where(eq(users.email, email)).limit(1);

// Insert with returning
await db.insert(users).values({...}).returning({id: users.id, name: users.name});
```

### Adding New Features

**New API Endpoint:**
1. Define validation schema in `src/validations/*.validation.js` (Zod)
2. Create controller in `src/controllers/*.controller.js` (validate input, handle response)
3. Create service in `src/services/*.service.js` (business logic, DB ops)
4. Add route in `src/routes/*.route.js` or existing route file
5. Import and mount route in `src/app.js` if new route file

**New Database Table:**
1. Create model in `src/models/*.model.js` using Drizzle syntax
2. Run `npm run db:generate` to create migration
3. Review generated SQL in `drizzle/` directory
4. Run `npm run db:migrate` to apply

**New Middleware:**
1. Create in `src/middlewares/*.js` (currently empty directory)
2. Export as function: `export const middlewareName = (req, res, next) => {...}`
3. Import and use in routes: `router.post('/path', middlewareName, controller)`

## Current State & Known Gaps

**Implemented:**
- User sign-up with validation, password hashing, JWT generation
- Health check endpoints: `/health` and `/`
- Security middleware (helmet, cors)
- Structured logging (Winston)

**Not Yet Implemented:**
- Sign-in endpoint (stub exists at `POST /api/auth/sign-in`)
- Sign-out endpoint (stub exists at `POST /api/auth/sign-out`)
- JWT verification middleware for protected routes
- Refresh token mechanism (JWT expires 1d, cookie 15min - mismatch)
- Rate limiting
- Global error handler middleware
- Tests (framework configured in ESLint but no tests exist)

**When adding protected routes:** Create auth middleware in `src/middlewares/auth.js` that verifies JWT from cookie using `jwttoken.verify()`.

## Configuration

**Environment Variables (.env):**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Winston log level (info/debug/error)
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `JWT_SECRET` - Secret for JWT signing (MUST be set in production)

**Database:** Neon Serverless PostgreSQL configured in `drizzle.config.js`. Schema in `src/models/*.js`, migrations in `drizzle/` directory.

## Code Style

- ES Modules (type: "module" in package.json)
- Async/await for all async operations
- 2-space indentation, single quotes, semicolons required
- Prefer const over let, never use var
- Object shorthand and arrow functions preferred
- Unused params prefix with underscore: `(req, _res, next)`
- All errors logged with Winston logger before throwing/returning
