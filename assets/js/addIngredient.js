// creates an ingredient with the selected name, quantity, unit, and price
const addIngredientButton = document.querySelector("input.submit");

addIngredientButton.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const quantity = document.getElementById("quantity").value;
  const unit = document.getElementById("unit").value;
  const price = document.getElementById("price").value;
  const typeInput = document.querySelector("input.types:checked");
  const type = typeInput !== null ? typeInput.value : "other";

  const Ingredient = {
    name,
    quantity,
    unit,
    price,
    type,
  };

  addIngredientButton.disabled = true;

  const response = await fetch("/admin/addIngredient", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Ingredient),
  });
  if (response.ok) {
    window.location = "/admin/addIngredient";
  } else {
    console.log("error adding ingredient");
  }
});
