document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".edit-room").forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-order-id");
      const roomDisplay = document.querySelector(
        `.room-display[data-order-id="${orderId}"]`,
      );
      const editControls = this.nextElementSibling;
      const roomInput = editControls.querySelector(".room-input");

      // Hide display and edit button, show edit controls
      roomDisplay.style.display = "none";
      this.style.display = "none";
      editControls.style.display = "flex";
      roomInput.focus();
    });
  });

  document.querySelectorAll(".save-room").forEach((button) => {
    button.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-order-id");
      const editControls = this.parentElement;
      const roomBadge = editControls.parentElement;
      const roomDisplay = roomBadge.querySelector(
        `.room-display[data-order-id="${orderId}"]`,
      );
      const editButton = roomBadge.querySelector(
        `.edit-room[data-order-id="${orderId}"]`,
      );
      const roomInput = editControls.querySelector(".room-input");
      const newRoom = roomInput.value.trim();

      if (!newRoom) {
        alert("Room number cannot be empty");
        return;
      }

      try {
        const response = await fetch("/teacher/updateRoom", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId, newRoom }),
        });
        if (response.ok) {
          // Update display
          roomDisplay.textContent = newRoom;
          // Toggle display
          roomDisplay.style.display = "inline";
          editButton.style.display = "flex";
          editControls.style.display = "none";
        } else {
          alert("Room update failed");
        }
      } catch (e) {
        console.error(e);
        alert("An error occurred while updating the room");
      }
    });
  });

  // Handle pressing Enter in the input field
  document.querySelectorAll(".room-input").forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.parentElement.querySelector(".save-room").click();
      } else if (e.key === "Escape") {
        e.preventDefault();
        const orderId = this.getAttribute("data-order-id");
        const editControls = this.parentElement;
        const roomBadge = editControls.parentElement;
        const roomDisplay = roomBadge.querySelector(
          `.room-display[data-order-id="${orderId}"]`,
        );
        const editButton = roomBadge.querySelector(
          `.edit-room[data-order-id="${orderId}"]`,
        );

        // Cancel edit mode
        roomDisplay.style.display = "inline";
        editButton.style.display = "flex";
        editControls.style.display = "none";
      }
    });
  });

  // Initialize cancel buttons and timers
  function initializeCancelButtons() {
    const cancelButtons = document.querySelectorAll(".cancel-order-btn");

    cancelButtons.forEach((button) => {
      const orderId = button.getAttribute("data-order-id");
      const timerEl = document.querySelector(
        `.cancel-timer[data-order-id="${orderId}"]`,
      );
      const confirmedAtStr = timerEl.getAttribute("data-confirmed-at");

      if (!confirmedAtStr) {
        button.disabled = true;
        button.style.opacity = "0.5";
        return;
      }

      const confirmedAt = new Date(confirmedAtStr);

      // Start timer countdown
      const updateTimer = () => {
        const now = new Date();
        const secondsElapsed = (now - confirmedAt) / 1000;
        const secondsRemaining = Math.max(0, 30 - Math.floor(secondsElapsed));

        if (secondsRemaining > 0) {
          timerEl.textContent = `(${secondsRemaining}s)`;
          timerEl.classList.add("warning");

          if (secondsRemaining <= 10) {
            timerEl.style.color = "#ff6b6b";
          }
        } else {
          timerEl.textContent = "(Expired)";
          timerEl.classList.add("expired");
          button.disabled = true;
          button.style.opacity = "0.5";
          clearInterval(timerId);
        }
      };

      updateTimer();
      const timerId = setInterval(updateTimer, 1000);

      // Add cancel click handler
      button.addEventListener("click", async () => {
        const now = new Date();
        const secondsElapsed = (now - confirmedAt) / 1000;

        if (secondsElapsed > 30) {
          alert(
            "Order can no longer be cancelled (30 second window has passed)",
          );
          button.disabled = true;
          return;
        }

        if (!confirm("Are you sure you want to cancel this order?")) {
          return;
        }

        button.disabled = true;
        button.style.opacity = "0.5";

        try {
          const response = await fetch(`/teacher/cancelOrder/${orderId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            alert("Order cancelled successfully!");
            // Refresh the page to update the order list
            window.location.reload();
          } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error || "Failed to cancel order"}`);
            button.disabled = false;
            button.style.opacity = "1";
          }
        } catch (error) {
          console.error("Error cancelling order:", error);
          alert("An error occurred while cancelling the order");
          button.disabled = false;
          button.style.opacity = "1";
        }
      });
    });
  }

  initializeCancelButtons();
});
