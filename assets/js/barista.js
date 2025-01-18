const cancelButtons = document.querySelectorAll("button.cancelButton");

for (const cancelButton of cancelButtons) {
  cancelButton.addEventListener("click", async () => {
    const orderId = cancelButton.value;
    const response = await fetch(`/barista/${orderId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/barista";
    } else {
      console.log("error deleting order");
    }
  });
}

const finishButtons = document.querySelectorAll("button.finishButton");

for (const finishButton of finishButtons) {
  finishButton.addEventListener("click", async () => {
    const orderId = finishButton.value;
    const response = await fetch(`/barista/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location = "/barista";
    } else {
      console.log("error finishing order");
    }
  });
}
