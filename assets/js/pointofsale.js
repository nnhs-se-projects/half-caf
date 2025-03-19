let currentDrink;
let cart = [];
let isDrinkSelected = false;

document.addEventListener("DOMContentLoaded", () => {
  // Fix selectors to match HTML
  const currentDrinkText = document.querySelector("#currentDrinkText");
  const orderTable = document.querySelector("#order-table");
  const orderTotal = document.querySelector(".order-total");

  // Parse the JSON from the hidden inputs
  const flavors = JSON.parse(document.querySelector("#flavors").value);
  const toppings = JSON.parse(document.querySelector("#toppings").value);
  const temps = JSON.parse(document.querySelector("#temps").value);
  const possibleModificationsMap = JSON.parse(
    document.querySelector("#possibleModifications").value
  );
  function saveDrinkModifications() {
    // Save the modifications to the current drink
    const selectedFlavors = Array.from(
      document.querySelectorAll(".flavor-checkbox:checked")
    ).map((checkbox) => checkbox.value);
    const selectedToppings = Array.from(
      document.querySelectorAll(".topping-checkbox:checked")
    ).map((checkbox) => checkbox.value);
    const selectedTemp = document.querySelector(".temp-radio:checked")
      ? document.querySelector(".temp-radio:checked").value
      : null;
    const selectedCaffeination = document.querySelector(
      ".caffeination-checkbox"
    );
    if (selectedCaffeination) {
      currentDrink.caffeinated = !selectedCaffeination.checked;
    }
    currentDrink.flavors = selectedFlavors;
    currentDrink.toppings = selectedToppings;
    currentDrink.temps = selectedTemp;
    const instructions = document.querySelector("#drink-instructions").value;
    currentDrink.instructions = instructions;
    console.log(currentDrink);
  }
  function selectDrink(drink) {
    console.log("You selected a drink");
    if (isDrinkSelected) {
      saveDrinkModifications();
    }

    isDrinkSelected = true;
    currentDrink = cart.find((item) => item.menuItemId === drink.menuItemId);

    const possibleFlavors = [];
    const possibleToppings = [];
    const possibleTemps = [];
    currentDrinkText.textContent = "Current Drink: " + currentDrink.name;
    for (const flavor of flavors) {
      if (possibleModificationsMap[drink.menuItemId].indexOf(flavor._id) > -1) {
        possibleFlavors.push(flavor);
      }
    }
    for (const topping of toppings) {
      if (
        possibleModificationsMap[drink.menuItemId].indexOf(topping._id) > -1
      ) {
        possibleToppings.push(topping);
      }
    }
    for (const temp of temps) {
      if (possibleModificationsMap[drink.menuItemId].indexOf(temp) > -1) {
        possibleTemps.push(temp);
      }
    }

    let html = '<div class="customization-columns">';

    // Column 1: Flavors
    html += '<div class="customization-column">';
    html += "<h5>Flavors</h5>";
    if (possibleFlavors.length > 0) {
      possibleFlavors.forEach((flavor) => {
        const isChecked =
          currentDrink.flavors.indexOf(flavor._id) > -1 ? "checked" : "";
        html += `
    <div class="flavor-container">
      <input type="checkbox" id="flavor-${flavor._id}" class="flavor-checkbox" value="${flavor._id}" ${isChecked}/>
      <label for="flavor-${flavor._id}">${flavor.flavor}</label>
    </div>
    `;
      });
    } else {
      html += "<p>No flavors available</p>";
    }
    html += "</div>";

    // Column 2: Toppings
    html += '<div class="customization-column">';
    html += "<h5>Toppings</h5>";
    if (possibleToppings.length > 0) {
      possibleToppings.forEach((topping) => {
        const isChecked =
          currentDrink.toppings.indexOf(topping._id) > -1 ? "checked" : "";
        html += `
    <div class="topping-container">
      <input type="checkbox" id="topping-${topping._id}" class="topping-checkbox" value="${topping._id}" ${isChecked}/>
      <label for="topping-${topping._id}">${topping.topping}</label>
    </div>
    `;
      });
    } else {
      html += "<p>No toppings available</p>";
    }
    html += "</div>";

    // Column 3: Temperature
    html += '<div class="customization-column">';
    html += "<h5>Temperature</h5>";
    if (possibleTemps.length > 0) {
      possibleTemps.forEach((temp) => {
        const isChecked =
          currentDrink.temps && currentDrink.temps.indexOf(temp) > -1
            ? "checked"
            : "";
        html += `
    <div class="temp-container">
      <input type="radio" name="temp" id="temp-${temp}" class="temp-radio" value="${temp}" checked="checked"/>
      <label for="temp-${temp}">${temp}</label>
    </div>
    `;
      });
    } else {
      html += "<p>No temperature options</p>";
    }
    html += "</div>";

    // Column 4: Instructions
    html += '<div class="customization-column">';
    html += "<h5>Special Instructions</h5>";
    html += `
    <div class="instructions-container">
      <textarea id="drink-instructions" class="instructions-textarea" 
        placeholder="Enter any special instructions here..."
        rows="5">${currentDrink.instructions || ""}</textarea>
    </div>
  `;
    html += "</div>";

    if (possibleModificationsMap[drink.menuItemId].indexOf("Decaf") > -1) {
      // Create column for decaf or caffeine
      const isChecked = currentDrink.caffeinated ? "" : "checked";
      html += '<div class="customization-column">';
      html += "<h5>Caffeination</h5>";
      html += `
      <div class="caffeination-container">
        <input type="checkbox" id="caffeination" class="caffeination-checkbox" ${isChecked} />
        <label for="caffeination">Decaf</label>
      </div>
    `;
      html += "</div>";
    }

    // Close the columns container
    html += "</div>";

    // Add save button
    html +=
      '<div class="button-container"><button class="saveButton">Save Drink</button></div>';

    document.querySelector(".customization-grid").innerHTML = html;
    // Add save button functionality
    const saveButton = document.querySelector(".saveButton");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        saveDrinkModifications();
      });
    }
  }

  function addDrinkToOrder(drink) {
    cart.push(drink);

    const drinkElement = document.createElement("tr");
    drinkElement.innerHTML = `
      <td>${drink.name}</td>
      <td>$${drink.price}</td>
      <td>1</td>
      <td>
        <input type="submit" value="Cancel" class="cancelButton" />
      </td>
      <td>
        <input type="submit" value="Edit" class="editButton" />
    `;

    // Store drink data for retrieval
    drinkElement.dataset.drink = JSON.stringify(drink);

    orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);
    orderTotal.textContent = (
      Number(orderTotal.textContent) + Number(drink.price)
    ).toFixed(2);

    const cancelButton = drinkElement.querySelector(".cancelButton");
    cancelButton.addEventListener("click", () => {
      if (currentDrink === drink) {
        currentDrink = null;
        isDrinkSelected = false;
        currentDrinkText.textContent = "Current Drink: None";
        document.querySelector(".customization-grid").innerHTML = "";
      }
      orderTotal.textContent = (
        Number(orderTotal.textContent) - Number(drink.price)
      ).toFixed(2);
      drinkElement.remove();
      cart.splice(cart.indexOf(drink), 1);
    });
    const editButton = drinkElement.querySelector(".editButton");
    editButton.addEventListener("click", () => {
      const clickedDrink = JSON.parse(drinkElement.dataset.drink);
      selectDrink(clickedDrink);
    });
    selectDrink(drink);
  }

  // Attach event listeners to drink cards
  const drinkCards = document.querySelectorAll(".pos-card");
  drinkCards.forEach((card) => {
    card.addEventListener("click", () => {
      const drinkName = card.querySelector(".drink-name").value;
      const drinkPrice = card.querySelector(".drink-price").value;
      const menuItemId = card.querySelector(".menuItem-id").value;
      const drink = {
        name: drinkName,
        price: drinkPrice,
        menuItemId: menuItemId,
        flavors: [],
        toppings: [],
        temps: [],
        caffeinated:
          possibleModificationsMap[menuItemId].indexOf("Caffeine") > -1,
        instructions: "",
        favorite: false,
        completed: false,
      };
      addDrinkToOrder(drink);
    });
  });

  // Add Order Paid button functionality
  const orderPaidButton = document.querySelector(
    ".order-total-container input[type='submit']"
  );
  if (orderPaidButton) {
    orderPaidButton.addEventListener("click", async () => {
      if (cart.length === 0) {
        alert("No items in order");
        return;
      }
      const time = new Date();
      const year = time.getFullYear();
      const month = (time.getMonth() + 1).toString().padStart(2, "0");
      const day = time.getDate().toString().padStart(2, "0");
      let hours = time.getHours();
      const minutes = time.getMinutes().toString().padStart(2, "0");
      const seconds = time.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours || 12;
      const formattedTime = `${year}-${month}-${day} at ${hours}:${minutes}${ampm}/${seconds}`;

      // Send the order to the server
      const response = await fetch(`/pointofsale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: cart,
          timestamp: formattedTime,
          total: Number(orderTotal.textContent),
        }),
      });

      if (response.ok) {
        // Clear the cart
        cart = [];
        orderTotal.textContent = "0.00";
        orderTable.getElementsByTagName("tbody")[0].innerHTML = "";
        currentDrinkText.textContent = "Current Drink: None";
        isDrinkSelected = false;
        document.querySelector(".customization-grid").innerHTML = "";
      } else {
        console.log("error deleting flavor");
      }
    });
  }
});
