function addDrinkToOrder(drink) {
  const orderTable = document.querySelector("#order-table");
  const drinkElement = document.createElement("tr");
  drinkElement.innerHTML = `
    <td>${drink.name}</td>
    <td>${drink.price}</td>
    <td>
      <button class="action-button cancel cancelButton" value="${drink.id}">
        Cancel
      </button>
    </td>
  `;
  orderTable.getElementsByTagName("tbody")[0].appendChild(drinkElement);
}

function addListenerToDrinkCards() {
  const drinkCards = document.querySelectorAll(".pos-card");
  for (const card of drinkCards) {
    card.addEventListener("click", (event) => {
      const drinkName = card.querySelector(".drink-name").textContent;
      const drinkPrice = card.querySelector(".drink-price").textContent;
      const drinkId = card.querySelector(".drink-id").textContent;
      const drinkImage = card.querySelector(".drink-image").src;
      const drink = {
        name: drinkName,
        price: drinkPrice,
        id: drinkId,
        image: drinkImage,
      };
      addDrinkToOrder(drink);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  addListenerToDrinkCards();
});
