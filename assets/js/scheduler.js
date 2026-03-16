document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".period-checkbox");
  console.log("Found checkboxes:", checkboxes.length);
  const scheduleSelect = document.getElementById("schedules");
  const deleteButton = document.getElementById("deleteBtn");
  const selectedScheduleIdInput = document.getElementById("selectedScheduleId");
  const activeScheduleIdInput = document.getElementById("activeScheduleId");

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

        // use unified toggle API so admins/baristas both work and toggle is immediate
        const response = await fetch("/togglePeriod", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          // Handle non-2xx responses without attempting to parse as JSON
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
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

  if (scheduleSelect) {
    scheduleSelect.addEventListener("change", () => {
      const selectedValue = scheduleSelect.value;
      if (!selectedValue) {
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("id", selectedValue);

      // Create the updated URL with the new query parameter
      const updatedURL = `${window.location.origin}${
        window.location.pathname
      }?${urlParams.toString()}`;

      // redirect window
      window.location = updatedURL;
    });
  }

  if (deleteButton) {
    if (!selectedScheduleIdInput || !selectedScheduleIdInput.value) {
      deleteButton.disabled = true;
    }

    deleteButton.addEventListener("click", async () => {
      const id = selectedScheduleIdInput ? selectedScheduleIdInput.value : "";
      const activeId = activeScheduleIdInput ? activeScheduleIdInput.value : "";

      if (!id) {
        alert("No schedule selected");
        return;
      }

      if (id === activeId) {
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
  }
});
