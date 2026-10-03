// Reads JSON or text/event-stream from /api/chat
fetch("/api/chat", { method: "POST" }).then(r => (r.headers.get("Content-Type") || "").includes("event-stream") ? r.text() : r.json());
