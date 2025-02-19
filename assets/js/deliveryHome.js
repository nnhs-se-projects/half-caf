function addListenerToClaimButtons() {
  const claimButtons = document.querySelectorAll("button.cancelButton");

  for (const claimButton of claimButtons) {
    claimButton.addEventListener("click", async () => {
      const orderId = claimButton.value;

      claimButton.disabled = true;

      const response = await fetch(`/deliveryProgress/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        window.location = `/deliveryProgress/${orderId}`;
      } else {
        console.log("error claiming order");
      }
    });
  }
}

let lastDrinkColor;
let orderTable = null;
document.addEventListener("DOMContentLoaded", () => {
  orderTable = document.getElementById("orderTable");
  lastDrinkColor = orderTable.rows[orderTable.rows.length - 1].id;

  addListenerToClaimButtons();
});

window.io().on("New order placed", (data) => {
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
          <td>${data.order.email.split("@")[0]}</td>
          <td>${drink.name}</td>
          <td>${tempBadge}</td>
          <td>${drink.flavors}</td>
          <td>${drink.toppings}</td>
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
          <td>${data.order.email.split("@")[0]}</td>
          <td>${drink.name}</td>
          <td>${tempBadge}</td>
          <td>${drink.flavors}</td>
          <td>${drink.toppings}</td>
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
      "0"
    )}:${String(seconds).padStart(2, "0")}`
  );
}

// time dif
function calculateTimeDifference(timestamp) {
  const orderTime = parseCustomTimestamp(timestamp);
  if (isNaN(orderTime.getTime())) {
    console.error(`Invalid timestamp: ${timestamp}`);
    return "Invalid time";
  }
  const currentTime = new Date();
  const diffInSeconds = Math.floor((currentTime - orderTime) / 1000);

  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

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

// update the timer
function updateCounters() {
  const counters = document.querySelectorAll(".time-counter");
  counters.forEach((counter) => {
    const timestamp = counter.getAttribute("data-timestamp");
    // console.log(`Updating counter for timestamp: ${timestamp}`);
    counter.textContent = calculateTimeDifference(timestamp);
  });
}

// call update every second
setInterval(updateCounters, 1000);

// first update
updateCounters();
