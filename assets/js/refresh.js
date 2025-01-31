import {
  addListenerToCancelButtons,
  addListenerToFinishButtons,
} from "../js/barista.js";

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

const sound = new Audio("/audio/notification.mp3");
sound.preload = "auto";

let lastDrinkColor;
let orderTable = null;
if (window.location.href.indexOf("/barista") > -1) {
  document.addEventListener("DOMContentLoaded", (event) => {
    orderTable = document.getElementById("orderTable");
    lastDrinkColor = orderTable.rows[orderTable.rows.length - 1].id;
  });
}

const { Server } = require("socket.io");

let io;
function createSocketServer(httpServer) {
  io = new Server(httpServer, {
    connectionStateRecovery: {},
  });
  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("Ordering toggle changed", () => {
      window.location = window.location;
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
    return io;
  });
}

function emitNewEntry(entry) {
  io.emit("new entry", entry);
}

module.exports = { createSocketServer, emitNewEntry };

ws.onmessage = function (event) {
  const jsonData = JSON.parse(event.data);
  if (jsonData.message === "Ordering toggle changed") {
    // Reload the page if data has been updated
    // eslint-disable-next-line no-self-assign
    window.location = window.location;
  } else if (
    jsonData.message === "New order placed" &&
    window.location.href.indexOf("/barista") > -1
  ) {
    sound.play();
    let isFirstDrink = true;
    for (const drink of jsonData.drinks) {
      const drinkElement = document.createElement("tr");
      drinkElement.id = lastDrinkColor === "c" ? "b" : "c";
      if (isFirstDrink) {
        drinkElement.innerHTML = `
          <th scope="?">${jsonData.order.room}</th>
          <th scope="?">${jsonData.order.email}</th>
          <th scope="?">${drink.name}</th>
          <th scope="?">${drink.temp}</th>
          <th scope="?">${drink.flavors}</th>
          <th scope="?">${drink.toppings}</th>
          <th scope="?">${drink.instructions}</th>
          <th scope="?">${jsonData.order.timestamp.split("/")[0]}</th>
          <th scope="?">
            <span
              class="time-counter"
              data-timestamp="${jsonData.order.timestamp}"
              data-order-id="${jsonData.order._id}"
            ></span>
          </th>
          <th scope="?">
            <button value="${
              jsonData.order._id
            }" class="cancelButton">Cancel</button>
          </th>
          <th scope="?">
            <button value="${
              jsonData.order._id
            }" class="finishButton">Finish</button>
          </th>`;
      } else {
        drinkElement.innerHTML = `
          <th scope="?">${jsonData.order.room}</th>
          <th scope="?">${jsonData.order.email}</th>
          <th scope="?">${drink.name}</th>
          <th scope="?">${drink.temp}</th>
          <th scope="?">${drink.flavors}</th>
          <th scope="?">${drink.toppings}</th>
          <th scope="?">${drink.instructions}</th>
          <th scope="?">${jsonData.order.timestamp.split("/")[0]}</th>
          <th scope="?">
            <span
              class="time-counter"
              data-timestamp="${jsonData.order.timestamp}"
              data-order-id="${jsonData.order._id}"
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
        orderNotification.innerHTML = `order from room ${jsonData.order.room}`;

        document.getElementById("orders").appendChild(orderNotification);
      }

      isFirstDrink = false;
    }

    addListenerToCancelButtons();
    addListenerToFinishButtons();

    lastDrinkColor = lastDrinkColor === "c" ? "b" : "c";
  } else if (
    jsonData.message === "Order finished" &&
    Notification?.permission === "granted" &&
    emailInput !== null &&
    jsonData.email === emailInput.value
  ) {
    const notification = new Notification("Order finished", {
      body: "Your order is finished and is now being delivered.",
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  } else if (
    jsonData.message === "Order cancelled" &&
    Notification?.permission === "granted" &&
    emailInput !== null &&
    jsonData.email === emailInput.value
  ) {
    const notification = new Notification("Order cancelled", {
      body:
        "A barista has cancelled your order because: " + jsonData.cancelMessage,
      icon: "../img/Half_Caf_Logo_(1).png",
    });
  }
};
