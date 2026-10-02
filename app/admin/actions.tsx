"use client";

import { useState } from "react";

type NoteActionsProps = {
  noteId: string;
};

export default function NoteActions({ noteId }: NoteActionsProps) {
  const [loading, setLoading] = useState<"approve" | "delete" | "">("");
  const [error, setError] = useState("");

  async function handleAction(action: "approve" | "delete") {
    if (action === "delete") {
      const confirmed = window.confirm(
        "This will permanently delete the note and its PDF. Continue?",
      );

      if (!confirmed) return;
    }

    setLoading(action);
    setError("");

    try {
      const response = await fetch("/api/admin/notes/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: noteId,
          action,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Action failed.");
      }

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setLoading("");
    }
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={() => handleAction("approve")}
          disabled={loading !== ""}
          style={{
            padding: "10px 14px",
            border: "0",
            borderRadius: "10px",
            background: "#174d3d",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading === "approve" ? "Approving..." : "Approve"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("delete")}
          disabled={loading !== ""}
          style={{
            padding: "10px 14px",
            border: "0",
            borderRadius: "10px",
            background: "#6b2525",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: "10px", color: "#ff8d8d" }}>
          {error}
        </p>
      )}
    </div>
  );
}