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

// Register background sync for notifications if supported
if ("serviceWorker" in navigator && "SyncManager" in window) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.sync.register("sync-notifications").catch((err) => {
      console.error("Sync registration failed:", err);
    });
  });
}

// Helper to detect mobile devices
function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

const emailInput = document.querySelector("input.emailInput");

// Global Set to track shown notifications
const shownNotifications = new Set();

// For mobile clients: use polling only
if (isMobile()) {
  setInterval(() => {
    fetch("/notifications")
      .then((res) => res.json())
      .then((notifications) => {
        notifications.forEach((note) => {
          const id = note.type + "-" + note.timestamp; // unique id
          if (shownNotifications.has(id)) return;
          shownNotifications.add(id);
          setTimeout(() => shownNotifications.delete(id), 300000);
          const options = {
            body: note.message,
            icon: "../img/Half_Caf_Logo_(1).png",
          };
          // Deliver via service worker if available
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              title: note.type,
              options,
            });
          } else {
            new Notification(note.type, options);
          }
        });
      })
      .catch((err) => console.error("Error fetching notifications:", err));
  }, 30000);
}

// For desktop clients: use socket events only
if (!isMobile()) {
  window.io().on("Order finished", (data) => {
    if (
      Notification?.permission === "granted" &&
      emailInput !== null &&
      data.email === emailInput.value
    ) {
      const options = {
        body: "Your order is finished and is now being delivered.",
        icon: "../img/Half_Caf_Logo_(1).png",
      };
      new Notification("Order finished", options);
    }
  });

  window.io().on("Order cancelled", (data) => {
    if (
      Notification?.permission === "granted" &&
      emailInput !== null &&
      data.email === emailInput.value
    ) {
      const options = {
        body:
          "A barista has cancelled your order because: " + data.cancelMessage,
        icon: "../img/Half_Caf_Logo_(1).png",
      };
      new Notification("Order cancelled", options);
    }
  });
}

function enableNotifications() {
  if ("Notification" in window) {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        alert("Notification permission granted.");
      } else if (permission === "denied") {
        alert(
          "Notification permission is still denied. " +
            'Please go to Settings, search for "Half Caf" in apps, and turn on notifications.'
        );
      } else {
        alert("Notification permission: " + permission);
      }
    });
  } else {
    alert("This device does not support notifications.");
  }
}
