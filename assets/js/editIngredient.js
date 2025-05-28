function handleSelectChange() {
  const selectedValue = document.getElementById("filter").value;
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("id", selectedValue);

  // Create the updated URL with the new query parameter
  const updatedURL = `${window.location.origin}${
    window.location.pathname
  }?${urlParams.toString()}`;

  // redirect window
  window.location = updatedURL;
}

// listen for change in the dropdown menu
document
  .getElementById("filter")
  .addEventListener("change", handleSelectChange);

const saveIngredientButton = document.querySelector("input.submit");

saveIngredientButton.addEventListener("click", async () => {
  const id = document.getElementById("filter").value;
  const name = document
    .getElementById("name")
    .value.replace("/", "")
    .replace("\\", "");

  const quantity = document.getElementById("quantity").value;
  const orderThreshold = document.getElementById("orderThreshold").value;
  const unit = document.getElementById("unit").value;

  const price = document.getElementById("price").value.replace(/[^.\d]/g, "");
  if (!price) {
    alert("Please enter a price");
    return;
  }

  const typeInput = document.querySelector("input.types:checked");
  const type = typeInput !== null ? typeInput.value : "other";

  const ingredient = {
    name,
    quantity,
    orderThreshold,
    unit,
    price,
    type,
  };

  try {
    saveIngredientButton.disabled = true;

    const response = await fetch(`/admin/editIngredient/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ingredient),
    });

    if (response.ok) {
      alert("Ingredient updated");
      window.location = `/admin/editIngredient?id=${id}`;
    } else {
      console.error("Server error");
    }
  } catch (error) {
    console.error("Error updating ingredient: ", error);
  }
});
