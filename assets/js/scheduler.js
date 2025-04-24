document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".period-checkbox");
  console.log("Found checkboxes:", checkboxes.length);

  for (const checkbox of checkboxes) {
    // Store initial state
    checkbox.setAttribute("data-initial-state", checkbox.checked);

    checkbox.addEventListener("change", async (event) => {
      event.preventDefault(); // Prevent default checkbox behavior until confirmed
      const originalState = checkbox.checked;
      checkbox.disabled = true;

      try {
        const periodId = checkbox.id.replace("period-", "");
        const data = {
          periodId: periodId,
          orderingDisabled: checkbox.checked,
        };

        const response = await fetch("/admin/updatePeriod", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          // Handle non-2xx responses without attempting to parse as JSON
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        } else {
          alert("Period updated successfully");
        }

        // Update the stored state after successful save
        checkbox.setAttribute("data-initial-state", checkbox.checked);
      } catch (error) {
        console.error("Error details:", error);
        // Revert to original state
        checkbox.checked = originalState;
        alert(`Failed to update period: ${error.message}`);
      } finally {
        checkbox.disabled = false;
      }
    });
  }
});

document.getElementById("schedules").addEventListener("change", () => {
  const selectedValue = document.getElementById("schedules").value;
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("id", selectedValue);

  // Create the updated URL with the new query parameter
  const updatedURL = `${window.location.origin}${
    window.location.pathname
  }?${urlParams.toString()}`;

  // redirect window
  window.location = updatedURL;
});

document.getElementById("deleteBtn").addEventListener("click", async () => {
  const id = document.getElementById("selectedScheduleId").value;
  if (id === document.getElementById("activeScheduleId").value) {
    alert("Cannot delete the active schedule");
    return;
  }

  try {
    const response = await fetch(`/admin/deleteSchedule`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      window.location = `/admin/scheduler`;
    }
  } catch (error) {
    console.error("Error deleting schedule: ", error);
  }
});
