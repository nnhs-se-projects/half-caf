document.addEventListener("DOMContentLoaded", () => {
  const reloadButton = document.querySelector(".reload-button");
  reloadButton.addEventListener("click", () => {
    window.location.href = "/deliveryHome";
  });
  const claimButtons = document.querySelectorAll("button.claimButton");
  for (const claimButton of claimButtons) {
    claimButton.addEventListener("click", async () => {
      const orderId = claimButton.value;
      claimButton.disabled = true;

      const response = await fetch(`/deliveryProgress/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location = `/deliveryProgress/${orderId}`;
      } else {
        console.log("error claiming order");
      }
    });
  }
});
