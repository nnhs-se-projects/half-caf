// creates an ingredient with the selected name, quantity, measure, and price
const addIngredientButton = document.querySelector("input.submit");

addIngredientButton.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const quantity = document.getElementById("quantity").value;
  const measure = document.getElementById("measure").value;
  const price = document.getElementById("price").value;

  const Ingredient = {
    name,
    quantity,
    measure,
    price,
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
