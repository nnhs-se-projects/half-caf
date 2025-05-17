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

const addToOrderButton = document.querySelector("input.submit");
addToOrderButton.addEventListener("click", async () => {
  const name = document.getElementById("name").textContent;
  const price = document.getElementById("price").textContent.match(/(\d+)/)[0];
  const ingredients = document.querySelectorAll("input#ingredients");
  const checkedIngredients = [];
  for (let i = 0; i < ingredients.length; i++) {
    if (ingredients[i].checked) {
      checkedIngredients.push(ingredients[i].value);
    }
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
    checkedIngredients,
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
