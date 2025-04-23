document.addEventListener("DOMContentLoaded", () => {
  const reloadButton = document.querySelector(".reload-button");
  reloadButton.addEventListener("click", () => {
    window.location.href = "/delivery/home";
  });
  const claimButtons = document.querySelectorAll("button.claimButton");
  for (const claimButton of claimButtons) {
    claimButton.addEventListener("click", async () => {
      const orderId = claimButton.value;
      claimButton.disabled = true;

      const response = await fetch(`/delivery/progress/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.url.indexOf("deliveryProgress") === -1) {
        alert("Order invalid, try a different order.");
        window.location = response.url;
      } else if (response.ok) {
        window.location = `/delivery/progress/${orderId}`;
      } else {
        console.log("error claiming order");
      }
    });
  }
});
