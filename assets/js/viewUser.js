const userStatus = document.getElementById("filter-users");
userStatus.addEventListener("change", (event) => {
  if (userStatus.value === "All") {
    alert("All");
  } else if (userStatus.value === "Activated") {
    alert("Activated");
  } else if (userStatus.value === "Deactivated") {
    alert("Deactivated");
  }
});

const userSelect = document.getElementById("users");
const activate = document.getElementById("activate");
const deactivate = document.getElementById("deactivate");

async function displayUsers() {}

activate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.id
  );
  // Call the updateUserStatus function with the selected user IDs
  await updateUserStatus(selectedUserIds, true);
  alert("The selected users have been activated.");
});

deactivate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.id
  );
  // Call the updateUserStatus function with the selected user IDs
  await updateUserStatus(selectedUserIds, false);
  alert("The selected users have been deactivated.");
});

async function updateUserStatus(userIds, isActivated) {
  try {
    await fetch("/updateUserStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds, isActivated }),
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
