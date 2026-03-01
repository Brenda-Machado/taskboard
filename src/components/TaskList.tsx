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

const STATUS_LABEL: Record<Status, string> = {
  TODO:  "To do",
  DOING: "In progress",
  DONE:  "Done",
};

const STATUS_NEXT: Record<Status, Status> = {
  TODO:  "DOING",
  DOING: "DONE",
  DONE:  "TODO",
};

const PRIORITY_LABEL = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" } as const;

const PRIORITY_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  HIGH:   { color: "#f87171", bg: "#1f0f0f", border: "#7f1d1d" },
  MEDIUM: { color: "#fbbf24", bg: "#1a1200", border: "#78350f" },
  LOW:    { color: "#94a3b8", bg: "#0f172a", border: "#334155" },
};

type FilterValue = "all" | Status;

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks]       = useState<Task[]>(initialTasks);
  const [filter, setFilter]     = useState<FilterValue>("all");
  const [newTitle, setNewTitle] = useState("");
  const [formOpen, setFormOpen] = useState(false);

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

  async function handleToggle(task: Task) {
    const nextStatus = STATUS_NEXT[task.status as Status];

    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t)
    );

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
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

  const dotColor = (status: Status) =>
    status === "DONE" ? "#22c55e" : status === "DOING" ? "#f59e0b" : "#475569";

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
          background: "#1e293b", borderRadius: 4, height: 4, marginBottom: 32, overflow: "hidden",
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

        {/* Filters + New task button */}
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
          {visible.length === 0 ? (
            <p style={{
              padding: 40, textAlign: "center",
              color: "#334155", fontSize: 14,
            }}>
              No tasks here.
            </p>
          ) : (
            visible.map((task, i) => {
              const status = task.status as Status;
              const priority = task.priority as string;
              const pc = PRIORITY_COLOR[priority] ?? PRIORITY_COLOR.LOW;
              const isLast = i === visible.length - 1;

              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px",
                  borderBottom: isLast ? "none" : "1px solid #0f172a",
                }}>
                  {/* Status toggle button */}
                  <button
                    onClick={() => handleToggle(task)}
                    title={`Mark as: ${STATUS_LABEL[STATUS_NEXT[status]]}`}
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      flexShrink: 0, cursor: "pointer",
                      background: status === "DONE" ? "#22c55e" : "transparent",
                      border: `2px solid ${dotColor(status)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {status === "DONE" && (
                      <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>
                    )}
                  </button>

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
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                    background: status === "DONE" ? "#052e16" : status === "DOING" ? "#1c1200" : "#0f172a",
                    color: status === "DONE" ? "#22c55e" : status === "DOING" ? "#f59e0b" : "#475569",
                    border: `1px solid ${status === "DONE" ? "#14532d" : status === "DOING" ? "#78350f" : "#1e293b"}`,
                  }}>
                    {STATUS_LABEL[status]}
                  </span>

                  {/* Priority badge */}
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                    background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                  }}>
                    {PRIORITY_LABEL[priority as keyof typeof PRIORITY_LABEL]}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#1e293b", fontSize: 14, padding: "2px 4px",
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
      </div>
    </main>
  );
}
