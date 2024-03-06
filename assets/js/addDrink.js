const addDrinkButton = document.querySelector("input.submit");
addDrinkButton.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  const popular = document.getElementById("popular").checked;
  const temps = document.querySelectorAll("input.temps");
  const checkedTemps = [];
  for (let i = 0; i < temps.length; i++) {
    if (temps[i].checked) {
      checkedTemps.push(temps[i].value);
    }
  }
  console.log(checkedTemps);
  const special = document.getElementById("special").checked;
  const flavors = document.querySelectorAll("input.flavors");
  console.log(flavors);
  const checkedFlavors = [];
  for (let i = 0; i < flavors.length; i++) {
    if (flavors[i].checked) {
      checkedFlavors.push(flavors[i].value);
    }
  }
  console.log(checkedFlavors);

  const toppings = document.querySelectorAll("input.toppings:checked");
  const topping = toppings.length > 0 ? toppings[0].value : null;
  const caf = document.getElementById("caffeinated").checked;

  const menuItem = {
    name,
    description,
    price,
    popular,
    flavor,
    topping,
    temps,
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
