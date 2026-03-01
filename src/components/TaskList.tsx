// Handle toggle, creation, update and delete

"use client";

import { useState } from "react";
import type { Task, Status } from "@prisma/client";

type Props = {
  initialTasks: Task[];
  stats: {
    total: number;
    todo: number;
    doing: number;
    done: number;
    completionRate: number;
  };
};

const STATUS_CYCLE: Status[] = ["TODO", "DOING", "DONE"];

const STATUS_LABEL: Record<Status, string> = {
  TODO:  "To do",
  DOING: "In progress",
  DONE:  "Done",
};

const STATUS_STYLE: Record<Status, { color: string; bg: string; border: string }> = {
  TODO:  { color: "#94a3b8", bg: "#0f172a",  border: "#334155" },
  DOING: { color: "#fbbf24", bg: "#1c1200",  border: "#78350f" },
  DONE:  { color: "#22c55e", bg: "#052e16",  border: "#14532d" },
};

const PRIORITY_LABEL = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" } as const;

const PRIORITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  HIGH:   { color: "#f87171", bg: "#1f0f0f", border: "#7f1d1d" },
  MEDIUM: { color: "#fbbf24", bg: "#1a1200", border: "#78350f" },
  LOW:    { color: "#94a3b8", bg: "#0f172a", border: "#334155" },
};

function nextStatus(current: Status): Status {
  const i = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks]       = useState<Task[]>(initialTasks);
  const [filter, setFilter]     = useState<"all" | Status>("all");
  const [newTitle, setNewTitle] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = tasks.length;
  const done  = tasks.filter(t => t.status === "DONE").length;
  const doing = tasks.filter(t => t.status === "DOING").length;
  const todo  = tasks.filter(t => t.status === "TODO").length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const visible = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });

    if (res.ok) {
      const created: Task = await res.json();
      setTasks(prev => [created, ...prev]);
      setNewTitle("");
      setFormOpen(false);
    }
  }

  async function handleToggleStatus(task: Task) {
    const next = nextStatus(task.status as Status);

    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, status: next } : t)
    );

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, status: task.status } : t)
      );
    }
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) setTasks(initialTasks);
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080c14",
      color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
            My Tasks
          </h1>
          <p style={{ fontSize: 14, color: "#475569" }}>
            {done} of {total} tasks completed
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          background: "#1e293b", borderRadius: 4, height: 4,
          marginBottom: 32, overflow: "hidden",
        }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
            borderRadius: 4, transition: "width 0.4s ease",
          }} />
        </div>

        {/* Stat cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12, marginBottom: 32,
        }}>
          {[
            { label: "Total",       value: total, accent: "#3b82f6" },
            { label: "To do",       value: todo,  accent: "#475569" },
            { label: "In progress", value: doing, accent: "#f59e0b" },
            { label: "Done",        value: done,  accent: "#22c55e" },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              background: "#0d1117",
              border: "1px solid #1e293b",
              borderTop: `2px solid ${accent}`,
              borderRadius: 10,
              padding: "16px 20px",
            }}>
              <p style={{
                fontSize: 10, color: "#475569", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
              }}>{label}</p>
              <p style={{ fontSize: 30, fontWeight: 700, color: "#f1f5f9" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 12,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "TODO", "DOING", "DONE"] as const).map(s => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                    background: active ? "#f1f5f9" : "transparent",
                    color: active ? "#0f172a" : "#475569",
                    border: active ? "none" : "1px solid #1e293b",
                    transition: "all 0.15s",
                  }}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>

          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              style={{
                padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                background: "#f1f5f9", color: "#0f172a",
                border: "none", fontSize: 13, fontWeight: 600,
              }}
            >+ New task</button>
          )}
        </div>

        {/* Create form */}
        {formOpen && (
          <form onSubmit={handleCreate} style={{
            display: "flex", gap: 8, marginBottom: 12,
            background: "#0d1117", border: "1px solid #1e293b",
            borderRadius: 8, padding: "10px 14px",
          }}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Task title..."
              style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: 14, color: "#f1f5f9", outline: "none",
              }}
            />
            <button type="submit" style={{
              background: "#f1f5f9", color: "#0f172a", border: "none",
              borderRadius: 6, padding: "6px 14px", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}>Save</button>
            <button type="button" onClick={() => setFormOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#475569", fontSize: 18, lineHeight: 1,
            }}>✕</button>
          </form>
        )}

        {/* Task list */}
        <div style={{
          background: "#0d1117", border: "1px solid #1e293b",
          borderRadius: 10, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 18px",
            borderBottom: "1px solid #1e293b",
          }}>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#334155",
                           textTransform: "uppercase", letterSpacing: "0.08em" }}>Task</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#334155",
                           textTransform: "uppercase", letterSpacing: "0.08em", width: 110 }}>Status</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#334155",
                           textTransform: "uppercase", letterSpacing: "0.08em", width: 80 }}>Priority</span>
            <span style={{ width: 24 }} />
          </div>

          {visible.length === 0 ? (
            <p style={{
              padding: 40, textAlign: "center", color: "#334155", fontSize: 14,
            }}>
              No tasks here.
            </p>
          ) : (
            visible.map((task, i) => {
              const status   = task.status as Status;
              const priority = task.priority as string;
              const ss = STATUS_STYLE[status];
              const ps = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.LOW;
              const isLast = i === visible.length - 1;
              const isHovered = hoveredId === task.id;

              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 18px",
                  borderBottom: isLast ? "none" : "1px solid #0f172a",
                  background: isHovered ? "#0f1623" : "transparent",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={() => setHoveredId(task.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Title */}
                  <span style={{
                    flex: 1, fontSize: 14,
                    color: status === "DONE" ? "#334155" : "#e2e8f0",
                    textDecoration: status === "DONE" ? "line-through" : "none",
                    fontWeight: 500,
                  }}>
                    {task.title}
                  </span>

                  {/* Status badge */}
                  <button
                    onClick={() => handleToggleStatus(task)}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = "0.75";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title={`Click to change → ${STATUS_LABEL[nextStatus(status)]}`}
                    style={{
                      width: 110,
                      fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600,
                      background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                      cursor: "pointer", textAlign: "center",
                      transition: "opacity 0.15s, transform 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: ss.color, flexShrink: 0, display: "inline-block",
                    }} />
                    {STATUS_LABEL[status]}
                  </button>

                  {/* Priority badge */}
                  <span style={{
                    width: 80, fontSize: 11, padding: "4px 10px", borderRadius: 20,
                    fontWeight: 600, textAlign: "center",
                    background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                    display: "inline-block",
                  }}>
                    {PRIORITY_LABEL[priority as keyof typeof PRIORITY_LABEL]}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{
                      width: 24, background: "none", border: "none", cursor: "pointer",
                      color: "#1e293b", fontSize: 14, padding: 0,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#1e293b")}
                  >✕</button>
                </div>
              );
            })
          )}
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: "#1e293b", textAlign: "center" }}>
          Click the status badge to cycle: To do → In progress → Done
        </p>
      </div>
    </main>
  );
}
