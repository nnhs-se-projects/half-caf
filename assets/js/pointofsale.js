let currentMenuItemId;
let currentDrink;
let cart = [];
function addDrinkToOrder(drink) {
  cart.push(drink);
  const orderTable = document.querySelector("#order-table");
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
  const orderTotal = document.querySelector(".order-total");
  orderTotal.textContent = Number(orderTotal.textContent) + Number(drink.price);
  const cancelButton = drinkElement.querySelector(".cancelButton");
  cancelButton.addEventListener("click", async () => {
    orderTotal.textContent =
      Number(orderTotal.textContent) - Number(drink.price);
    drinkElement.remove();
    cart.splice(cart.indexOf(drink), 1);
  });
  currentMenuItemId = drink.menuItemId;
  currentDrink = drink;

  drinkElement.addEventListener("click", async () => {
    const clickedDrink = drinkElement.querySelector(".drink").value;
    currentMenuItemId = clickedDrink.menuItemId;
    currentDrink = clickedDrink;
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
