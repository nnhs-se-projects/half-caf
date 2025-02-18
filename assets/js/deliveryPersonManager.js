document.querySelector("input.submit").addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const pin = document.getElementById("pin").value;

  if (!name) {
    alert("Please enter a name");
    return;
  }
  if (!pin) {
    alert("Please enter a pin");
    return;
  }
  const response = await fetch("/addDeliveryPerson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      pin,
    }),
  });

  if (response.ok) {
    window.location = "/deliveryPersonManager";
  } else {
    alert("Server error");
  }
});

document.getElementById("delete").addEventListener("click", async () => {
  const selectUserId = document.getElementById("deliveryPerson").value;
  const response = await fetch("/deleteDeliveryPerson", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: selectUserId,
    }),
  });
  if (response.ok) {
    window.location = "/DeliveryPersonManager";
  } else {
    alert("Server error");
  }
});
