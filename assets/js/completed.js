const incompleteButtons = document.querySelectorAll("button.incompleteButton");

for (const incompleteButton of incompleteButtons) {
  incompleteButton.addEventListener("click", async () => {
    const orderId = incompleteButton.value;
    const response = await fetch(`/completed/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/completed";
    } else {
      console.log("error incompleting order");
    }
  });
}
