const addToppingButton = document.querySelector("input.submit");
console.log(addToppingButton);
addToppingButton.addEventListener("click", async () => {
  const getTopping = document.getElementById("topping").value;
  console.log(getTopping);
  const topping = { topping: getTopping };

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
