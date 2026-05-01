# HabitTracker

HabitTracker is a full-stack habit-building application focused on consistency, streaks, and a clean daily workflow. Users can create their own habits, track completions, browse a public habit library, and generate habit ideas with an AI habit coach.

This repository contains both the React frontend and the Express + Prisma backend.

## Demo Highlights

- Create personal habits with schedule, category, target count, status, visibility, and optional end date
- Track completions per current period and build streaks over time
- Browse a public habit library and claim habits into your own dashboard
- View profile stats such as total habits, total completions, longest streak, and productivity score
- Generate habit suggestions from a goal prompt with the Gemini API
- Use a responsive layout with protected app routes and cookie-based authentication

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication with HTTP-only cookies
- Zod validation

### Integrations

- Google Gemini API for AI-generated habit suggestions

## Project Structure

```text
habit-tracker/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── api/
│   │   └── middleware/
│   ├── index.ts
│   └── prisma.ts
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
└── README.md
```

## Current Architecture

The app currently uses a simple and practical model for habits:

- Every habit belongs to a specific user
- A habit can also be marked as `isPublic`
- Public habits appear in the library
- When another user claims a public habit, the backend creates a new habit row for that user
- Streaks and completion history stay personal because completions belong to the claimed user-owned habit, not the original public habit

This means the current library behaves more like a shared catalog of user-created habits than a separate template system.

## Main User Flows

### Authentication

- Register with username, email, and password
- Log in with email and password
- Receive a JWT stored in an HTTP-only cookie
- Access protected app routes only when authenticated

### Habit Management

- Create a habit from the dashboard
- Edit or delete an existing habit
- Mark a habit as public to show it in the library
- Track daily or weekly completions

### Habit Library

- Browse public habits created by other users
- Filter by category and search by name or description
- Claim a habit into your own account
- Claimed habits start with their own streak and completion history

### AI Habit Coach

- Submit a goal prompt
- Receive 3-4 suggested habits in structured JSON
- Turn generated ideas into habits from the dashboard flow

## API Overview

All `/api/habits` and `/api/gemini` routes are protected by authentication.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/profile-summary`

### Habits

- `GET /api/habits` - list public habits for the library
- `GET /api/habits/mine` - list the authenticated user's habits
- `GET /api/habits/:id` - get one user-owned habit
- `POST /api/habits` - create a new habit
- `PATCH /api/habits/:id` - update a habit
- `DELETE /api/habits/:id` - delete a habit
- `POST /api/habits/:id/claim` - claim a public habit into the current user's account

### Habit Completions

- `POST /api/habits/:id/completions` - complete a habit for the current period
- `DELETE /api/habits/:id/completions` - remove the current period completion

### AI

- `POST /api/gemini` - generate habit suggestions from a user goal

## Database Model

The current Prisma schema centers around three main models:

- `User`
- `Habit`
- `HabitCompletion`

Key relationships:

- A `User` has many `Habit` records
- A `Habit` has one owner via `userId`
- A `Habit` has many `HabitCompletion` records
- `currentStreak` is stored on the habit itself

Important note for reviewers:

- Public library items are currently stored in the same `Habit` table as personal habits
- Claiming a habit clones it into a new user-owned habit instead of linking users to a shared template record

## Environment Variables

### Backend

Create `backend/.env` with:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API=your_gemini_api_key
PORT=8080
NODE_ENV=development
```

### Frontend

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:8080
```

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Run database migrations

```bash
cd backend
npx prisma migrate dev
```

### 3. Start the backend

There is currently no dedicated backend dev script in `package.json`, so run:

```bash
cd backend
npx tsx index.ts
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

## What I Focused On

This project demonstrates:

- full-stack TypeScript development
- REST API design with authenticated user flows
- PostgreSQL data modeling with Prisma
- protected frontend routing and auth state management
- responsive UI work in React
- integrating AI-assisted habit generation into a practical product flow

## Current Limitations

This project is still evolving, and the current version intentionally keeps some areas simple:

- public library habits and personal habits share the same table
- claimed habits are cloned rather than linked to a reusable template model
- backend scripts are minimal and could be improved for DX
- automated tests are not set up yet

## Made by Oleksandr Koniukh