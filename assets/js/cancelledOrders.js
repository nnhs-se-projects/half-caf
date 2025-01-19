const uncancelButtons = document.querySelectorAll("button.uncancelButton");

for (const uncancelButton of uncancelButtons) {
  uncancelButton.addEventListener("click", async () => {
    const orderId = uncancelButton.value;
    const response = await fetch(`/cancelledOrders/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/cancelledOrders";
    } else {
      console.log("error uncancelling order");
    }
  });
}
