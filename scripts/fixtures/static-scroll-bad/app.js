document.addEventListener("wheel", (e) => { document.querySelector("#chat-messages").scrollTop += e.deltaY; }, { passive: true });
fetch("/api/chat", { method: "POST" }).then(r => r.json());
