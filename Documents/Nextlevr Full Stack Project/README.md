# NexLevr Client & Campaign Management Platform

A production-quality full-stack SaaS platform for managing clients, marketing campaigns, leads, tasks, and performance analytics from a single dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Screenshots](#screenshots)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Environment Variables](#environment-variables)
9. [Local Setup](#local-setup)
10. [Database Setup](#database-setup)
11. [Running the Frontend](#running-the-frontend)
12. [Running the Backend](#running-the-backend)
13. [Deployment](#deployment)
14. [Future Improvements](#future-improvements)

---

## Project Overview

NexLevr is a role-based SaaS application designed for marketing agencies and business development teams. It provides a centralized workspace to track clients, run multi-channel campaigns, manage a CRM-style lead pipeline, assign and monitor tasks, and visualize business performance through real-time analytics.

The platform is built with a modern TypeScript stack, uses PostgreSQL as the single source of truth, and enforces permissions on both the frontend and backend.

### User Roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Manage users, clients, view all campaigns, view analytics, manage system settings |
| **Manager** | Manage assigned clients, create/manage campaigns, assign tasks, view campaign analytics |
| **Team Member** | View assigned clients, work on assigned tasks, update task status, view relevant campaigns |

---

## Features

### Authentication & Authorization
- JWT-based authentication with secure password hashing (bcrypt)
- Registration, login, logout, and current-user endpoints
- Protected frontend routes and backend middleware
- Role-based access control (RBAC) on both client and server

### Dashboard
- Real-time KPI cards: total clients, active campaigns, leads generated, pending tasks
- Campaign conversion rate, recent activities, and notifications
- Interactive charts: campaign performance, lead acquisition, task completion

### Client Management
- Create, edit, delete, and view clients
- Search, filter, and view client campaign history
- Client statuses: Active, Inactive, Prospect

### Campaign Management
- Full CRUD for marketing campaigns
- Campaign types: Social Media, SEO, Email Marketing, Paid Advertising, Content Marketing
- Campaign statuses: Draft, Planned, Active, Paused, Completed
- Filtering, searching, and status transitions

### Lead Management
- CRM-style lead pipeline with Kanban board
- Lead statuses: New, Contacted, Qualified, Proposal, Converted, Lost
- Drag-and-drop style status updates
- Source tracking and value estimation

### Task Management
- Task list and Kanban board views
- Priorities: Low, Medium, High, Urgent
- Statuses: Todo, In Progress, Review, Completed
- Search, filters, due-date indicators, and pagination

### Analytics
- Leads generated, converted, and conversion rate
- Campaign performance, client growth, revenue/value generated
- Task completion metrics and monthly trends
- Interactive Recharts visualizations
- Filterable by date range, client, and campaign

### Activity & Notifications
- Activity timeline for major entity changes
- In-app notification system with read/unread states

---

## Tech Stack

### Frontend
- **Next.js 16** with App Router
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **shadcn/ui** components
- **Lucide React** icons
- **Recharts** data visualization
- **Axios** HTTP client

### Backend
- **Node.js 20**
- **Express.js**
- **TypeScript** (strict mode)
- **Prisma ORM**
- **PostgreSQL 15**
- **JWT** authentication
- **bcryptjs** password hashing
- **Zod** validation
- **Helmet** & **express-rate-limit** security

### DevOps & Tooling
- **Docker** & **Docker Compose**
- **npm workspaces**
- **Git / GitHub**

---

## Architecture

### High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Browser"]
    end

    subgraph NextJS["Frontend Container"]
        App["Next.js 16 App Router"]
        UI["React + Tailwind + shadcn/ui"]
        Charts["Recharts"]
    end

    subgraph Express["Backend Container"]
        API["Express REST API"]
        Auth["JWT Auth + RBAC"]
        Validators["Zod Validators"]
        Services["Service Layer"]
        Prisma["Prisma ORM"]
    end

    subgraph Data["Data Layer"]
        Postgres[("PostgreSQL 15")]
    end

    Browser -->|HTTPS| App
    App -->|API Calls| API
    API --> Auth
    API --> Validators
    API --> Services
    Services --> Prisma
    Prisma --> Postgres
```

### Request Flow

```mermaid
sequenceDiagram
    participant U as User/Browser
    participant F as Next.js Frontend
    participant A as Express API
    participant M as Auth/RBAC Middleware
    participant V as Zod Validator
    participant S as Service
    participant P as Prisma
    participant DB as PostgreSQL

    U->>F: Interact with UI
    F->>A: HTTP request + JWT
    A->>M: Verify token & role
    M->>V: Validate input
    V->>S: Execute business logic
    S->>P: Query/transaction
    P->>DB: SQL (parameterized)
    DB-->>P: Result
    P-->>S: Typed data
    S-->>A: Response
    A-->>F: JSON response
    F-->>U: Rendered UI
```

### Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       ├── validators/
│       ├── app.ts
│       └── server.ts
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   └── next.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Screenshots

> Screenshots of the application should be added here once the UI is rendered in a browser. Recommended captures:
>
> - Login / Register pages
> - Dashboard with KPI cards and charts
> - Client list and detail views
> - Campaign management page
> - Lead Kanban pipeline
> - Task list / Kanban board
> - Analytics page
> - Admin user management
> - Notifications dropdown

---

## Database Schema

The PostgreSQL database is managed by Prisma. Below is the entity-relationship overview:

```mermaid
erDiagram
    USER ||--o{ LEAD : assigned
    USER ||--o{ TASK : assigned
    USER ||--o{ ACTIVITY : performs
    USER ||--o{ NOTIFICATION : receives
    CLIENT ||--o{ CAMPAIGN : owns
    CLIENT ||--o{ TASK : has
    CAMPAIGN ||--o{ LEAD : generates
    CAMPAIGN ||--o{ TASK : has

    USER {
        uuid id PK
        string email UK
        string passwordHash
        string name
        enum role
        boolean disabled
        datetime createdAt
        datetime updatedAt
    }

    CLIENT {
        uuid id PK
        string name
        string company
        string email
        string phone
        string industry
        string website
        enum status
        string notes
        datetime createdAt
        datetime updatedAt
    }

    CAMPAIGN {
        uuid id PK
        string name
        uuid clientId FK
        string description
        enum type
        datetime startDate
        datetime endDate
        decimal budget
        enum status
        string targetAudience
        string goals
        datetime createdAt
        datetime updatedAt
    }

    LEAD {
        uuid id PK
        string name
        string email
        string phone
        string company
        string source
        uuid campaignId FK
        enum status
        decimal value
        uuid assignedUserId FK
        string notes
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        uuid id PK
        string title
        string description
        uuid assignedUserId FK
        uuid clientId FK
        uuid campaignId FK
        enum priority
        datetime dueDate
        enum status
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITY {
        uuid id PK
        uuid userId FK
        string action
        string entityType
        uuid entityId
        json metadata
        datetime createdAt
    }

    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string title
        string message
        boolean read
        string type
        uuid relatedId
        datetime createdAt
    }
```

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | `ADMIN`, `MANAGER`, `TEAM_MEMBER` |
| `ClientStatus` | `ACTIVE`, `INACTIVE`, `PROSPECT` |
| `CampaignType` | `SOCIAL_MEDIA`, `SEO`, `EMAIL_MARKETING`, `PAID_ADVERTISING`, `CONTENT_MARKETING` |
| `CampaignStatus` | `DRAFT`, `PLANNED`, `ACTIVE`, `PAUSED`, `COMPLETED` |
| `LeadStatus` | `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `CONVERTED`, `LOST` |
| `TaskPriority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `TaskStatus` | `TODO`, `IN_PROGRESS`, `REVIEW`, `COMPLETED` |

---

## API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |
| POST | `/auth/logout` | Protected | Logout current user |
| GET | `/auth/me` | Protected | Get current authenticated user |

### Users (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List all users |
| POST | `/users` | Admin | Create a user |
| GET | `/users/:id` | Admin | Get user by ID |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Disable user |

### Clients

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/clients` | Protected | List/search/filter clients |
| GET | `/clients/industries` | Protected | Get distinct industries |
| GET | `/clients/:id` | Protected | Get client details |
| GET | `/clients/:id/campaigns` | Protected | Get client campaign history |
| POST | `/clients` | Admin/Manager | Create client |
| PUT | `/clients/:id` | Admin/Manager | Update client |
| DELETE | `/clients/:id` | Admin/Manager | Delete client |

### Campaigns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/campaigns` | Protected | List/search/filter campaigns |
| GET | `/campaigns/my` | Protected | Get campaigns for assigned clients |
| GET | `/campaigns/:id` | Protected | Get campaign details |
| POST | `/campaigns` | Admin/Manager | Create campaign |
| PUT | `/campaigns/:id` | Admin/Manager | Update campaign |
| DELETE | `/campaigns/:id` | Admin/Manager | Delete campaign |

### Leads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/leads` | Protected | List/search/filter leads |
| GET | `/leads/pipeline` | Protected | Get leads grouped by status |
| GET | `/leads/sources` | Protected | Get distinct lead sources |
| GET | `/leads/:id` | Protected | Get lead details |
| POST | `/leads` | Admin/Manager | Create lead |
| PUT | `/leads/:id` | Admin/Manager | Update lead |
| PATCH | `/leads/:id/status` | Admin/Manager | Update lead status |
| DELETE | `/leads/:id` | Admin/Manager | Delete lead |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tasks` | Protected | List/search/filter tasks |
| GET | `/tasks/my` | Protected | Get tasks assigned to current user |
| GET | `/tasks/stats` | Protected | Get task statistics |
| GET | `/tasks/:id` | Protected | Get task details |
| POST | `/tasks` | Admin/Manager | Create task |
| PUT | `/tasks/:id` | Admin/Manager | Update task |
| PATCH | `/tasks/:id/status` | Admin/Manager | Update task status |
| DELETE | `/tasks/:id` | Admin/Manager | Delete task |

### Analytics (Admin/Manager)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/dashboard` | Admin/Manager | Dashboard KPIs |
| GET | `/analytics/campaigns` | Admin/Manager | Campaign performance |
| GET | `/analytics/leads` | Admin/Manager | Lead trends |
| GET | `/analytics/revenue` | Admin/Manager | Revenue/value stats |
| GET | `/analytics/clients/growth` | Admin/Manager | Client growth over time |
| GET | `/analytics/leads/status` | Admin/Manager | Lead status distribution |

### Activities

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/activities` | Protected | Get recent activity timeline |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Protected | Get user notifications |
| PUT | `/notifications/:id/read` | Protected | Mark notification as read |
| PUT | `/notifications/read-all` | Protected | Mark all notifications as read |

### Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Success with message:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message",
  "details": [ { "field": "email", "message": "Invalid email address" } ]
}
```

---

## Environment Variables

Create a `.env` file at the project root by copying `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `nexlevr` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `nexlevr_dev_password` |
| `POSTGRES_DB` | PostgreSQL database name | `nexlevr` |
| `POSTGRES_PORT` | PostgreSQL host port | `5432` |
| `DATABASE_URL` | Prisma connection string | `postgresql://nexlevr:nexlevr_dev_password@localhost:5432/nexlevr?schema=public` |
| `JWT_SECRET` | Secret key for JWT signing | `change-this-in-production` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Public API base URL for frontend | `http://localhost:5000/api` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

> **Security note:** Never commit `.env` or any secret to Git. The `.gitignore` file already excludes environment files.

---

## Local Setup

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose (optional, for PostgreSQL)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nexlevr-platform
```

### 2. Install Dependencies

```bash
npm install
```

This installs root workspace dependencies and all dependencies for `frontend` and `backend` via npm workspaces.

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set strong values for `JWT_SECRET` and `POSTGRES_PASSWORD`.

---

## Database Setup

### Option A: PostgreSQL via Docker Compose (Recommended)

Start the PostgreSQL container:

```bash
npm run db:up
```

### Option B: Existing PostgreSQL Instance

Update `DATABASE_URL` in `.env` to point to your existing database.

### Run Migrations

```bash
npm run db:migrate
```

### Seed Development Data

```bash
npm run db:seed
```

This creates:
- 3 users with different roles
- 5 clients
- 8 campaigns
- 20 leads
- 15 tasks
- Activities and notifications

### Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@nexlevr.com` | `NexLevr@2025` | Admin |
| `manager@nexlevr.com` | `NexLevr@2025` | Manager |
| `team@nexlevr.com` | `NexLevr@2025` | Team Member |

---

## Running the Frontend

### Development

```bash
npm run dev:frontend
```

The frontend will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build:frontend
npm run start --workspace=frontend
```

---

## Running the Backend

### Development

```bash
npm run dev:backend
```

The backend API will be available at `http://localhost:5000`.

Health check endpoint: `GET http://localhost:5000/`

### Production Build

```bash
npm run build:backend
npm run start
```

---

## Deployment

### Docker Compose (Full Stack)

Build and start all services (PostgreSQL, backend, frontend):

```bash
docker-compose up --build -d
```

Access the application:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- API docs base: `http://localhost:5000/api`

Stop all services:

```bash
docker-compose down
```

To remove volumes (WARNING: deletes database data):

```bash
docker-compose down -v
```

### Production Checklist

- [ ] Generate a strong, unique `JWT_SECRET`
- [ ] Use strong PostgreSQL credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` and `CORS_ORIGIN` to your production domain
- [ ] Update `NEXT_PUBLIC_API_URL` to your production API URL
- [ ] Run migrations before starting the backend
- [ ] Use HTTPS in production
- [ ] Do not commit `.env` to version control
- [ ] Set up automated backups for PostgreSQL

### Cloud Deployment Notes

The frontend Dockerfile produces a standalone Next.js output suitable for platforms like Vercel, Railway, Render, or any container orchestrator.

The backend Dockerfile produces a lightweight Node.js image with compiled TypeScript and Prisma client. Ensure the `DATABASE_URL` and `JWT_SECRET` are injected as environment variables in your hosting platform.

---

## Future Improvements

- **Email notifications** for task assignments and campaign status changes
- **File uploads** for client assets and campaign creatives (S3 / Cloudinary)
- **Advanced reporting** with PDF export and scheduled email reports
- **Two-factor authentication (2FA)** for enhanced account security
- **Audit logging** with immutable event streams
- **WebSocket integration** for real-time notifications and live dashboard updates
- **Multi-tenancy** support for agency sub-accounts
- **Calendar integration** for campaign timelines and task due dates
- **Mobile-responsive PWA** for field teams
- **End-to-end testing** with Playwright
- **API rate limiting tuning** per user role and endpoint

---

## License

This project is built for educational and portfolio purposes as part of the NexLevr Full Stack Developer internship.
