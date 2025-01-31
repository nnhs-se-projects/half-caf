const socket = window.io();

socket.on("Ordering toggle changed", () => {
  window.location = window.location;
});
