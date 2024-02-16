const addDrinkButton = document.querySelector("input.submit");
addDrinkButton.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  let popular = document.getElementById("popular");

  const menuItem = { name, description, price, popular };
  console.log(menuItem);

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
