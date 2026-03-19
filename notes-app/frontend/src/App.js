import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API = "/api/notes";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoteCard({ note, onDelete, onEdit }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(note.id);
  };

  return (
    <div className={`note-card ${deleting ? "deleting" : ""}`}>
      <div className="note-header">
        <h3 className="note-title">{note.title}</h3>
        <div className="note-actions">
          <button className="btn-icon btn-edit" onClick={() => onEdit(note)} title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="btn-icon btn-delete" onClick={handleDelete} title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      </div>
      <p className="note-content">{note.content}</p>
      <div className="note-footer">
        <span className="note-date">
          {note.updatedAt ? `Edited ${formatDate(note.updatedAt)}` : formatDate(note.createdAt)}
        </span>
      </div>
    </div>
  );
}

function NoteModal({ note, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!note?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ title, content, id: note?.id });
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Note" : "New Note"}</h2>
          <button className="btn-icon modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              type="text"
              placeholder="Give your note a title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Content <span className="required">*</span></label>
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState("");
  const [redisStatus, setRedisStatus] = useState("checking");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotes(data);
      setError("");
    } catch {
      setError("Could not connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setRedisStatus(data.redis === "connected" ? "connected" : "disconnected");
    } catch {
      setRedisStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    checkHealth();
  }, [fetchNotes, checkHealth]);

  const handleSave = async ({ title, content, id }) => {
    if (id) {
      // Edit
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } else {
      // Create
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNote(null);
  };

  const filtered = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="2" width="20" height="26" rx="3" fill="currentColor" opacity="0.15" />
              <rect x="4" y="2" width="20" height="26" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <line x1="10" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="10" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="10" y1="20" x2="16" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="25" cy="25" r="6" fill="var(--accent)" />
              <line x1="25" y1="22" x2="25" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="25" x2="28" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="brand-name">NoteApp</span>
          </div>

          <div className="header-right">
            <span className={`redis-badge ${redisStatus}`}>
              <span className="redis-dot" />
              Redis {redisStatus}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => { setEditingNote(null); setShowModal(true); }}
            >
              + New Note
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Search bar */}
        <div className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        {/* Stats */}
        <div className="stats">
          <span>{notes.length} note{notes.length !== 1 ? "s" : ""} stored</span>
          {search && <span className="search-info"> · {filtered.length} matching "{search}"</span>}
        </div>

        {/* Content */}
        {loading ? (
          <div className="state-container">
            <div className="spinner" />
            <p>Loading notes…</p>
          </div>
        ) : error ? (
          <div className="state-container error-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={fetchNotes}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-container empty-state">
            <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
              <rect x="8" y="4" width="40" height="52" rx="5" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <line x1="18" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              <line x1="18" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              <line x1="18" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            </svg>
            <p>{search ? "No notes match your search." : "No notes yet. Create your first one!"}</p>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <NoteModal
          note={editingNote}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
