// Client-side code

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
  } else if (
    jsonData.message === "Order finished" &&
    Notification?.permission === "granted" &&
    emailInput !== null &&
    jsonData.email === emailInput.value
  ) {
    const notification = new Notification("Order finished", {
      body: "Your order is finished and is now being delivered.",
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  } else if (
    jsonData.message === "Order cancelled" &&
    Notification?.permission === "granted" &&
    emailInput !== null &&
    jsonData.email === emailInput.value
  ) {
    const notification = new Notification("Order cancelled", {
      body: "A barista has cancelled your order.",
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  }
};
