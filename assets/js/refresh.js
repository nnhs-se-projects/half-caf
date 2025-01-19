// Client-side code
const ws = new WebSocket("ws://localhost:8081");

ws.onmessage = function (event) {
  const jsonData = JSON.parse(event.data);
  if (jsonData.message === "Ordering toggle changed") {
    // Reload the page if data has been updated
    // eslint-disable-next-line no-self-assign
    window.location = window.location;
  } else if (
    jsonData.message === "New order placed" &&
    window.location.href.indexOf("/barista") > -1
  ) {
    window.location = window.location;
  }
};
