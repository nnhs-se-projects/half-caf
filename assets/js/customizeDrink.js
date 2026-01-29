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
      // Trigger input event to validate
      numElem.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Clamp input value to min/max while typing
    const numElem = otherIngredient.parentElement.lastElementChild;
    numElem.addEventListener("input", () => {
      const min = Number(numElem.getAttribute("min"));
      const max = Number(numElem.getAttribute("max"));
      let value = Number(numElem.value);

      // Calculate total count of all other checked ingredients
      const allOtherIngredients = document.querySelectorAll(
        "input#otherIngredients",
      );
      let totalCount = 0;
      for (const ingredient of allOtherIngredients) {
        if (ingredient.checked) {
          const count = Number(ingredient.parentElement.lastElementChild.value);
          if (ingredient === otherIngredient) {
            totalCount += value; // Use the new value being typed
          } else {
            totalCount += count;
          }
        }
      }

      // Enforce 2 unit max total across all add-on flavors
      if (totalCount > 2) {
        value = Math.max(0, 2 - (totalCount - value));
      }

      // Also enforce individual min/max
      if (!isNaN(min) && value < min && value !== 0) {
        value = min;
      } else if (!isNaN(max) && value > max) {
        value = max;
      }

      numElem.value = value;
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
      let count = Number(
        otherIngredients[i].parentElement.lastElementChild.value,
      );

      if (count < 0 || count > 2) {
        count = 1;
      }

      ingredientCounts.push(count);
    }
  }

  const drinkIngredients = document.querySelectorAll("input#drinkIngredients");
  for (let i = 0; i < drinkIngredients.length; i++) {
    ingredients.push(drinkIngredients[i].value); // default ingredients are added to the list even if they are not checked so that the barista can explicitly see that the user wants none of this ingredient
    let count = Number(
      drinkIngredients[i].parentElement.lastElementChild.value,
    );

    if (count < 1 || count > 100) {
      count = 1;
    }

    if (!drinkIngredients[i].checked) {
      count = 0;
    }

    ingredientCounts.push(count);
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
    },
  );

  if (response.ok) {
    window.location = "/teacher/myCart";
  } else {
    console.log("error adding drink");
  }
});
