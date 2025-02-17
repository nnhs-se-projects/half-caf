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

// Register service worker if not already registered
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceWorker.js")
    .then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch((err) => {
      console.error("Service Worker registration failed:", err);
    });
}

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
    navigator.serviceWorker.ready.then((registration) => {
      const options = {
        body: "Your order is finished and is now being delivered.",
        icon: "../img/Half_Caf_Logo_(1).png",
      };
      if (registration.active) {
        registration.active.postMessage({ title: "Order finished", options });
      } else {
        new Notification("Order finished", options);
      }
    });
  }
});

window.io().on("Order cancelled", (data) => {
  if (
    Notification?.permission === "granted" &&
    emailInput !== null &&
    data.email === emailInput.value
  ) {
    navigator.serviceWorker.ready.then((registration) => {
      const options = {
        body:
          "A barista has cancelled your order because: " + data.cancelMessage,
        icon: "../img/Half_Caf_Logo_(1).png",
      };
      if (registration.active) {
        registration.active.postMessage({ title: "Order cancelled", options });
      } else {
        new Notification("Order cancelled", options);
      }
    });
  }
});

function enableNotifications() {
  if ("Notification" in window) {
    Notification.requestPermission().then(function (permission) {
      alert("Notification permission: " + permission);
    });
  } else {
    alert("This browser does not support notifications.");
  }
}
