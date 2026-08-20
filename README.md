# ReachInbox Email Scheduler

A full-stack email scheduling system built as part of the ReachInbox Software Development Intern assignment.

The application allows users to authenticate using Google, compose and schedule emails, upload recipient lists through CSV files, and monitor scheduled and sent emails through a dashboard.

---

## 🚀 Live Demo

### Frontend
https://reachinbox-frontend-i1wo.onrender.com

### Backend
https://reachinbox-backend-dfy9.onrender.com

---

## ✨ Features

### Authentication
- Google OAuth authentication
- User profile information
- User name, email and avatar displayed in dashboard
- Logout functionality

### Email Scheduling
- Schedule individual emails
- Schedule multiple emails using CSV upload
- Configure:
  - Start time
  - Delay between emails
  - Hourly email limit
- Emails are persisted in PostgreSQL
- Scheduled emails are added to BullMQ as delayed jobs

### Email Processing
- BullMQ + Redis based job queue
- Worker-based email processing
- Ethereal Email SMTP for testing
- Configurable worker concurrency
- Configurable delay between email sends
- Configurable hourly sending limit
- Job IDs are based on database email IDs to support idempotent processing

### Dashboard
- Scheduled emails view
- Sent emails view
- Email status
- Scheduled timestamp
- Sent timestamp
- Loading and empty states
- Error handling

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │  React + TypeScript │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │    Express API      │
                    │     TypeScript      │
                    └───────┬─────┬───────┘
                            │     │
                    ┌───────┘     └────────┐
                    ▼                      ▼
             ┌─────────────┐        ┌─────────────┐
             │ PostgreSQL  │        │    Redis     │
             │   + Prisma  │        │   + BullMQ   │
             └─────────────┘        └──────┬──────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ BullMQ Worker   │
                                  │                 │
                                  │ Rate limiting   │
                                  │ Concurrency     │
                                  │ Delay handling  │
                                  └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ Ethereal SMTP   │
                                  └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- `@react-oauth/google`

### Backend

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- BullMQ
- Redis
- Nodemailer
- Ethereal Email
- Multer

### Infrastructure

- Docker
- Render
- PostgreSQL
- Redis

---

## 📁 Project Structure

```text
reachinbox-scheduler/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── queue/
│   │   ├── worker/
│   │   ├── lib/
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── App.tsx
│   │
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# ⚙️ Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/Krishika-Garg/reachinbox-scheduler.git
cd reachinbox-scheduler
```

---

# 🐘 Backend Setup

Go to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
REDIS_URL=your_redis_connection_string

GOOGLE_CLIENT_ID=your_google_client_id

ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASSWORD=your_ethereal_password

MAX_EMAILS_PER_HOUR=200
EMAIL_SEND_DELAY_SECONDS=2
WORKER_CONCURRENCY=5
```

Generate Prisma Client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Start the backend:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

---

# 🔴 Redis and PostgreSQL

For local development, Redis and PostgreSQL can be started using Docker Compose.

From the project root:

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

Stop containers:

```bash
docker compose down
```

---

# ⚡ BullMQ Worker

The email worker is responsible for processing scheduled jobs from Redis.

Start the worker using:

```bash
npm run worker
```

The worker:

1. Receives a scheduled job from BullMQ.
2. Loads the email from PostgreSQL.
3. Checks the current email status.
4. Applies rate limiting and delay rules.
5. Sends the email through Ethereal SMTP.
6. Updates the email status in PostgreSQL.
7. Prevents duplicate processing of already-sent emails.

---

# 💻 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

# 🔐 Google OAuth Setup

Google OAuth is implemented using Google's Identity Services.

Create a Google OAuth Client ID and configure the following authorized JavaScript origins:

```text
http://localhost:5173
```

and the deployed frontend:

```text
https://reachinbox-frontend-i1wo.onrender.com
```

The same Client ID is configured in the frontend and backend environment variables.

---

# 📧 Ethereal Email

The application uses Ethereal Email as a fake SMTP provider.

Ethereal provides a test inbox where emails can be inspected without sending real emails to external recipients.

Configure the SMTP credentials in:

```text
backend/.env
```

Example:

```env
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASSWORD=your_ethereal_password
```

---

# 📅 Scheduling Flow

When a user schedules an email:

```text
User
 │
 ▼
React Compose UI
 │
 ▼
POST /api/emails/schedule
 │
 ▼
Express API
 │
 ├── Validate request
 │
 ├── Store email in PostgreSQL
 │
 └── Create delayed BullMQ job
 │
 ▼
Redis
 │
 │       scheduled time reached
 ▼
BullMQ Worker
 │
 ├── Check email status
 ├── Apply rate limiting
 ├── Apply delay
 ├── Send through Ethereal
 └── Update PostgreSQL
```

No cron jobs are used.

Scheduling is handled using BullMQ delayed jobs backed by Redis.

---

# 📊 Bulk Scheduling

Users can upload a CSV containing email addresses.

The backend:

1. Receives the uploaded CSV.
2. Extracts email addresses.
3. Creates an individual database record for each recipient.
4. Calculates the scheduled time for each email.
5. Creates an individual BullMQ delayed job.
6. Processes each job through the worker.

Example:

```text
Start Time:       10:00
Delay:            2 seconds

Email 1 → 10:00:00
Email 2 → 10:00:02
Email 3 → 10:00:04
Email 4 → 10:00:06
...
```

---

# 🚦 Rate Limiting

The scheduler supports configurable email rate limiting.

Example:

```env
MAX_EMAILS_PER_HOUR=200
```

This prevents the system from attempting to send unlimited emails within a single hour.

The delay between individual emails is also configurable:

```env
EMAIL_SEND_DELAY_SECONDS=2
```

Worker concurrency can be configured using:

```env
WORKER_CONCURRENCY=5
```

This allows multiple jobs to be processed concurrently while still applying the configured sending constraints.

---

# 🔄 Persistence and Restart Handling

Email records are persisted in PostgreSQL.

Scheduled jobs are persisted by Redis/BullMQ.

Therefore, restarting the backend process does not require recreating future scheduled jobs.

The worker reconnects to Redis and continues processing pending jobs.

The database is treated as the source of truth for email status.

---

# 🛡️ Idempotency

Each email receives a unique database ID.

That ID is also used as the BullMQ job ID:

```text
Database Email ID
       │
       ▼
BullMQ Job ID
```

Before sending, the worker checks the current email status.

If an email has already been marked as sent, the worker does not send it again.

This prevents duplicate email sends when a job is retried or processed again.

---

# 🔌 API Endpoints

## Health Check

```http
GET /
```

Returns:

```text
ReachInbox backend is running!
```

---

## Google Authentication

```http
POST /api/auth/google
```

Request:

```json
{
  "credential": "GOOGLE_ID_TOKEN"
}
```

---

## Get Emails

```http
GET /api/emails
```

Returns scheduled and processed email records.

---

## Schedule Email

```http
POST /api/emails/schedule
```

Example:

```json
{
  "recipient": "test@example.com",
  "subject": "Test Email",
  "body": "Hello from ReachInbox Scheduler",
  "scheduledAt": "2026-08-20T18:00:00.000Z",
  "delaySeconds": 2,
  "hourlyLimit": 200
}
```

---

## Bulk Schedule

```http
POST /api/emails/bulk-schedule
```

Uses `multipart/form-data` with:

```text
subject
body
startTime
delayBetweenEmails
hourlyLimit
file
```

---

# 🧪 Testing

The application can be tested using:

- Browser
- Postman
- Ethereal Email
- PostgreSQL
- Redis/BullMQ

Recommended test flow:

1. Start PostgreSQL and Redis.
2. Start the backend.
3. Start the BullMQ worker.
4. Start the frontend.
5. Login using Google.
6. Open Compose.
7. Enter an email.
8. Select a future schedule time.
9. Schedule the email.
10. Verify it appears in Scheduled Emails.
11. Wait for the BullMQ job to execute.
12. Verify the email appears as sent.
13. Check the Ethereal inbox.

---

# 🔁 Restart Scenario

The scheduler is designed to persist scheduled jobs.

To test persistence:

1. Schedule an email for a future time.
2. Stop the backend.
3. Keep Redis and PostgreSQL running.
4. Start the backend again.
5. Start the worker again.
6. The pending BullMQ job remains available.
7. The worker processes the email when its scheduled time is reached.


---

# 🌐 Deployment

The application is deployed using Render.

Frontend:

https://reachinbox-frontend-i1wo.onrender.com

Backend:

https://reachinbox-backend-dfy9.onrender.com

Environment variables are configured separately in the deployment environment and are not committed to the repository.

---

# 📌 Assumptions and Trade-offs

- Ethereal Email is used instead of a production SMTP provider because the assignment requires fake SMTP.
- Google OAuth is used as the authentication mechanism.
- PostgreSQL stores persistent email and user state.
- Redis provides persistent BullMQ job storage.
- BullMQ delayed jobs are used instead of cron jobs.
- Rate limits and delays are configurable through environment variables.
- The dashboard focuses on the functionality required by the assignment rather than production-scale analytics.

