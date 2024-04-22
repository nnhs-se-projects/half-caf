// Client-side code
const ws = new WebSocket("ws://localhost:8081");

ws.onmessage = function (event) {
  const jsonData = JSON.parse(event.data);
  if (jsonData.message === "Data updated") {
    // Reload the page if data has been updated
    // eslint-disable-next-line no-self-assign
    window.location = window.location;
  }
};
