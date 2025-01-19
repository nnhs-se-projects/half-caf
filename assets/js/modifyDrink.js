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
  console.log(updatedURL);
}

// listen for change in the dropdown menu
document
  .getElementById("filter")
  .addEventListener("change", handleSelectChange);

// creates a topping with a name chosen by an admin
const saveDrinkButton = document.querySelector("input.submit");

saveDrinkButton.addEventListener("click", async () => {
  const id = document.getElementById("filter").value;
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;

  const temps = document.querySelectorAll("input#temp");
  const checkedTemps = [];
  for (let i = 0; i < temps.length; i++) {
    if (temps[i].checked) {
      checkedTemps.push(temps[i].value);
    }
  }

  const flavors = document.querySelectorAll("input#flavor");
  const checkedFlavors = [];
  for (let i = 0; i < flavors.length; i++) {
    if (flavors[i].checked) {
      checkedFlavors.push(flavors[i].value);
    }
  }

  const toppings = document.querySelectorAll("input#toppings");
  const checkedToppings = [];
  for (let i = 0; i < toppings.length; i++) {
    if (toppings[i].checked) {
      checkedToppings.push(toppings[i].value);
    }
  }
  const popular = document.getElementById("popular").checked;
  const caffeination = document.getElementById("caffeination").checked;
  const special = document.getElementById("special").checked;

  const drink = {
    name,
    description,
    price,
    checkedFlavors,
    checkedToppings,
    checkedTemps,
    popular,
    caf: caffeination,
    special,
  };

  const response = await fetch(`/modifyDrink/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(drink),
  });

  if (response.ok) {
    window.location = "/modifyDrink";
  } else {
    console.log("error updating drink");
  }
});
