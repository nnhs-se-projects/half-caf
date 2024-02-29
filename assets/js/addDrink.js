const addDrinkButton = document.querySelector("input.submit");
addDrinkButton.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  const popular = document.getElementById("popular");
  const temps = document.querySelectorAll("input.temps:checked");
  const temp = temps.length > 0 ? temps[0].value : null;
  const special = document.getElementById("special");
  const flavors = document.querySelectorAll("input.flavors:checked");
  const flavor = flavors.length > 0 ? flavors[0].value : null;
  const toppings = document.querySelectorAll("input.toppings:checked");
  const topping = toppings.length > 0 ? toppings[0].value : null;
  const caf = document.getElementById("caffeinated");

  const menuItem = {
    name,
    description,
    price,
    popular,
    flavor,
    topping,
    temp,
    caf,
    special,
  };
  console.log(menuItem);

  const response = await fetch("/addDrink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(menuItem),
  });

  if (response.ok) {
    window.location = "/addDrink";
  } else {
    console.log("error adding drink");
  }

  /* const response = await fetch("/addDrink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(menuItem),
  });

  if (response.ok) {
    window.location = "/addDrink";
  } else {
    console.log("error creating user");
  } */
});
