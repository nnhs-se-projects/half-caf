const addDrinkButton = document.querySelector("input.submit");
addDrinkButton.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  const popular = document.getElementById("popular").checked;
  const temps = document.querySelectorAll("input.temps");
  let checkedTemps = [];
  for (let i = 0; i < temps.length; i++) {
    if (temps[i].checked) {
      checkedTemps.push(temps[i].value);
    }
  }
  const special = document.getElementById("special").checked;
  const flavors = document.querySelectorAll("input#flavors");
  let checkedFlavors = [];
  for (let i = 0; i < flavors.length; i++) {
    if (flavors[i].checked) {
      checkedFlavors.push(flavors[i].value);
    }
  }

  const toppings = document.querySelectorAll("input#toppings");
  let checkedToppings = [];
  for (let i = 0; i < toppings.length; i++) {
    if (toppings[i].checked) {
      checkedToppings.push(toppings[i].value);
    }
  }

  const caf = document.getElementById("caffeinated").checked;

  const menuItem = {
    name,
    description,
    price,
    popular,
    checkedFlavors,
    checkedToppings,
    checkedTemps,
    caf,
    special,
  };

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
});
