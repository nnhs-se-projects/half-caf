const removeButton = document.querySelectorAll("button.remove");
for (const button of removeButton) {
  button.addEventListener("click", async () => {
    const itemIndex = button.getAttribute("drink-index");

    const response = await fetch("/teacher/updateCart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ index: itemIndex }),
    });
    if (response.ok) {
      window.location = "/teacher/myCart";
    } else {
      console.log("error removing drink from cart");
    }
  });
}

const placeOrderButton = document.querySelector("input.placeOrder");
if (placeOrderButton !== null) {
  placeOrderButton.addEventListener("click", async () => {
    const roomNum = document.getElementById("rm").value;
    const time = new Date();

    if (roomNum === "") {
      alert("Please enter a room number.");
      return;
    }

    placeOrderButton.disabled = true; // ensure the user can't click this button multiple times while the page is loading the confirmation page
      const errorEl = document.getElementById("order-error");
      if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
      }

    // formatting time
    const year = time.getFullYear();
    const month = (time.getMonth() + 1).toString().padStart(2, "0");
    const day = time.getDate().toString().padStart(2, "0");
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const seconds = time.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours || 12;
    const formattedTime = `${year}-${month}-${day} at ${hours}:${minutes}${ampm}/${seconds}`;

    const response = await fetch("/teacher/myCart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rm: roomNum, timestamp: formattedTime }),
    });
    if (response.ok) {
      window.location = "/teacher/orderConfirmation";
    } else if (response.status === 409) {
      // Friendly inventory error from server
      try {
        const data = await response.json();
        const msg = data && data.message ? data.message : "Sorry — a few ingredients for your order are running low. Please adjust your cart or try again in a bit.";
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.textContent = msg;
          // If details provided, append them for clarity
          if (data && Array.isArray(data.details) && data.details.length > 0) {
            const list = document.createElement("ul");
            list.style.marginTop = "0.5rem";
            for (const d of data.details) {
              const li = document.createElement("li");
              const name = d.name || d.id || "Unknown ingredient";
              li.textContent = `${d.required} × ${name} (available: ${d.available})`;
              list.appendChild(li);
            }
            errorEl.appendChild(list);
          }
        } else {
          alert(msg);
        }
      } catch (e) {
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.textContent = "Sorry — a few ingredients for your order are running low. Please adjust your cart or try again in a bit.";
        } else {
          alert("Sorry — a few ingredients for your order are running low. Please adjust your cart or try again in a bit.");
        }
      }
      placeOrderButton.disabled = false;
    } else {
      // Generic error
      const generic = "There was a problem placing your order. Please try again.";
      if (errorEl) {
        errorEl.style.display = "block";
        errorEl.textContent = generic;
      } else {
        alert(generic);
      }
      placeOrderButton.disabled = false;
    }
  });
}
