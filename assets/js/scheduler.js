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
    const response = await fetch(`/deleteSchedule`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      window.location = `/scheduler`;
    }
  } catch (error) {
    console.error("Error deleting schedule: ", error);
  }
});
