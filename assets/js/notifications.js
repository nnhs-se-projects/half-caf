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

window.io().on("connect_error", (err) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});

window.io().on("Order finished", (data) => {
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

window.io().on("Order cancelled", (data) => {
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
