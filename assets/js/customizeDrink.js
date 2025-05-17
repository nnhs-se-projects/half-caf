const isDecaf = document.getElementById("isDecaf");
if (isDecaf !== null) {
  isDecaf.addEventListener("click", () => {
    const badge = document.getElementById("caffeine-badge");

    if (isDecaf.checked) {
      badge.className = "caffeine-badge decaf";
      badge.innerHTML = "😌 Decaf";
    } else {
      badge.className = "caffeine-badge caffeinated";
      badge.innerHTML = "⚡ Caffeinated";
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const otherIngredients = document.querySelectorAll("input#otherIngredients");
  for (const otherIngredient of otherIngredients) {
    otherIngredient.addEventListener("click", () => {
      const numElem = otherIngredient.parentElement.lastElementChild;
      numElem.hidden = !numElem.hidden;
      if (numElem.hidden) {
        numElem.value = 0;
      } else {
        numElem.value = 1;
      }
    });
  }

  const drinkIngredients = document.querySelectorAll("input#drinkIngredients");
  for (const drinkIngredient of drinkIngredients) {
    drinkIngredient.addEventListener("click", () => {
      const numElem = drinkIngredient.parentElement.lastElementChild;
      numElem.hidden = !numElem.hidden;
      if (numElem.hidden) {
        numElem.value = 0;
      } else {
        numElem.value = 1;
      }
    });
  }
});

const addToOrderButton = document.querySelector("input.submit");
addToOrderButton.addEventListener("click", async () => {
  const name = document.getElementById("name").textContent;
  const price = document.getElementById("price").textContent.match(/(\d+)/)[0];

  const ingredients = [];
  const ingredientCounts = [];

  const otherIngredients = document.querySelectorAll("input#otherIngredients");
  for (let i = 0; i < otherIngredients.length; i++) {
    if (otherIngredients[i].checked) {
      ingredients.push(otherIngredients[i].value);
      ingredientCounts.push(
        otherIngredients[i].parentElement.lastElementChild.value
      );
    }
  }

  const drinkIngredients = document.querySelectorAll("input#drinkIngredients");
  for (let i = 0; i < drinkIngredients.length; i++) {
    ingredients.push(drinkIngredients[i].value); // default ingredients are added to the list even if they are not checked so that the barista can explicitly see that the user wants none of this ingredient
    ingredientCounts.push(
      drinkIngredients[i].parentElement.lastElementChild.value
    );
  }

  const tempInput = document.querySelector("input.temps:checked");
  const temp = tempInput !== null ? tempInput.value : "Default";

  const instructions = document.getElementById("instructions").value;
  const favorite = document.getElementById("favorite").checked;
  let quantity = document.getElementById("quantity").value;
  if (quantity === "") {
    quantity = 1;
  }

  const drink = {
    name,
    price,
    ingredients,
    ingredientCounts,
    temp,
    caf: !isDecaf.checked,
    instructions,
    favorite,
    quantity,
  };

  addToOrderButton.disabled = true;

  const response = await fetch(
    `/teacher/customizeDrink/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(drink),
    }
  );

  if (response.ok) {
    window.location = "/teacher/myCart";
  } else {
    console.log("error adding drink");
  }
});
