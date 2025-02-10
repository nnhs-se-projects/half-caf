document.addEventListener("click", () => {
  // some browsers don't allow request on page load, so just request whenever the user clicks.
  if (
    "Notification" in window && // check that the browser supports notifications
    Notification?.permission !== "granted" &&
    Notification?.permission !== "denied"
  ) {
    Notification.requestPermission();
  }
});

const emailInput = document.querySelector("input.emailInput");

if (typeof window.socket === "undefined") {
  // Configure the Socket.IO client to prefer WebSocket over polling
  window.socket = window.io({
    transports: ["websocket"], // Prefer WebSocket over polling
  });
}

window.socket.on("Order finished", (data) => {
  if (
    Notification?.permission === "granted" &&
    emailInput !== null &&
    data.email === emailInput.value
  ) {
    const notification = new Notification("Order finished", {
      body: "Your order is finished and is now being delivered.",
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  }
});

window.socket.on("Order cancelled", (data) => {
  if (
    Notification?.permission === "granted" &&
    emailInput !== null &&
    data.email === emailInput.value
  ) {
    const notification = new Notification("Order cancelled", {
      body: "A barista has cancelled your order because: " + data.cancelMessage,
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  }
});
