# 📝 Notebase — Notes App with React + Redis

A full-stack notes app with a React frontend and Express/Redis backend.

## Tech Stack

| Layer    | Tech                        |
|----------|-----------------------------|
| Frontend | React 18, CSS               |
| Backend  | Node.js, Express            |
| Database | Redis (via ioredis)         |

## Data Model (Redis)

Each note is stored as a **Redis Hash**:

```
note:{uuid}   →   { id, title, content, createdAt, updatedAt? }
notes:index   →   Sorted Set (score = timestamp, for ordering)
```

## Setup & Run

### Prerequisites
- Node.js 18+
- Redis running locally on `127.0.0.1:6379`

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:** Use [Redis for Windows](https://github.com/tporadowski/redis/releases) or WSL.

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Start the backend

```bash
cd backend
npm run dev      # with hot-reload (nodemon)
# or
npm start        # production
```

Backend runs on **http://localhost:5000**

### 4. Start the frontend

```bash
cd frontend
npm start
```

Frontend runs on **http://localhost:3000** and proxies API calls to port 5000.

---

## Environment Variables (Backend)

Create a `.env` file in `/backend` to override defaults:

```env
PORT=5000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword   # optional, for Redis with auth
```

## API Endpoints

| Method | Path             | Description       |
|--------|------------------|-------------------|
| GET    | /api/notes       | Get all notes     |
| POST   | /api/notes       | Create a note     |
| PUT    | /api/notes/:id   | Update a note     |
| DELETE | /api/notes/:id   | Delete a note     |
| GET    | /api/health      | Redis health check|

### POST /api/notes — Request body
```json
{
  "title": "My Note",
  "content": "Note content here"
}
```
