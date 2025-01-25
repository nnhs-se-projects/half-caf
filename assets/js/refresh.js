// Client-side code

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

const ws = new WebSocket("ws://localhost:8081");

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

// sound.load();
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
            ></span>
          </th>
          <th scope="?">part of the above order</th>
          <th scope="?"></th>`;
      }

      if (orderTable !== null) {
        orderTable.appendChild(drinkElement);
        const cancelButtons = document.querySelectorAll("button.cancelButton");

        let numOfOrders = 0;
        for (const cancelButton of cancelButtons) {
          cancelButton.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to cancel this order?")) {
              return;
            }

            const message = prompt(
              "Please enter a message for the cancellation:"
            );
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

          numOfOrders++;
        }

        const finishButtons = document.querySelectorAll("button.finishButton");

        for (const finishButton of finishButtons) {
          finishButton.addEventListener("click", async () => {
            const orderId = finishButton.value;
            const response = await fetch(`/barista/${orderId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              window.location = "/barista";
            } else {
              console.log("error finishing order");
            }
          });
        }

        // update notification dropdown
        const ordersBadge = document.querySelector(".badge");
        ordersBadge.innerHTML = numOfOrders;

        const orderNotification = document.createElement("option");
        orderNotification.setAttribute("disabled", "disabled");
        orderNotification.innerHTML = `order from room ${jsonData.order.room}`;

        document.getElementById("orders").appendChild(orderNotification);
      }

      isFirstDrink = false;
    }

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
