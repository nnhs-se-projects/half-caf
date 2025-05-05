// creates an ingredient with the selected name, quantity, measure, and price
const addIngredientButton = document.querySelector("input.submit");

let srcData;

const name = document.getElementById("name");
const quantity = document.getElementById("quantity");
const measure = document.getElementById("measure");
const price = document.getElementById("price");

addIngredientButton.addEventListener("click", async () => {
  const name = document.getElementById("name");
  const quantity = document.getElementById("quantity");
  const measure = document.getElementById("measure");
  const price = document.getElementById("price");

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
