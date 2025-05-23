const incompleteButtons = document.querySelectorAll("button.incompleteButton");

for (const incompleteButton of incompleteButtons) {
  incompleteButton.addEventListener("click", async () => {
    const orderId = incompleteButton.value;

    incompleteButton.disabled = true;

    const response = await fetch(`/barista/completed/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/barista/completed";
    } else {
      console.log("error incompleting order");
    }
  });
}
