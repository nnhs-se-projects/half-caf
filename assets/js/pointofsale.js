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

    currentDrink.flavors = selectedFlavors;
    currentDrink.toppings = selectedToppings;
    currentDrink.temps = selectedTemp;
    const instructions = document.querySelector("#drink-instructions").value;
    currentDrink.instructions = instructions;
    console.log(currentDrink);
  }
  function selectDrink(drink) {
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
        const isChecked = currentDrink.flavors.includes(flavor._id)
          ? "checked"
          : "";
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
        const isChecked = currentDrink.toppings.includes(topping._id)
          ? "checked"
          : "";
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
        const isChecked = currentDrink.temps.includes(temp) ? "checked" : "";
        html += `
    <div class="temp-container">
      <input type="radio" name="temp" id="temp-${temp}" class="temp-radio" value="${temp}"  ${isChecked}/>
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
      const isChecked = currentDrink.caffeination ? "checked" : "";
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
        <button class="cancelButton">Cancel</button>
      </td>
    `;

    // Store drink data for retrieval
    drinkElement.dataset.drink = JSON.stringify(drink);

    orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);
    orderTotal.textContent = (
      Number(orderTotal.textContent) + Number(drink.price)
    ).toFixed(2);

    const cancelButton = drinkElement.querySelector(".cancelButton");
    cancelButton.addEventListener("click", () => {
      orderTotal.textContent = (
        Number(orderTotal.textContent) - Number(drink.price)
      ).toFixed(2);
      drinkElement.remove();
      cart.splice(cart.indexOf(drink), 1);
    });

    drinkElement.addEventListener("click", () => {
      // Get the drink data from the element
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
        caffeination:
          possibleModificationsMap[menuItemId].indexOf("Caffeination") > -1,
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
    orderPaidButton.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("No items in order");
        return;
      }

      // Process the order
      console.log("Processing order with items:", cart);
      alert("Order processed successfully!");

      // Clear the cart
      cart = [];
      orderTotal.textContent = "0.00";
      orderTable.getElementsByTagName("tbody")[0].innerHTML = "";
    });
  }
});
