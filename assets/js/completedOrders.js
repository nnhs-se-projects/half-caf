const incompleteButtons = document.querySelectorAll("button.incompleteButton");

for (const incompleteButton of incompleteButtons) {
  incompleteButton.addEventListener("click", async () => {
    const orderId = incompleteButton.value;

    incompleteButton.disabled = true;

    const response = await fetch(`/barista/completedOrders/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/barista/completedOrders";
    } else {
      console.log("error incompleting order");
    }
  });
}
