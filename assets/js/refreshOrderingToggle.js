if (typeof window.socket === "undefined") {
  // Configure the Socket.IO client to prefer WebSocket over polling
  window.socket = window.io({
    transports: ["websocket"], // Prefer WebSocket over polling
  });
}

window.socket.on("Ordering toggle changed", () => {
  window.location = window.location;
});
