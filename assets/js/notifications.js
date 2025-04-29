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

// Update showOrderCancelledPopup to create a beautifully animated coffee-themed popup
function showOrderCancelledPopup(data) {
  const popupId = "orderCancelledPopup-" + data.id;
  // Only create if not already shown
  if (document.getElementById(popupId)) {
    return;
  }

  const popup = document.createElement("div");
  popup.id = popupId;
  popup.style.cssText = `
    position: absolute;
    top: 20%;
    left: calc(50% - 175px);
    width: 350px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 8px 30px rgba(88, 54, 33, 0.4);
    overflow: hidden;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    z-index: 10000;
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
    transition: opacity 0.5s ease, transform 0.5s ease;
  `;

  // If a saved position exists, restore it
  const savedPos = localStorage.getItem("popupPos_" + popupId);
  if (savedPos) {
    const pos = JSON.parse(savedPos);
    popup.style.left = pos.left;
    popup.style.top = pos.top;
  }

  // Build order items HTML if we have items data
  let orderItemsHTML = "";
  if (data.orderItems && data.orderItems.length > 0) {
    orderItemsHTML = `
      <div class="order-items">
        <h4>Order Items</h4>
        <ul class="coffee-items">
          ${data.orderItems
            .map(
              (item) => `
            <li>
              <div class="coffee-item-name">${item.name}</div>
              <div class="coffee-item-temp">${item.temp || ""}</div>
              ${
                item.flavors
                  ? `<div class="coffee-item-flavors">Flavors: ${item.flavors}</div>`
                  : ""
              }
              ${
                item.toppings
                  ? `<div class="coffee-item-toppings">Toppings: ${item.toppings}</div>`
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `;
  }

  popup.innerHTML = `
    <style>
      @keyframes steam {
        0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
        50% { transform: translateY(-10px) translateX(-5px) scale(1.1); opacity: 0.5; }
        100% { transform: translateY(-20px) translateX(5px) scale(1.2); opacity: 0; }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .popup-header {
        background: linear-gradient(135deg, #6F4E37 0%, #4A2C14 100%);
        color: white;
        padding: 12px 15px;
        cursor: move;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 3px solid #C4A484;
      }
      
      .popup-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: bold;
        font-size: 18px;
      }
      
      .coffee-cup {
        position: relative;
        width: 22px;
        height: 28px;
      }
      
      .cup-body {
        position: absolute;
        width: 100%;
        height: 100%;
        background: white;
        border-radius: 0 0 10px 10px;
        border: 2px solid #6F4E37;
        border-top: none;
        display: flex;
        justify-content: center;
      }
      
      .steam {
        position: absolute;
        top: -10px;
        left: 5px;
        width: 2px;
        height: 10px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        animation: steam 2s infinite ease-out;
      }
      
      .steam:nth-child(2) {
        left: 10px;
        animation-delay: 0.4s;
        height: 12px;
      }
      
      .steam:nth-child(3) {
        left: 15px;
        animation-delay: 0.8s;
        height: 8px;
      }
      
      .cup-handle {
        position: absolute;
        right: -8px;
        top: 5px;
        width: 10px;
        height: 15px;
        border: 2px solid #6F4E37;
        border-left: none;
        border-radius: 0 10px 10px 0;
      }
      
      .close-icon {
        color: white;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
        background-color: rgba(255,255,255,0.15);
      }
      
      .close-icon:hover {
        background-color: rgba(255,255,255,0.3);
        transform: scale(1.1);
      }
      
      .popup-content {
        padding: 20px;
        background: #FDF6E9;
        animation: fadeIn 0.5s 0.3s both;
        color: #3A2618;
        font-size: 15px;
        line-height: 1.5;
      }
      
      .popup-content p {
        color: #3A2618;
        margin-bottom: 15px;
        font-weight: 500;
      }
      
      .coffee-note {
        margin-top: 15px;
        background: white;
        border-left: 4px solid #A67951;
        padding: 12px;
        border-radius: 0 6px 6px 0;
        box-shadow: 0 2px 8px rgba(166, 121, 81, 0.2);
        animation: fadeIn 0.5s 0.5s both;
      }
      
      .barista-message {
        color: #5D4037;
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 16px;
      }
      
      .coffee-items {
        list-style: none;
        padding: 0;
        margin: 15px 0;
        animation: fadeIn 0.5s 0.6s both;
      }
      
      .coffee-items li {
        background: rgba(255, 255, 255, 0.85);
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 5px;
        border-left: 3px solid #8B5A2B;
        box-shadow: 0 2px 6px rgba(139, 90, 43, 0.1);
        transition: all 0.3s;
      }
      
      .coffee-items li:hover {
        transform: translateX(2px);
        box-shadow: 0 4px 8px rgba(139, 90, 43, 0.2);
      }
      
      .coffee-item-name {
        font-weight: bold;
        color: #5D4037;
        margin-bottom: 5px;
      }
      
      .coffee-item-temp {
        display: inline-block;
        padding: 3px 8px;
        background: #A67951;
        color: white;
        border-radius: 20px;
        font-size: 12px;
        margin: 5px 0;
        font-weight: bold;
      }

      .coffee-item-flavors, .coffee-item-toppings {
        color: #5D4037;
        margin-top: 3px;
      }
      
      .coffee-splash {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 100px;
        height: 100px;
        opacity: 0.07;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="%236F4E37" d="M50 10c-25 0-30 20-30 40s10 40 30 40 30-20 30-40-5-40-30-40zm-7 60c-10 0-13-10-13-20s3-20 13-20 13 10 13 20-3 20-13 20z"/></svg>');
        background-repeat: no-repeat;
        background-position: center;
        z-index: -1;
        transform: rotate(-15deg);
      }

      h4 {
        color: #6F4E37;
        margin-top: 15px;
        margin-bottom: 10px;
        border-bottom: 1px dashed #C4A484;
        padding-bottom: 5px;
      }
    </style>
    
    <div class="popup-header">
      <div class="popup-title">
        <div class="coffee-cup">
          <div class="steam"></div>
          <div class="steam"></div>
          <div class="steam"></div>
          <div class="cup-body"></div>
          <div class="cup-handle"></div>
        </div>
        <span>Order Cancelled</span>
      </div>
      <div class="close-icon" title="Close">&times;</div>
    </div>
    
    <div class="popup-content">
      <p>Your coffee order has been cancelled.</p>
      
      <div class="coffee-note">
        <div class="barista-message">Barista note:</div>
        <div>${data.cancelMessage}</div>
      </div>
      
      ${orderItemsHTML}
      
      <div class="coffee-splash"></div>
    </div>
  `;

  document.body.appendChild(popup);

  // Trigger animation after a small delay to ensure the element is in the DOM
  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0) scale(1)";
  }, 10);

  makeDraggable(popup, popup.querySelector(".popup-header"));

  // Add event listener for the X close icon
  popup.querySelector(".close-icon").addEventListener("click", () => {
    closePopup(popup, data.id, popupId);
  });
}

// Helper function to close popup with animation
function closePopup(popup, dataId, popupId) {
  popup.style.opacity = "0";
  popup.style.transform = "translateY(-20px) scale(0.95)";

  setTimeout(() => {
    popup.remove();
    removePendingOrderCancelled(dataId);
    localStorage.removeItem("popupPos_" + popupId);
  }, 500); // Wait for animation to complete
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
