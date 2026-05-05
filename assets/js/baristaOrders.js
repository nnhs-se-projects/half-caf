function addListenerToCancelButtons() {
  const cancelButtons = document.querySelectorAll("button.cancelButton");
  const finishButtons = document.querySelectorAll("button.finishButton");

  for (const cancelButton of cancelButtons) {
    cancelButton.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to cancel this order?")) {
        return;
      }

      const message = prompt("Please enter a message for the cancellation:");
      if (!message) {
        return;
      }

      const orderId = cancelButton.value;

      // prevent bugs
      for (const finishButton of finishButtons) {
        finishButton.disabled = true;
      }
      for (const cancelButton2 of cancelButtons) {
        cancelButton2.disabled = true;
      }

      const response = await fetch(`/barista/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        window.location = "/barista/orders";
      } else {
        console.log("error deleting order");
      }
    });
  }
}

function addListenerToFinishButtons() {
  const finishButtons = document.querySelectorAll("button.finishButton");
  const cancelButtons = document.querySelectorAll("button.cancelButton");

  for (const finishButton of finishButtons) {
    finishButton.addEventListener("click", async () => {
      const orderId = finishButton.value;

      const counter = document.querySelector(
        `.time-counter[data-order-id="${orderId}"]`,
      );

      let timerVal = counter.textContent;
      timerVal = convertToSeconds(timerVal);

      // prevent bugs
      for (const finishButton2 of finishButtons) {
        finishButton2.disabled = true;
      }
      for (const cancelButton of cancelButtons) {
        cancelButton.disabled = true;
      }

      const response = await fetch(`/barista/orders/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ t: timerVal }),
      });

      if (response.ok) {
        window.location = "/barista/orders";
      } else {
        console.log("error finishing order");
      }
    });
  }
}

let lastDrinkColor;
let orderTable = null;
// Add audio instance for new order sound (adjust the path if needed)
const orderSound = new Audio("../sounds/order-new.wav");
orderSound.preload = "auto";

const overdueThresholdSeconds = 10 * 60;
const overdueStorageKey = "halfCafOverdueOrderPopups";
const overdueOrderIds = new Set(loadOverdueOrderIds());

function loadOverdueOrderIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(overdueStorageKey) || "[]");
    return Array.isArray(stored) ? stored.filter(Boolean) : [];
  } catch (error) {
    console.warn("Unable to read overdue popup state:", error);
    return [];
  }
}

function persistOverdueOrderIds() {
  try {
    localStorage.setItem(
      overdueStorageKey,
      JSON.stringify(Array.from(overdueOrderIds)),
    );
  } catch (error) {
    console.warn("Unable to save overdue popup state:", error);
  }
}

function markOrderOverdueSeen(orderId) {
  if (!orderId) {
    return;
  }

  if (!overdueOrderIds.has(orderId)) {
    overdueOrderIds.add(orderId);
    persistOverdueOrderIds();
  }
}

function clearOrderOverdueSeen(orderId) {
  if (!orderId) {
    return;
  }

  if (overdueOrderIds.delete(orderId)) {
    persistOverdueOrderIds();
  }

  document.getElementById(`orderOverduePopup-${orderId}`)?.remove();
}

function ensureOverduePopupStyles() {
  if (document.getElementById("orderOverduePopupStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "orderOverduePopupStyles";
  style.textContent = `
    .order-overdue-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      width: min(420px, calc(100vw - 24px));
      background: linear-gradient(135deg, #fff8ef 0%, #fff 100%);
      border: 1px solid #e7c9a7;
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(111, 78, 55, 0.24);
      color: #3a2618;
      z-index: 12000;
      overflow: hidden;
      opacity: 0;
      transform: translateY(-12px) scale(0.98);
      transition: opacity 0.22s ease, transform 0.22s ease;
      font-family: "Poppins", sans-serif;
    }

    .order-overdue-popup.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .order-overdue-popup__bar {
      height: 6px;
      background: linear-gradient(90deg, #ff8a3d 0%, #ffb26b 100%);
    }

    .order-overdue-popup__body {
      padding: 14px 16px 16px;
    }

    .order-overdue-popup__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .order-overdue-popup__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #b45a14;
      background: rgba(255, 178, 107, 0.18);
      border: 1px solid rgba(180, 90, 20, 0.16);
      border-radius: 999px;
      padding: 4px 10px;
      margin-bottom: 8px;
    }

    .order-overdue-popup__title {
      font-size: 1.05rem;
      font-weight: 800;
      line-height: 1.2;
      color: #4a2c14;
    }

    .order-overdue-popup__message {
      margin-top: 8px;
      font-size: 0.94rem;
      line-height: 1.45;
      color: #5d4037;
    }

    .order-overdue-popup__details {
      margin-top: 12px;
      display: grid;
      gap: 6px;
      font-size: 0.92rem;
      color: #4b3427;
    }

    .order-overdue-popup__details strong {
      color: #2c1810;
    }

    .order-overdue-popup__close {
      border: none;
      background: #f6e3cf;
      color: #6f4e37;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.18s ease, background-color 0.18s ease;
      flex-shrink: 0;
    }

    .order-overdue-popup__close:hover {
      background: #f2d7bd;
      transform: scale(1.05);
    }

    .order-overdue-popup__progress {
      height: 4px;
      background: rgba(255, 178, 107, 0.2);
      overflow: hidden;
    }

    .order-overdue-popup__progress > span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #ff8a3d 0%, #ff6b6b 100%);
      transform-origin: left;
      animation: orderOverdueCountdown 12000ms linear forwards;
    }

    @keyframes orderOverdueCountdown {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `;

  document.head.appendChild(style);
}

function showOrderOverduePopup({ orderId, room, teacher, elapsedText }) {
  if (!orderId) {
    return;
  }

  const popupId = `orderOverduePopup-${orderId}`;
  if (document.getElementById(popupId)) {
    return;
  }

  ensureOverduePopupStyles();

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const safeRoom = escapeHtml(room ? String(room).trim() : "Unknown room");
  const safeTeacher = escapeHtml(
    teacher ? String(teacher).trim() : "Unknown teacher",
  );
  const safeElapsed = escapeHtml(elapsedText || "10m");

  const popup = document.createElement("div");
  popup.id = popupId;
  popup.className = "order-overdue-popup";
  popup.innerHTML = `
    <div class="order-overdue-popup__bar"></div>
    <div class="order-overdue-popup__body">
      <div class="order-overdue-popup__header">
        <div>
          <div class="order-overdue-popup__eyebrow">Overdue order</div>
          <div class="order-overdue-popup__title">This order has been waiting too long</div>
        </div>
        <button class="order-overdue-popup__close" aria-label="Dismiss overdue order alert">&times;</button>
      </div>
      <div class="order-overdue-popup__message">
        The timer has reached 10 minutes. Please check this order as soon as possible.
      </div>
      <div class="order-overdue-popup__details">
        <div><strong>Room:</strong> ${safeRoom}</div>
        <div><strong>Teacher:</strong> ${safeTeacher}</div>
        <div><strong>Elapsed:</strong> ${safeElapsed}</div>
      </div>
    </div>
    <div class="order-overdue-popup__progress"><span></span></div>
  `;

  document.body.appendChild(popup);

  const closePopup = () => {
    popup.classList.remove("visible");
    window.setTimeout(() => popup.remove(), 220);
  };

  const closeButton = popup.querySelector(".order-overdue-popup__close");
  closeButton?.addEventListener("click", closePopup);

  window.setTimeout(closePopup, 12000);
  window.requestAnimationFrame(() => popup.classList.add("visible"));
}

function calculateElapsedSeconds(timestamp) {
  const orderTime = parseCustomTimestamp(timestamp);
  if (isNaN(orderTime.getTime())) {
    return null;
  }

  return Math.floor((new Date() - orderTime) / 1000);
}

function formatElapsedTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let timeString = "";
  if (hours > 0) {
    timeString += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    timeString += `${minutes}m `;
  }
  timeString += `${seconds}s`;

  return timeString.trim();
}

document.addEventListener("DOMContentLoaded", () => {
  orderTable = document.getElementById("orderTable");
  lastDrinkColor = orderTable.rows[orderTable.rows.length - 1].id;

  addListenerToCancelButtons();
  addListenerToFinishButtons();
});

window.io().on("New order placed", (data) => {
  // Play sound on new order
  orderSound
    .play()
    .catch((error) => console.error("Audio play failed:", error));

  if (Notification?.permission === "granted") {
    const notification = new Notification("New order placed", {
      body: "A new order has been placed from room " + data.order.room,
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  }

  let isFirstDrink = true;
  for (const drink of data.drinks) {
    const drinkElement = document.createElement("tr");
    drinkElement.className = `order-row ${
      isFirstDrink ? "first-drink" : "additional-drink"
    }`;

    // Update the temperature badge class to include blended
    const tempClass = drink.temp.toLowerCase();
    const tempBadge = `<span class="temp-badge ${tempClass}">${drink.temp}</span>`;

    if (isFirstDrink) {
      drinkElement.innerHTML = `
          <td>${data.order.room}</td>
          <td>${
            data.order.name && data.order.name.trim()
              ? data.order.name
              : data.order.email.split("@")[0]
          }
          ${data.order.isAdmin ? `<span style="color: red"> Admin</span>` : ""}
          </td>
          <td>${drink.name}</td>
          <td>${tempBadge}</td>
          <td>${drink.ingredients}</td>
          <td>${drink.caffeinated === false ? "Decaf" : "Caffeinated"}</td>
          <td>${drink.instructions}</td>
          <td>${data.order.timestamp.split("/")[0]}</td>
          <td>
            <span class="time-counter" 
                  data-timestamp="${data.order.timestamp}"
                  data-order-id="${data.order._id}">
            </span>
          </td>
          <td colspan="2">
            <button class="action-button cancel cancelButton" value="${
              data.order._id
            }">
              Cancel
            </button>
            <button class="action-button finish finishButton" value="${
              data.order._id
            }">
              Complete
            </button>
          </td>`;
    } else {
      drinkElement.innerHTML = `
          <td>${data.order.room}</td>
          <td>${
            data.order.name && data.order.name.trim()
              ? data.order.name
              : data.order.email.split("@")[0]
          }</td>
          <td>${drink.name}</td>
          <td>${tempBadge}</td>
          <td>${drink.ingredients}</td>
          <td>${drink.caffeinated === false ? "Decaf" : "Caffeinated"}</td>
          <td>${drink.instructions}</td>
          <td>${data.order.timestamp.split("/")[0]}</td>
          <td>
            <span class="time-counter" 
                  data-timestamp="${data.order.timestamp}"
                  data-order-id="${data.order._id}">
            </span>
          </td>
          <td colspan="2" class="part-of-order">Part of above order</td>`;
    }

    if (orderTable !== null) {
      orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);

      const numOfOrders = document.querySelectorAll(".finishButton").length;

      // update notification dropdown
      let ordersBadge = document.querySelector(".badge");
      if (ordersBadge !== null) {
        ordersBadge.innerHTML = numOfOrders;
      } else {
        ordersBadge = document.createElement("span");
        ordersBadge.innerHTML = numOfOrders;
        ordersBadge.className = "badge";
        document.querySelector(".notification").appendChild(ordersBadge);
        document.getElementById("notificationDropdownLabel").innerHTML =
          "New Orders";
      }

      const orderNotification = document.createElement("option");
      orderNotification.setAttribute("disabled", "disabled");
      orderNotification.innerHTML = `order from room ${data.order.room}`;

      document.getElementById("orders").appendChild(orderNotification);
    }

    isFirstDrink = false;
  }

  addListenerToCancelButtons();
  addListenerToFinishButtons();

  lastDrinkColor = lastDrinkColor === "c" ? "b" : "c";
});

window.io().on("Order completed", (data) => {
  const drinkRows = document.querySelectorAll(
    `.time-counter[data-order-id="${data.orderId}"]`,
  );
  for (const drink of drinkRows) {
    drink.parentNode.parentNode.remove();
  }

  clearOrderOverdueSeen(data.orderId);
});

window.io().on("Order cancelled", (data) => {
  const drinkRows = document.querySelectorAll(
    `.time-counter[data-order-id="${data.orderId}"]`,
  );
  for (const drink of drinkRows) {
    drink.parentNode.parentNode.remove();
  }

  clearOrderOverdueSeen(data.orderId);
});

window.io().on("Room updated", (data) => {
  const drinkRows = document.querySelectorAll(
    `.time-counter[data-order-id="${data.orderId}"]`,
  );
  for (const drink of drinkRows) {
    const roomElement = drink.parentElement.parentElement.firstElementChild;
    roomElement.innerHTML = data.newRoom;
  }
});

function convertToSeconds(timeString) {
  const timeParts = timeString.split(" ");
  let totalSeconds = 0;

  for (const part of timeParts) {
    if (part.endsWith("h")) {
      totalSeconds += parseInt(part) * 3600;
    } else if (part.endsWith("m")) {
      totalSeconds += parseInt(part) * 60;
    } else if (part.endsWith("s")) {
      totalSeconds += parseInt(part);
    }
  }

  return totalSeconds;
}

function parseCustomTimestamp(timestamp) {
  const [datePart, timeAndPeriod] = timestamp.split(" at ");
  if (!datePart || !timeAndPeriod) {
    console.error(`Invalid timestamp format: ${timestamp}`);
    return new Date(NaN); // bad date
  }

  const [timePart, secondsPart] = timeAndPeriod.split("/");
  const [time, period] = timePart.split(/(am|pm)/i);
  if (!time || !period || !secondsPart) {
    console.error(`Invalid time format: ${timePart}`);
    return new Date(NaN); // bad date
  }

  let [hours, minutes] = time.split(":").map(Number);
  const seconds = parseInt(secondsPart, 10);
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    console.error(`Invalid time values: ${time}`);
    return new Date(NaN); // bad date
  }

  if (period.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (period.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return new Date(
    `${datePart}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(seconds).padStart(2, "0")}`,
  );
}

// time dif
function calculateTimeDifference(timestamp) {
  const diffInSeconds = calculateElapsedSeconds(timestamp);
  if (diffInSeconds === null) {
    console.error(`Invalid timestamp: ${timestamp}`);
    return "Invalid time";
  }

  return formatElapsedTime(diffInSeconds);
}

// update the timer
function updateCounters() {
  const counters = document.querySelectorAll(".time-counter");
  counters.forEach((counter) => {
    const timestamp = counter.getAttribute("data-timestamp");
    // console.log(`Updating counter for timestamp: ${timestamp}`);
    const elapsedSeconds = calculateElapsedSeconds(timestamp);
    counter.textContent =
      elapsedSeconds === null
        ? "Invalid time"
        : formatElapsedTime(elapsedSeconds);

    if (elapsedSeconds !== null && elapsedSeconds >= overdueThresholdSeconds) {
      const orderId = counter.getAttribute("data-order-id");
      if (orderId && !overdueOrderIds.has(orderId)) {
        const row = counter.closest("tr");
        const cells = row ? row.querySelectorAll("td") : [];
        const room = cells[0]?.textContent || "";
        const teacher = cells[1]?.textContent || "";

        showOrderOverduePopup({
          orderId,
          room,
          teacher,
          elapsedText: formatElapsedTime(elapsedSeconds),
        });
        markOrderOverdueSeen(orderId);
      }
    }
  });
}

// call update every second
setInterval(updateCounters, 1000);

// first update
updateCounters();
