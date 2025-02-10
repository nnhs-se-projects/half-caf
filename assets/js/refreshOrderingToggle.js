window.io({ transports: ["websocket"] }).on("Ordering toggle changed", () => {
  window.location = window.location;
});
