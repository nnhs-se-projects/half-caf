const addToppingButton = document.querySelector("input.submit");

addToppingButton.addEventListener("click", async () => {
  const getTopping = document.getElementById("topping").value;
  let getToppingPrice = document.getElementById("toppingPrice").value;
  console.log(getToppingPrice + "!");
  if (getToppingPrice === "") {
    getToppingPrice = "0$";
  }

  const topping = { topping: getTopping, price: getToppingPrice };

  const response = await fetch("/addTopping", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(topping),
  });

  if (response.ok) {
    window.location = "/addTopping";
  } else {
    console.log("error adding topping");
  }
});
