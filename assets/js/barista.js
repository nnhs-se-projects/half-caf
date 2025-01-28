export function addListenerToCancelButtons() {
  const cancelButtons = document.querySelectorAll("button.cancelButton");

  for (const cancelButton of cancelButtons) {
    cancelButton.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to cancel this order?")) {
        return;
      }

      const message = prompt("Please enter a message for the cancellation:");
      const orderId = cancelButton.value;
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

export function addListenerToFinishButtons() {
  const finishButtons = document.querySelectorAll("button.finishButton");

  for (const finishButton of finishButtons) {
    finishButton.addEventListener("click", async () => {
      const orderId = finishButton.value;
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

document.addEventListener("DOMContentLoaded", () => {
  addListenerToCancelButtons();
  addListenerToFinishButtons();
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
    //console.log(`Updating counter for timestamp: ${timestamp}`);
    counter.textContent = calculateTimeDifference(timestamp);
  });
}

// call update every second
setInterval(updateCounters, 1000);

// first update
updateCounters();
