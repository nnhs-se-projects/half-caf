let currentMenuItemId;
let currentDrink;
let cart = [];
let isDrinkSelected = false;
const currentDrinkText = document.querySelector("#currentDrinkText");
const orderTable = document.querySelector("#order-table");
const orderTotal = document.querySelector(".order-total");
const flavors = document.querySelector(".flavors").value;
const toppings = document.querySelector(".toppings").value;
const temps = document.querySelector(".temps").value;
const possibleModificationsMap = document.querySelector(
  "#possibleModifications"
).value;
function selectDrink(drink) {
  if (isDrinkSelected) {
    // save the edits to the current drink before changing to a new one
  }
  isDrinkSelected = true;
  currentMenuItemId = drink.menuItemId;
  currentDrink = drink;
  let possibleFlavors = [];
  let possibleToppings = [];
  let possibleTemps = [];
  for (const flavor of flavors) {
    if (possibleModificationsMap.get(drink.menuItemId).indexOf(flavor) > -1) {
      possibleFlavors.push(flavor);
    }
  }
  for (const topping of toppings) {
    if (possibleModificationsMap.get(drink.menuItemId).indexOf(topping) > -1) {
      possibleToppings.push(topping);
    }
  }
  for (const temp of temps) {
    if (possibleModificationsMap.get(drink.menuItemId).indexOf(temp) > -1) {
      possibleTemps.push(temp);
    }
  }

  currentDrinkText.textContent = "Current Drink: " + currentDrink.name;
  document.querySelector(".customization-grid").innerHTML = `
  <% for (const flavor of possibleFlavors) { %>
    <div class="flavor">
      <input type="checkbox" class="flavor" value="<%= flavor %>">
      <label><%= flavor %></label>
    </div>
  <% } %>
  <% for (const topping of possibleToppings) { %>
    <div class="topping">
      <input type="checkbox" class="topping" value="<%= topping %>">
      <label><%= topping %></label>
    </div>
  <% } %>
  <% for (const temp of possibleTemps) { %>
    <div class="temp">
      <input type="checkbox" class="temp" value="<%= temp %>">
      <label><%= temp %></label>
    </div>
  <% } %>
  <input type="submit" class="saveButton" value="Save">
    `;
  const saveButton = document.querySelector(".saveButton");
}
function addDrinkToOrder(drink) {
  cart.push(drink);

  const drinkElement = document.createElement("tr");
  drinkElement.innerHTML = `
    <input type="hidden" class="drink" value="${drink}">
    <td>${drink.name}</td>
    <td>$${drink.price}</td>
    <td>1</td>
    <td>
      <input type="submit" class="cancelButton" value="Cancel">
      </input>
    </td>
  `;
  orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);
  orderTotal.textContent = Number(orderTotal.textContent) + Number(drink.price);

  const cancelButton = drinkElement.querySelector(".cancelButton");
  cancelButton.addEventListener("click", async () => {
    orderTotal.textContent =
      Number(orderTotal.textContent) - Number(drink.price);
    drinkElement.remove();
    cart.splice(cart.indexOf(drink), 1);
  });
  drinkElement.addEventListener("click", async () => {
    const clickedDrink = drinkElement.querySelector(".drink").value;
    selectDrink(clickedDrink);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const drinkCards = document.querySelectorAll(".pos-card");
  for (const card of drinkCards) {
    card.addEventListener("click", async () => {
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
        caffeination: false,
        instructions: "",
        favorite: false,
        completed: false,
      };
      console.log(drink);
      addDrinkToOrder(drink);
    });
  }
});
