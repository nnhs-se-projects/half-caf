const placeToOrderButton = document.querySelector("input.submit");
placeToOrderButton.addEventListener("click", async () => {
  // alert("clicked");
  const name = document.getElementById("name").textContent;
  const price = document.getElementById("price").textContent.match(/(\d+)/)[0];
  console.log(price);
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
  const temp = document.querySelector("input#temp:checked").value;
  console.log(temp);

  const instructions = document.getElementById("instructions").value;
  const favorite = document.getElementById("favorite").checked;

  // const caf = document.getElementById("caffeinated").checked;

  const drink = {
    name,
    price,
    checkedFlavors,
    checkedToppings,
    temp,
    instructions,
    favorite,
  };
  // caf,
  console.log(drink);
  // let urlSlug = name.replace("%20/", " ");
  // console.log(urlSlug);
  const response = await fetch(`/customizeDrink/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(drink),
  });

  if (response.ok) {
    window.location = "/teacherMyOrder";
  } else {
    console.log("error adding drink");
  }
});
