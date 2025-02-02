function addListenerToCancelButtons() {
  const cancelButtons = document.querySelectorAll("button.cancelButton");

  for (const cancelButton of cancelButtons) {
    cancelButton.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to cancel this order?")) {
        return;
      }

      const message = prompt("Please enter a message for the cancellation:");
      const orderId = cancelButton.value;
      console.log(orderId);
      const response = await fetch(`/barista/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        window.location = "/barista";
      } else {
        console.log("error deleting order");
      }
    });
  }
}

function addListenerToFinishButtons() {
  const finishButtons = document.querySelectorAll("button.finishButton");

  for (const finishButton of finishButtons) {
    finishButton.addEventListener("click", async () => {
      const orderId = finishButton.value;
      console.log("LOG");
      const counter = document.querySelector(
        `.time-counter[data-order-id="${orderId}"]`
      );
      let timerVal = counter.textContent;
      timerVal = convertToSeconds(timerVal);
      const response = await fetch(`/barista/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ t: timerVal }),
      });

      if (response.ok) {
        window.location = "/barista";
      } else {
        console.log("error finishing order");
      }
    });
  }
}

const sound = new Audio("/audio/notification.mp3");
sound.preload = "auto";

let lastDrinkColor;
let orderTable = null;
document.addEventListener("DOMContentLoaded", () => {
  orderTable = document.getElementById("orderTable");
  lastDrinkColor = orderTable.rows[orderTable.rows.length - 1].id;

  addListenerToCancelButtons();
  addListenerToFinishButtons();
});

window.io().on("New order placed", (data) => {
  console.log("HELLO");
  sound.play();
  let isFirstDrink = true;
  for (const drink of data.drinks) {
    const drinkElement = document.createElement("tr");
    drinkElement.id = lastDrinkColor === "c" ? "b" : "c";
    if (isFirstDrink) {
      drinkElement.innerHTML = `
          <th scope="?">${data.order.room}</th>
          <th scope="?">${data.order.email}</th>
          <th scope="?">${drink.name}</th>
          <th scope="?">${drink.temp}</th>
          <th scope="?">${drink.flavors}</th>
          <th scope="?">${drink.toppings}</th>
          <th scope="?">${drink.instructions}</th>
          <th scope="?">${data.order.timestamp.split("/")[0]}</th>
          <th scope="?">
            <span
              class="time-counter"
              data-timestamp="${data.order.timestamp}"
              data-order-id="${data.order._id}"
            ></span>
          </th>
          <th scope="?">
            <button value="${
              data.order._id
            }" class="cancelButton">Cancel</button>
          </th>
          <th scope="?">
            <button value="${
              data.order._id
            }" class="finishButton">Finish</button>
          </th>`;
    } else {
      drinkElement.innerHTML = `
          <th scope="?">${data.order.room}</th>
          <th scope="?">${data.order.email}</th>
          <th scope="?">${drink.name}</th>
          <th scope="?">${drink.temp}</th>
          <th scope="?">${drink.flavors}</th>
          <th scope="?">${drink.toppings}</th>
          <th scope="?">${drink.instructions}</th>
          <th scope="?">${data.order.timestamp.split("/")[0]}</th>
          <th scope="?">
            <span
              class="time-counter"
              data-timestamp="${data.order.timestamp}"
              data-order-id="${data.order._id}"
            ></span>
          </th>
          <th scope="?">part of the above order</th>
          <th scope="?"></th>`;
    }

    if (orderTable !== null) {
      orderTable.getElementsByTagName("thead")[0].appendChild(drinkElement);

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
