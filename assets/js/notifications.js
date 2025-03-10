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

// Helper to detect mobile devices
function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

const emailInput = document.querySelector("input.emailInput");
const currentEmail =
  window.loggedInEmail || (emailInput ? emailInput.value : null);

window.io().on("connect_error", (err) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});

window.io().on("Order claimed", (data) => {
  if (
    Notification?.permission === "granted" &&
    currentEmail &&
    data.email === currentEmail
  ) {
    const options = {
      body: "Your order has been picked up and is now being delivered.",
      icon: "../img/Half_Caf_Logo_(1).png",
    };
    if (isMobile()) {
      // Mobile: send notification via service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ title: "Order claimed", options });
        } else {
          new Notification("Order claimed", options);
        }
      });
    } else {
      // Desktop: show notification directly
      new Notification("Order claimed", options);
    }
  }
});

window.io().on("Order cancelled", (data) => {
  if (
    Notification?.permission === "granted" &&
    currentEmail &&
    data.email === currentEmail
  ) {
    const options = {
      body: "A barista has cancelled your order because: " + data.cancelMessage,
      icon: "../img/Half_Caf_Logo_(1).png",
    };
    if (isMobile()) {
      // Mobile: send notification via service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            title: "Order cancelled",
            options,
          });
        } else {
          new Notification("Order cancelled", options);
        }
      });
    } else {
      // Desktop: show notification directly
      new Notification("Order cancelled", options);
    }
  }
});

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

// Add VAPID public key (from your .env; be sure this key is public only)
const VAPID_PUBLIC_KEY =
  "BNnAiZw2Mq15nUD7Qtc_EMQs0ZLXdGb3cS6dzwhp0M5rU94xVKp1AqvrrK8kXSa-f7AgUN69DYE0oM5vJBhAD54";

// Utility function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// If running on mobile, subscribe for push notifications
if (isMobile()) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.getSubscription().then((subscription) => {
      if (!subscription) {
        registration.pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
          .then((newSubscription) => {
            // Send subscription details to backend for storing
            fetch("/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newSubscription),
            });
          })
          .catch((err) => {
            console.error("Push subscription failed: ", err);
          });
      }
    });
  });
}
