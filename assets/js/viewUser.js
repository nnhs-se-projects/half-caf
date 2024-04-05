const userStatus = document.getElementById("filter-users");
userStatus.addEventListener("change", (event) => {
  if (userStatus.value === "All") {
    // alert("All");
  } else if (userStatus.value === "Activated") {
    // alert("Activated");
  } else if (userStatus.value === "Deactivated") {
    // alert("Deactivated");
  }
});
const userSelect = document.getElementById("users");
const activate = document.getElementById("activate");
const deactivate = document.getElementById("deactivate");
// get selected options

activate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.id
  );
  console.log(selectedUserIds);

  // Call the updateUserStatus function with the selected user IDs
  await updateUserStatus(selectedUserIds, true);
});

deactivate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.id
  );
  console.log(selectedUserIds);

  // Call the updateUserStatus function with the selected user IDs
  await updateUserStatus(selectedUserIds, false);
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
    console.log(
      `${isActivated ? "Activated" : "Deactivated"} users successfully.`
    );
    console.log("users activated/deactivated: " + userIds);
  } catch (error) {
    console.error("Error:", error);
  }
}
