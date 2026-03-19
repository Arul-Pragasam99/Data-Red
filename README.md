# 📝 Notebase — Full Stack Notes App (React + Express + Redis)

A full-stack notes application where you can create, edit, delete and search notes.
All data is stored in Redis running locally on your machine.

---

## 🗂️ Project Structure

```
notes-app/
├── backend/
│   ├── server.js          ← Express API server
│   └── package.json       ← Backend dependencies
├── frontend/
│   ├── public/
│   │   └── index.html     ← HTML template
│   ├── src/
│   │   ├── App.js         ← Main React component
│   │   ├── App.css        ← Styles
│   │   └── index.js       ← React entry point
│   └── package.json       ← Frontend dependencies
├── setup.sh               ← Auto setup script (Mac/Linux)
├── package.json           ← Root scripts
└── README.md              ← This file
```

---

## 🧰 Tech Stack

| Layer    | Technology              | Purpose                        |
|----------|-------------------------|--------------------------------|
| Frontend | React 18                | UI — create, view, edit notes  |
| Backend  | Node.js + Express       | REST API server                |
| Database | Redis                   | Stores notes in memory + disk  |
| Client   | ioredis                 | Node.js Redis client library   |

---

## 🔴 How Data is Stored in Redis

Each note is stored as a **Redis Hash** (like a mini object):

```
note:{uuid}  →  {
                  id:        "abc-123-...",
                  title:     "My Note",
                  content:   "Note content here",
                  createdAt: "2026-03-18T10:00:00.000Z",
                  updatedAt: "2026-03-18T11:00:00.000Z"  ← only if edited
                }
```

All note IDs are tracked in a **Redis Sorted Set** (for newest-first ordering):

```
notes:index  →  [ "abc-123", "def-456", ... ]  (sorted by timestamp)
```

### 📁 Where is the data saved on disk?

Redis keeps data in RAM while running and periodically saves a snapshot to disk:

```
C:\Program Files\Redis\dump.rdb        ← default location (Windows)
```

To change the save location to a custom path (e.g. `D:\Data Red`):

```powershell
# Option 1: Set temporarily (resets on restart)
redis-cli config set dir "D:\Data Red"

# Option 2: Make it permanent — add this line to:
# C:\Program Files\Redis\redis.windows-service.conf
dir "D:\Data Red"
dbfilename dump.rdb
```

Then restart Redis:
```powershell
net stop Redis
net start Redis
```

Verify the path:
```powershell
redis-cli config get dir
```

---

## ✅ Prerequisites

Before starting, make sure you have these installed:

| Tool       | Version  | Download                              |
|------------|----------|---------------------------------------|
| Node.js    | 18+      | https://nodejs.org                    |
| npm        | 9+       | Comes with Node.js                    |
| Redis      | 5+       | https://github.com/tporadowski/redis/releases (Windows) |

---

## 🪟 Step 1 — Install Redis (Windows)

Redis does not have an official Windows binary, but it can be installed via **Winget** — Microsoft's official package manager built into Windows 10/11.

Open PowerShell and run:

```powershell
winget install Redis.Redis
```

This installs Redis as a Windows Service and adds it to PATH automatically.

### Start Redis:
```powershell
net start Redis
```

### Stop Redis:
```powershell
net stop Redis
```

### Verify Redis is running:
```powershell
redis-cli ping
```
Expected output:
```
PONG
```

---

## 📦 Step 2 — Install Node.js Dependencies

Navigate to the project folder and install dependencies for both backend and frontend.

### Backend:
```powershell
cd "D:\Data Red\notes-app\backend"
npm install
```

This installs: `express`, `ioredis`, `uuid`, `cors`, `nodemon`

### Frontend:
```powershell
cd "D:\Data Red\notes-app\frontend"
npm install
```

This installs: `react`, `react-dom`, `react-scripts`

> ⚠️ The `npm install` step is only needed **once**. After that, just use `npm start` / `npm run dev`.

---

## 🚀 Step 3 — Run the App

You need **two PowerShell windows** open at the same time.

### Terminal 1 — Start the Backend:
```powershell
cd "D:\Data Red\notes-app\backend"
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
✅ Connected to Redis
🚀 Server running on http://localhost:5000
```

### Terminal 2 — Start the Frontend:
```powershell
cd "D:\Data Red\notes-app\frontend"
npm start
```

This will automatically open **http://localhost:3000** in your browser.

---

## 🌐 API Endpoints

The backend exposes these REST API endpoints on `http://localhost:5000`:

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | /api/notes       | Fetch all notes          |
| POST   | /api/notes       | Create a new note        |
| PUT    | /api/notes/:id   | Update an existing note  |
| DELETE | /api/notes/:id   | Delete a note            |
| GET    | /api/health      | Check Redis connection   |

### Example — Create a note (POST):
```json
{
  "title": "My First Note",
  "content": "This is saved in Redis!"
}
```

---

## ⚙️ Environment Variables (Optional)

If you want to use a custom Redis host, port, or password, create a `.env` file inside the `backend` folder:

```
D:\Data Red\notes-app\backend\.env
```

With the following content:
```env
PORT=5000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword
```

By default (without `.env`), the app connects to `127.0.0.1:6379` with no password.

---

## 🔍 Inspect Data Directly in Redis

You can view your stored notes anytime using `redis-cli`:

```powershell
redis-cli
```

Then inside the Redis CLI:

```bash
# List all keys
keys *

# View a specific note (replace with actual UUID)
hgetall note:abc-123-uuid-here

# Count total notes
zcard notes:index

# Delete a specific note manually
del note:abc-123-uuid-here

# Clear ALL data (careful!)
flushall
```

---

## 🛑 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` in `/backend` |
| `Cannot GET /` | Frontend not started | Run `npm start` in `/frontend` |
| `Redis connection refused` | Redis not running | Run `net start Redis` |
| `PONG not received` | Redis not installed | Run `winget install Redis.Redis` |
| `Port 3000 already in use` | Another app using port | Close other apps or restart PC |
| `Port 5000 already in use` | Another backend running | Close the other terminal |

---

## 🔄 Daily Usage (After First Setup)

Once everything is installed, starting the app each day is just:

```powershell
# 1. Start Redis (if not already running as a service)
net start Redis

# 2. Terminal 1 — Backend
cd "D:\Data Red\notes-app\backend"
npm run dev

# 3. Terminal 2 — Frontend
cd "D:\Data Red\notes-app\frontend"
npm start
```

Then open **http://localhost:3000** 🎉

---

## 📌 Port Summary

| Service  | Port  | URL                        |
|----------|-------|----------------------------|
| Frontend | 3000  | http://localhost:3000      |
| Backend  | 5000  | http://localhost:5000      |
| Redis    | 6379  | localhost:6379 (internal)  |
