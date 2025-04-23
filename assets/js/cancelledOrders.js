const uncancelButtons = document.querySelectorAll("button.uncancelButton");

for (const uncancelButton of uncancelButtons) {
  uncancelButton.addEventListener("click", async () => {
    const orderId = uncancelButton.value;

    uncancelButton.disabled = true;

    const response = await fetch(`/barista/cancelledOrders/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/barista/cancelledOrders";
    } else {
      console.log("error uncancelling order");
    }
  });
}
