function addDrinkToOrder(drink) {
  const orderTable = document.querySelector("#order-table");
  const drinkElement = document.createElement("tr");
  drinkElement.innerHTML = `
    <td>${drink.name}</td>
    <td>$${drink.price}</td>
    <td>1</td>
    <td>
      <input type="submit" class="cancelButton" value="Cancel">
      </input>
    </td>
  `;
  orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);
  const cancelButton = drinkElement.querySelector(".cancelButton");
  const orderTotal = document.querySelector(".order-total");
  cancelButton.addEventListener("click", async () => {
    orderTotal.textContent =
      Number(orderTotal.textContent) - Number(drink.price);
    drinkElement.remove();
  });
  orderTotal.textContent = Number(orderTotal.textContent) + Number(drink.price);
}

document.addEventListener("DOMContentLoaded", () => {
  const drinkCards = document.querySelectorAll(".pos-card");
  for (const card of drinkCards) {
    card.addEventListener("click", async () => {
      const drinkName = card.querySelector(".drink-name").value;
      const drinkPrice = card.querySelector(".drink-price").value;
      const drinkId = card.querySelector(".drink-id").value;
      const drink = {
        name: drinkName,
        price: drinkPrice,
        id: drinkId,
      };
      console.log(drink);
      addDrinkToOrder(drink);
    });
  }
});
