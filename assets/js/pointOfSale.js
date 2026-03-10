let currentDrink;
let cart = [];
let isDrinkSelected = false;
let cartIdCounter = 0;

document.addEventListener("DOMContentLoaded", () => {
  // Fix selectors to match HTML
  const currentDrinkText = document.querySelector("#currentDrinkText");
  const orderTable = document.querySelector("#order-table");
  const orderTotal = document.querySelector(".order-total");

  // Parse the JSON from the hidden inputs
  const ingredients = JSON.parse(document.querySelector("#ingredients").value);
  const temps = JSON.parse(document.querySelector("#temps").value);
  const possibleModificationsMap = JSON.parse(
    document.querySelector("#possibleModifications").value,
  );
  const allowedCategoriesMap = JSON.parse(
    document.querySelector("#allowedCategories").value,
  );

  const ingredientIdSet = new Set(
    ingredients.map((ingredient) => String(ingredient._id)),
  );

  function roundCurrency(value) {
    return Math.round(value * 100) / 100;
  }

  function getSelectedIngredientTotal() {
    let total = 0;
    const selected = document.querySelectorAll(".ingredient-checkbox:checked");
    selected.forEach((checkbox) => {
      const container = checkbox.closest(".ingredient-container");
      if (container && container.hidden) {
        return;
      }
      const countInput = container?.querySelector("input[type='number']");
      total += Number(countInput?.value || 0);
    });
    return total;
  }

  function enforceIngredientLimit(changedElement) {
    const total = getSelectedIngredientTotal();
    if (total <= 2) {
      return;
    }

    if (changedElement.classList.contains("ingredient-checkbox")) {
      const container = changedElement.closest(".ingredient-container");
      const countInput = container?.querySelector("input[type='number']");
      changedElement.checked = false;
      if (countInput) {
        countInput.value = 0;
        countInput.hidden = true;
      }
      return;
    }

    if (changedElement.type === "number") {
      const overflow = total - 2;
      const currentValue = Number(changedElement.value || 0);
      const adjustedValue = Math.max(0, currentValue - overflow);
      changedElement.value = adjustedValue;
      if (adjustedValue === 0) {
        const container = changedElement.closest(".ingredient-container");
        const checkbox = container?.querySelector(".ingredient-checkbox");
        if (checkbox) {
          checkbox.checked = false;
          changedElement.hidden = true;
        }
      }
    }
  }

  function getMenuDefaults(menuItemId) {
    const defaults = {
      ingredients: [],
      ingredientCounts: [],
      temps: [],
    };
    const modifications = possibleModificationsMap[menuItemId] || [];
    for (let i = 0; i < modifications.length; i++) {
      const entry = modifications[i];
      if (ingredientIdSet.has(String(entry))) {
        defaults.ingredients.push(entry);
        defaults.ingredientCounts.push(Number(modifications[i + 1]) || 0);
        i += 1;
      }
    }

    for (const entry of modifications) {
      const isIngredientId = ingredientIdSet.has(String(entry));
      if (!isIngredientId && entry !== "Caffeine" && entry !== "Decaf") {
        defaults.temps.push(entry);
      }
    }

    return defaults;
  }

  function ensureDrinkDefaults(drink) {
    if (!drink.ingredients || drink.ingredients.length === 0) {
      const defaults = getMenuDefaults(drink.menuItemId);
      drink.ingredients = defaults.ingredients;
      drink.ingredientCounts = defaults.ingredientCounts;
      if (!drink.temps || drink.temps.length === 0) {
        drink.temps = defaults.temps[0] || "";
      }
    }

    if (Array.isArray(drink.temps)) {
      drink.temps = drink.temps[0] || "";
    }

    if (!drink.temps) {
      const defaults = getMenuDefaults(drink.menuItemId);
      drink.temps = defaults.temps[0] || "";
    }

    if (
      !Array.isArray(drink.ingredientCounts) ||
      drink.ingredientCounts.length !== drink.ingredients.length
    ) {
      drink.ingredientCounts = drink.ingredients.map(
        (_, index) => Number(drink.ingredientCounts?.[index]) || 0,
      );
    }
  }

  function getCashCountedTotal() {
    const cashInputs = document.querySelectorAll(".cash-count");
    let total = 0;
    cashInputs.forEach((input) => {
      const count = Number(input.value || 0);
      const denom = Number(input.dataset.value || 0);
      total += count * denom;
    });
    return roundCurrency(total);
  }

  function updateCashTotals() {
    const expectedCashInput = document.querySelector("#expected-cash");
    const countedTotalEl = document.querySelector("#counted-total");
    const cashDiffEl = document.querySelector("#cash-diff");
    if (!expectedCashInput || !countedTotalEl || !cashDiffEl) {
      return;
    }

    const countedTotal = getCashCountedTotal();
    const expectedTotal = Number(expectedCashInput.value || 0);
    const difference = roundCurrency(countedTotal - expectedTotal);
    countedTotalEl.textContent = `$${countedTotal.toFixed(2)}`;
    cashDiffEl.textContent = `$${difference.toFixed(2)}`;
  }

  function syncExpectedCashToOrderTotal() {
    const expectedCashInput = document.querySelector("#expected-cash");
    if (!expectedCashInput || !orderTotal) {
      return;
    }

    expectedCashInput.value = Number(orderTotal.textContent || 0).toFixed(2);
    updateCashTotals();
  }

  function saveDrinkModifications() {
    if (!currentDrink) {
      return;
    }

    // Save the modifications to the current drink
    const selectedIngredients = Array.from(
      document.querySelectorAll(".ingredient-checkbox:checked"),
    ).map((checkbox) => checkbox.value);

    const ingredientCounts = [];
    const ingredientCheckboxes = document.querySelectorAll(
      ".ingredient-checkbox:checked",
    );
    for (const ingredient of ingredientCheckboxes) {
      ingredientCounts.push(
        Number(ingredient.parentElement.lastElementChild.value),
      );
    }

    const selectedTemp = document.querySelector(".temp-radio:checked")
      ? document.querySelector(".temp-radio:checked").value
      : null;
    const selectedCaffeination = document.querySelector(
      ".caffeination-checkbox",
    );

    if (selectedCaffeination) {
      currentDrink.caffeinated = !selectedCaffeination.checked;
    }

    currentDrink.ingredients = selectedIngredients;
    currentDrink.ingredientCounts = ingredientCounts;
    currentDrink.temps = selectedTemp;
    const instructions = document.querySelector("#drink-instructions").value;
    currentDrink.instructions = instructions;
  }

  function closeDrinkCustomization() {
    currentDrink = null;
    isDrinkSelected = false;
    currentDrinkText.textContent = "Current Drink: None";
    document.querySelector(".customization-grid").innerHTML = "";
  }

  function selectDrink(drink, skipSave = false) {
    if (isDrinkSelected && !skipSave) {
      saveDrinkModifications();
    }

    isDrinkSelected = true;
    currentDrink = cart.find((item) => item.cartId === drink.cartId);
    if (!currentDrink) {
      currentDrink = cart.find((item) => item.menuItemId === drink.menuItemId);
    }

    if (!currentDrink) {
      return;
    }

    const modifications = possibleModificationsMap[drink.menuItemId] || [];

    const possibleIngredients = [];
    const possibleTemps = [];
    currentDrinkText.textContent = "Current Drink: " + currentDrink.name;
    // Get allowed categories for this drink
    const allowedCategories = allowedCategoriesMap[drink.menuItemId] || [
      "milk",
      "syrups",
      "powders",
      "sauces",
      "toppings",
    ];
    for (const ingredient of ingredients) {
      const indx = modifications.indexOf(ingredient._id);
      if (indx > -1) {
        possibleIngredients.push({
          ingredient,
          count: modifications[indx + 1],
        });
      } else if (
        ingredient.type === "customizable" &&
        allowedCategories.includes(ingredient.category)
      ) {
        possibleIngredients.push({
          ingredient,
          count: 0,
        });
      }
    }

    for (const temp of temps) {
      if (modifications.indexOf(temp) > -1) {
        possibleTemps.push(temp);
      }
    }

    const selectedTemp =
      currentDrink.temps || (possibleTemps.length > 0 ? possibleTemps[0] : "");

    let html = '<div class="customization-columns">';

    // Column 1: Ingredients
    html += '<div class="customization-column">';
    html += "<h5>Ingredients</h5>";
    if (possibleIngredients.length > 0) {
      possibleIngredients.forEach((ingredient) => {
        const ingredientStringId = String(ingredient.ingredient._id);
        const ingredientIndex = currentDrink.ingredients
          ? currentDrink.ingredients.findIndex(
              (id) => String(id) === ingredientStringId,
            )
          : -1;
        const isCurrentlySelected = ingredientIndex > -1;
        const isChecked = isCurrentlySelected ? "checked" : "";
        const ingredientCountValue = isCurrentlySelected
          ? currentDrink.ingredientCounts[ingredientIndex]
          : ingredient.count;
        html += `
    <div ${
      ingredient.ingredient.type === "uncustomizable" ? "hidden" : ""
    } class="ingredient-container">
      <input type="checkbox" id="ingredient-${
        ingredient.ingredient._id
      }" class="ingredient-checkbox" value="${
        ingredient.ingredient._id
      }" ${isChecked}/>
      <label for="ingredient-${ingredient.ingredient._id}">${
        ingredient.ingredient.name
      }</label>
      <input ${isChecked ? "" : "hidden"} type="number" value="${
        ingredientCountValue
      }" min="0" max="2" />
    </div>
    `;
      });
    } else {
      html += "<p>No ingredients available</p>";
    }

    html += "</div>";
    // Column 3: Temperature
    html += '<div class="customization-column">';
    html += "<h5>Temperature</h5>";
    if (possibleTemps.length > 0) {
      possibleTemps.forEach((temp) => {
        const isTempSelected = temp === selectedTemp ? "checked" : "";
        html += `
    <div class="temp-container">
      <input type="radio" name="temp" id="temp-${temp}" class="temp-radio" value="${temp}" ${isTempSelected}/>
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

    if (modifications.indexOf("Decaf") > -1) {
      // Create column for decaf or caffeine
      const isDecafChecked =
        currentDrink.caffeinated === false ? "checked" : "";
      html += '<div class="customization-column">';
      html += "<h5>Caffeination</h5>";
      html += `
      <div class="caffeination-container">
        <input type="checkbox" id="caffeination" class="caffeination-checkbox" ${isDecafChecked} />
        <label for="caffeination">Decaf</label>
      </div>
    `;
      html += "</div>";
    }

    // Close the columns container
    html += "</div>";

    // Add save button
    html +=
      '<div class="button-container"><button type="button" class="saveButton">Save Drink</button></div>';

    document.querySelector(".customization-grid").innerHTML = html;

    const ingredientCheckBoxes = document.querySelectorAll(
      ".ingredient-checkbox",
    );
    for (const ingredient of ingredientCheckBoxes) {
      ingredient.addEventListener("change", () => {
        const numElem = ingredient.parentElement.lastElementChild;
        numElem.hidden = !numElem.hidden;
        if (numElem.hidden) {
          numElem.value = 0;
        } else if (Number(numElem.value || 0) === 0) {
          numElem.value = 1;
        }
        enforceIngredientLimit(ingredient);
      });

      const numElem = ingredient.parentElement.lastElementChild;
      if (numElem) {
        numElem.addEventListener("input", () => {
          enforceIngredientLimit(numElem);
        });
      }
    }

    // Add save button functionality
    const saveButton = document.querySelector(".saveButton");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        saveDrinkModifications();
        closeDrinkCustomization();
      });
    }
  }

  function addDrinkToOrder(drink) {
    cartIdCounter += 1;
    drink.cartId = cartIdCounter;

    // Ensure drink has defaults before adding to cart
    ensureDrinkDefaults(drink);

    cart.push(drink);

    const drinkElement = document.createElement("tr");
    drinkElement.innerHTML = `
      <td>${drink.name}</td>
      <td>$${drink.price}</td>
      <td>1</td>
      <td>
        <button type="button" class="cancelButton">❌</button>
      </td>
      <td>
        <button type="button" class="editButton">✏️</button>
    `;

    // Store drink data for retrieval
    drinkElement.dataset.cartId = String(drink.cartId);

    orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);
    orderTotal.textContent = (
      Number(orderTotal.textContent) + Number(drink.price)
    ).toFixed(2);
    syncExpectedCashToOrderTotal();

    const cancelButton = drinkElement.querySelector(".cancelButton");
    cancelButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (currentDrink === drink) {
        closeDrinkCustomization();
      }
      orderTotal.textContent = (
        Number(orderTotal.textContent) - Number(drink.price)
      ).toFixed(2);
      syncExpectedCashToOrderTotal();
      drinkElement.remove();
      cart.splice(cart.indexOf(drink), 1);
    });
    const editButton = drinkElement.querySelector(".editButton");
    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      const cartId = Number(drinkElement.dataset.cartId);
      const clickedDrink = cart.find((item) => item.cartId === cartId);
      if (clickedDrink) {
        selectDrink(clickedDrink);
      }
    });
    selectDrink(drink);
  }

  // Attach event listeners to drink cards
  const drinkCards = document.querySelectorAll(".pos-card");
  drinkCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const drinkName = card.querySelector(".drink-name").value;
      const drinkPrice = card.querySelector(".drink-price").value;
      const menuItemId = card.querySelector(".menuItem-id").value;
      const drink = {
        name: drinkName,
        price: drinkPrice,
        menuItemId: menuItemId,
        ingredients: [],
        ingredientCounts: [],
        temps: [],
        caffeinated:
          (possibleModificationsMap[menuItemId] || []).indexOf("Caffeine") > -1,
        instructions: "",
        favorite: false,
        completed: false,
      };

      if (isDrinkSelected && currentDrink) {
        const currentCartId = currentDrink.cartId;
        const currentIndex = cart.findIndex(
          (item) => item.cartId === currentCartId,
        );
        if (currentIndex > -1) {
          const oldPrice = Number(currentDrink.price);
          drink.cartId = currentCartId;
          ensureDrinkDefaults(drink);
          cart[currentIndex] = drink;

          // Update order total: subtract old price, add new price
          orderTotal.textContent = (
            Number(orderTotal.textContent) -
            oldPrice +
            Number(drink.price)
          ).toFixed(2);
          syncExpectedCashToOrderTotal();

          const rowToReplace = orderTable
            .getElementsByTagName("tbody")[0]
            .querySelector(`tr[data-cart-id="${currentCartId}"]`);
          if (rowToReplace) {
            rowToReplace.cells[0].textContent = drink.name;
            rowToReplace.cells[1].textContent = `$${drink.price}`;
          }

          selectDrink(drink, true);
          return;
        }
      }

      addDrinkToOrder(drink);
    });
  });

  // Add Order Paid button functionality
  const orderPaidButton = document.querySelector("#order-paid");
  if (orderPaidButton) {
    orderPaidButton.addEventListener("click", async () => {
      if (cart.length === 0) {
        alert("No items in order");
        return;
      }

      if (isDrinkSelected && currentDrink) {
        saveDrinkModifications();
      }

      cart.forEach((drink) => ensureDrinkDefaults(drink));

      if (cart.some((drink) => !drink.temps)) {
        alert("Each drink must have a temperature selected.");
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
      const response = await fetch(`/barista/pointOfSale`, {
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
        syncExpectedCashToOrderTotal();
        orderTable.getElementsByTagName("tbody")[0].innerHTML = "";
        currentDrinkText.textContent = "Current Drink: None";
        isDrinkSelected = false;
        document.querySelector(".customization-grid").innerHTML = "";

        // Reset all cash denomination inputs
        document.querySelectorAll(".cash-count").forEach((input) => {
          input.value = 0;
        });
        updateCashTotals();

        // Redirect to barista orders page
        window.location.href = "/barista/orders";
      } else {
        console.log("error");
      }
    });
  }

  const cashInputs = document.querySelectorAll(".cash-count");
  const cashSteppers = document.querySelectorAll(".cash-stepper");
  const expectedCashInput = document.querySelector("#expected-cash");
  const saveCashButton = document.querySelector("#save-cash-count");
  const cashStatusEl = document.querySelector("#cash-save-status");

  if (cashInputs.length && expectedCashInput) {
    cashInputs.forEach((input) => {
      input.addEventListener("input", updateCashTotals);
    });
    expectedCashInput.addEventListener("input", updateCashTotals);
    syncExpectedCashToOrderTotal();
  }

  if (cashSteppers.length) {
    cashSteppers.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        const step = Number(button.dataset.step || 0);
        const targetInput = document.querySelector(`#${targetId}`);
        if (!targetInput) {
          return;
        }

        const currentValue = Number(targetInput.value || 0);
        const nextValue = Math.max(0, currentValue + step);
        targetInput.value = String(nextValue);
        updateCashTotals();
      });
    });
  }

  if (saveCashButton) {
    saveCashButton.addEventListener("click", async () => {
      const expectedTotal = Number(expectedCashInput?.value || 0);
      const totalCounted = getCashCountedTotal();
      const difference = roundCurrency(totalCounted - expectedTotal);

      if (!Number.isFinite(expectedTotal)) {
        if (cashStatusEl) {
          cashStatusEl.textContent = "Expected cash must be a valid number.";
        }
        return;
      }

      saveCashButton.disabled = true;
      if (cashStatusEl) {
        cashStatusEl.textContent = "Saving cash count...";
      }

      try {
        const response = await fetch("/barista/pointOfSale/cash-count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalCounted,
            expectedTotal,
            difference,
          }),
        });

        if (response.ok) {
          if (cashStatusEl) {
            cashStatusEl.textContent = "Cash count saved.";
          }
        } else {
          if (cashStatusEl) {
            cashStatusEl.textContent = "Unable to save cash count.";
          }
        }
      } catch (error) {
        if (cashStatusEl) {
          cashStatusEl.textContent = "Unable to save cash count.";
        }
      } finally {
        saveCashButton.disabled = false;
      }
    });
  }
});
