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
      new Notification("Order cancelled", options);
    }
  }

  // Always add to popup stack if not on barista client
  if (!window.location.pathname.startsWith("/barista")) {
    // If visible, show immediately; if not, save pending
    if (document.visibilityState === "visible") {
      showOrderCancelledPopup(assignId(data));
    } else {
      savePendingOrderCancelled(assignId(data));
    }
  }
});

// Helper: assign unique id if not already present
function assignId(data) {
  if (!data.id) {
    data.id =
      Date.now().toString() + "_" + Math.random().toString(36).substring(2, 8);
  }
  return data;
}

// Update showOrderCancelledPopup to include a header for dragging and use absolute positioning
function showOrderCancelledPopup(data) {
  const popupId = "orderCancelledPopup-" + data.id;
  // Only create if not already shown
  if (document.getElementById(popupId)) {
    return;
  }
  const popup = document.createElement("div");
  popup.id = popupId;
  // Default initial position if none is saved
  popup.style.cssText =
    "position: absolute; top: 20%; left: calc(50% - 150px); width: 300px; background: #fff; border: 1px solid #ccc; padding: 0; z-index: 10000; box-shadow: 0 4px 8px rgba(0,0,0,0.1);";

  // If a saved position exists, restore it
  const savedPos = localStorage.getItem("popupPos_" + popupId);
  if (savedPos) {
    const pos = JSON.parse(savedPos);
    popup.style.left = pos.left;
    popup.style.top = pos.top;
  }

  // Popup includes a draggable header
  popup.innerHTML = `
    <div class="popupHeader" style="background: #ccc; padding: 5px; cursor: move; user-select: none;">
      Order Cancelled
    </div>
    <div class="popupContent" style="padding: 15px;">
      <p>Your order has been cancelled.</p>
      <p><strong>Note:</strong> ${data.cancelMessage}</p>
      <button class="closePopup">Close</button>
    </div>`;

  document.body.appendChild(popup);

  // Make this popup draggable using the header
  makeDraggable(popup, popup.querySelector(".popupHeader"));

  popup.querySelector(".closePopup").addEventListener("click", () => {
    popup.remove();
    removePendingOrderCancelled(data.id);
    localStorage.removeItem("popupPos_" + popupId);
  });
}

// A helper function to make an element draggable using a handle element.
function makeDraggable(element, handle) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (isDragging) {
      element.style.left = e.clientX - offsetX + "px";
      element.style.top = e.clientY - offsetY + "px";
    }
  });

  document.addEventListener("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      // Save the element position
      localStorage.setItem(
        "popupPos_" + element.id,
        JSON.stringify({ left: element.style.left, top: element.style.top })
      );
    }
  });
}

function removePendingOrderCancelled(cancelId) {
  let pending = JSON.parse(
    localStorage.getItem("pendingOrderCancelled") || "[]"
  );
  pending = pending.filter((item) => item.id !== cancelId);
  localStorage.setItem("pendingOrderCancelled", JSON.stringify(pending));
}

function savePendingOrderCancelled(data) {
  let pending = JSON.parse(
    localStorage.getItem("pendingOrderCancelled") || "[]"
  );
  pending.push(data);
  localStorage.setItem("pendingOrderCancelled", JSON.stringify(pending));
}

// In showPendingOrderCancelled, do not clear the pending cancellations so they persist
function showPendingOrderCancelled() {
  let pending = JSON.parse(
    localStorage.getItem("pendingOrderCancelled") || "[]"
  );
  pending.forEach((data) => {
    showOrderCancelledPopup(data);
  });
  // Do NOT clear localStorage here, so that the popups remain on reload.
}

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    !window.location.pathname.startsWith("/barista")
  ) {
    showPendingOrderCancelled();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.startsWith("/barista")) {
    showPendingOrderCancelled();
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
            // // Show pop-up with push subscription details on mobile
            // alert(
            //   "Received push subscription: " + JSON.stringify(newSubscription)
            // );
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
