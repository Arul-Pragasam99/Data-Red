const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// Redis connection
// By default connects to 127.0.0.1:6379
// Override via env vars: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

app.use(cors());
app.use(express.json());

// Helper: Redis key for a note
const noteKey = (id) => `note:${id}`;
const NOTES_INDEX = "notes:index"; // sorted set storing all note IDs by timestamp

// ── GET /api/notes ─────────────────────────────────────────────────────────────
// Returns all notes sorted newest-first
app.get("/api/notes", async (req, res) => {
  try {
    // Get all note IDs from sorted set (newest first)
    const ids = await redis.zrevrange(NOTES_INDEX, 0, -1);

    if (ids.length === 0) return res.json([]);

    // Fetch each note's hash
    const pipeline = redis.pipeline();
    ids.forEach((id) => pipeline.hgetall(noteKey(id)));
    const results = await pipeline.exec();

    const notes = results
      .map(([err, data], i) => {
        if (err || !data || !data.id) return null;
        return { ...data };
      })
      .filter(Boolean);

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// ── POST /api/notes ────────────────────────────────────────────────────────────
// Creates a new note
app.post("/api/notes", async (req, res) => {
  const { title, content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Content is required" });
  }

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const note = {
    id,
    title: title?.trim() || "Untitled",
    content: content.trim(),
    createdAt,
  };

  try {
    const pipeline = redis.pipeline();
    // Store note fields as a Redis hash
    pipeline.hset(noteKey(id), note);
    // Add to sorted index (score = unix timestamp for ordering)
    pipeline.zadd(NOTES_INDEX, Date.now(), id);
    await pipeline.exec();

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// ── PUT /api/notes/:id ─────────────────────────────────────────────────────────
// Updates an existing note
app.put("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    const exists = await redis.exists(noteKey(id));
    if (!exists) return res.status(404).json({ error: "Note not found" });

    const updatedAt = new Date().toISOString();
    await redis.hset(noteKey(id), {
      title: title?.trim() || "Untitled",
      content: content.trim(),
      updatedAt,
    });

    const updated = await redis.hgetall(noteKey(id));
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// ── DELETE /api/notes/:id ──────────────────────────────────────────────────────
// Deletes a note
app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pipeline = redis.pipeline();
    pipeline.del(noteKey(id));
    pipeline.zrem(NOTES_INDEX, id);
    await pipeline.exec();

    res.json({ message: "Note deleted", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: "ok", redis: "connected" });
  } catch {
    res.status(500).json({ status: "error", redis: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
