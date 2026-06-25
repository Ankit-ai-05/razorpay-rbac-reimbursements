# Reimbursements Management System

A production-grade REST API for managing employee reimbursements with a 4-tier Role-Based Access Control (RBAC) system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 20.10.2 |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Sequelize v6 |
| Auth | JWT + HTTP-only Cookies |
| Password | bcrypt (cost factor 12) |
| Validation | Joi |
| Testing | Jest + Supertest |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting |

## Architecture

```
src/
├── config/                # DB config (dev/test/prod), JWT config
├── models/                # Sequelize models (User, EmployeeManager, Reimbursement, ReimbursementApproval)
├── migrations/            # Sequelize CLI migration files
├── seeders/               # CFO seed account
├── repositories/          # Data access layer (no business logic)
├── services/              # Business logic layer
├── middleware/            # authenticate, authorize, validate, errorHandler
├── modules/               # Feature modules: auth, roles, employees, reimbursements
│   └── [feature]/
│       ├── *.controller.js
│       └── *.validation.js
├── routes/                # Centralized Express router
└── utils/                 # AppError, response helpers, logger, constants
tests/
├── unit/                  # Service layer tests (mocked repositories)
├── integration/           # Full HTTP tests (real DB)
└── helpers/               # Test DB setup
```

## Roles

| Role | Abbreviation | Capabilities |
|------|-------------|-------------|
| Employee | `EMP` | Register, Login, Create reimbursement, View own reimbursements |
| Reporting Manager | `RM` | View assigned employees, Approve/Reject pending reimbursements |
| Accounts Payable Executive | `APE` | Approve/Reject RM-approved reimbursements |
| Chief Financial Officer | `CFO` | Assign roles, Manage employee-manager assignments, View all data |

## Getting Started

### Prerequisites

- Node.js >= 20.10.2
- PostgreSQL running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Create the database

```sql
CREATE DATABASE reimbursements_db;
CREATE DATABASE reimbursements_db_test;  -- for tests
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Seed the CFO account

```bash
npm run db:seed
```

Default CFO credentials:
- **Email:** `cfo@org.com`
- **Password:** `CFO#ORG@April2026`

### 6. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:3000`

## API & Schema Reference

- **[API Documentation](./API_DOCS.md)** — Complete API documentation with endpoints, request/response examples, and error codes.
- **[Database Schema](./SCHEMA.md)** — Detailed database schema, including tables, constraints, and an Entity Relationship Diagram (ERD).

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `reimbursements_db` |
| `DB_USER` | DB username | `postgres` |
| `DB_PASSWORD` | DB password | — |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | Token expiry | `24h` |
| `COOKIE_MAX_AGE_MS` | Cookie max age | `86400000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `ALLOWED_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## Approval Flow

```
EMP creates reimbursement (PENDING)
         │
         ▼
    RM reviews
    ├── APPROVED → APE reviews
    │              ├── APPROVED → Final status: APPROVED
    │              └── REJECTED → Final status: REJECTED
    └── REJECTED → Final status: REJECTED
```

## Security

- **HTTP-only cookies** — JWT never accessible to JavaScript (XSS protection)
- **bcrypt cost factor 12** — Strong password hashing
- **Helmet** — HTTP security headers
- **Rate limiting** — 100 requests per 15 minutes
- **Input validation** — Joi schemas on all endpoints
- **SQL injection** — Prevented by Sequelize parameterized queries
- **Vague auth errors** — User enumeration prevention on login

## Design Decisions

1. **Repository Pattern** — DB queries isolated in repository classes, services never touch Sequelize directly
2. **Service Layer** — All business logic (role checks, approval flow, status computation) lives in services
3. **Singleton instances** — Repositories and services exported as singletons for simple DI without a container
4. **AppError class** — Discriminates operational (expected) errors from programmer bugs
5. **Role-aware views** — Single `GET /reimbursements` endpoint returns different data per role (no role leakage)
6. **Audit trail** — Every approval decision recorded with actor identity and timestamp
