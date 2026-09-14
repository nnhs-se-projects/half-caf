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

  // --- period add / edit / delete (admin only; the buttons are not rendered
  //     for other roles, so every lookup below is guarded) ---

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("show");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("show");
  }

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });

  document.querySelectorAll(".close, .btn-cancel").forEach((button) => {
    button.addEventListener("click", function () {
      closeModal(this.getAttribute("data-modal"));
    });
  });

  // times come back from the form as "HH:MM" and are stored as "7:05 AM"
  function readPeriodForm(prefix) {
    const start = document.getElementById(prefix + "PeriodStart").value;
    const end = document.getElementById(prefix + "PeriodEnd").value;
    return {
      name: document.getElementById(prefix + "PeriodName").value.trim(),
      start: convertTimeToAmPm(start),
      end: convertTimeToAmPm(end),
    };
  }

  async function submitPeriod(url, body, button) {
    button.disabled = true;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        window.location.reload();
        return;
      }

      const error = await response.json().catch(() => ({}));
      alert(error.message || "Could not save the period.");
    } catch (error) {
      console.error("Error saving period: ", error);
      alert("A network error occurred while saving the period.");
    } finally {
      button.disabled = false;
    }
  }

  const addPeriodBtn = document.getElementById("addPeriodBtn");
  if (addPeriodBtn) {
    addPeriodBtn.addEventListener("click", () => openModal("addPeriodModal"));
  }

  const addPeriodForm = document.getElementById("addPeriodForm");
  if (addPeriodForm) {
    addPeriodForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const period = readPeriodForm("add");
      period.scheduleId = selectedScheduleIdInput
        ? selectedScheduleIdInput.value
        : "";

      if (!period.scheduleId) {
        alert("No schedule selected");
        return;
      }

      await submitPeriod(
        "/admin/addPeriod",
        period,
        addPeriodForm.querySelector(".btn-submit"),
      );
    });
  }

  document.querySelectorAll(".edit-period").forEach((button) => {
    button.addEventListener("click", function () {
      document.getElementById("editPeriodId").value =
        this.getAttribute("data-period-id");
      document.getElementById("editPeriodName").value =
        this.getAttribute("data-period-name");
      document.getElementById("editPeriodStart").value = convertAmPmToTime(
        this.getAttribute("data-period-start"),
      );
      document.getElementById("editPeriodEnd").value = convertAmPmToTime(
        this.getAttribute("data-period-end"),
      );
      openModal("editPeriodModal");
    });
  });

  const editPeriodForm = document.getElementById("editPeriodForm");
  if (editPeriodForm) {
    editPeriodForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editPeriodId").value;
      await submitPeriod(
        `/admin/editPeriod/${id}`,
        readPeriodForm("edit"),
        editPeriodForm.querySelector(".btn-submit"),
      );
    });
  }

  document.querySelectorAll(".delete-period").forEach((button) => {
    button.addEventListener("click", async function () {
      const id = this.getAttribute("data-period-id");
      const name = this.getAttribute("data-period-name");

      if (!confirm(`Delete the "${name}" period from this schedule?`)) {
        return;
      }

      this.disabled = true;
      try {
        const response = await fetch(`/admin/deletePeriod/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          window.location.reload();
          return;
        }

        const error = await response.json().catch(() => ({}));
        alert(error.message || "Could not delete the period.");
      } catch (error) {
        console.error("Error deleting period: ", error);
        alert("A network error occurred while deleting the period.");
      } finally {
        this.disabled = false;
      }
    });
  });

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
