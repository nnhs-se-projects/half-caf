document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".edit-room").forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-order-id");
      const roomDisplay = document.querySelector(
        `.room-display[data-order-id="${orderId}"]`
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
        `.room-display[data-order-id="${orderId}"]`
      );
      const editButton = roomBadge.querySelector(
        `.edit-room[data-order-id="${orderId}"]`
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
          `.room-display[data-order-id="${orderId}"]`
        );
        const editButton = roomBadge.querySelector(
          `.edit-room[data-order-id="${orderId}"]`
        );

        // Cancel edit mode
        roomDisplay.style.display = "inline";
        editButton.style.display = "flex";
        editControls.style.display = "none";
      }
    });
  });
});
