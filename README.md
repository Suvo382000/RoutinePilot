# RoutinePilot — Smart Academic Scheduling

A full-stack web application for managing class schedules in universities, colleges, and schools.

## Project Structure

```
Routine Management system/
├── frontend/          ← Static HTML/CSS/JS (no build needed)
│   ├── index.html
│   ├── css/style.css
│   └── js/           ← data, auth, admin, teacher, student, app
├── backend/           ← Node.js + Express + MongoDB
│   ├── server.js     ← Entry point (also serves frontend)
│   ├── config/       ← DB connection
│   ├── models/       ← Mongoose schemas
│   ├── routes/       ← API endpoints
│   ├── middleware/   ← JWT auth
│   ├── utils/        ← Constants + Routine Validator
│   └── seed.js       ← Seed initial data
└── README.md
```

## Run Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Steps

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
# Edit backend/.env — set MONGODB_URI

# 3. Seed the database
npm run seed

# 4. Start the server
npm run dev

# 5. Open browser
# http://localhost:5000
```

The server serves both the API (`/api/*`) and the frontend (everything else) from a single port.

## Run Globally (Deploy to Cloud)

### Option 1: Render.com (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a strong random string
   - `NODE_ENV` = production
6. Deploy!

### Option 2: Railway.app (Free tier)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root to `backend`
4. Add env vars (same as above)
5. Railway auto-detects Node.js and deploys

### Option 3: Vercel (Serverless)

Not ideal for this project since it uses MongoDB connections. Use Render or Railway instead.

### MongoDB Atlas (Free Cloud Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster (M0 tier)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all for deployment)
5. Get connection string → paste in `MONGODB_URI`

## Demo Credentials

| Role    | Email            | Password    |
|---------|------------------|-------------|
| Admin   | admin@rms.edu    | admin123    |
| Teacher | rahim@rms.edu    | teacher123  |
| Student | alice@rms.edu    | student123  |

## API Endpoints

| Method | Endpoint                        | Access  |
|--------|---------------------------------|---------|
| POST   | /api/auth/login                 | Public  |
| POST   | /api/auth/signup                | Public  |
| POST   | /api/auth/forgot-password       | Public  |
| POST   | /api/auth/reset-password        | Public  |
| PUT    | /api/auth/change-password       | Auth    |
| GET    | /api/users                      | Admin   |
| GET    | /api/users/teachers             | Auth    |
| PUT    | /api/users/:id/approve          | Admin   |
| GET    | /api/routines                   | Auth    |
| GET    | /api/routines/my                | Auth    |
| POST   | /api/routines/validate          | Admin   |
| POST   | /api/routines                   | Admin   |
| GET    | /api/absent-requests            | Auth    |
| POST   | /api/absent-requests            | Teacher |
| PUT    | /api/absent-requests/:id/approve| Admin   |
| GET    | /api/notifications              | Auth    |
| GET    | /api/constants                  | Public  |
