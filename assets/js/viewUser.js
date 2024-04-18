// \/ Drop down menu that will filter through All, Activated, and Deactivated and only display users of that type
const userStatus = document.getElementById("filter-users");
userStatus.addEventListener("change", (event) => {
  if (userStatus.value === "All") {
    alert("All");
    let users = [{ _id: 1, email: "user1@example.com" }]; // all the users in the database
  } else if (userStatus.value === "Activated") {
    alert("Activated");
    let users = [{}]; // the users with isActivated value == true
    updateUsersSelect();
  } else if (userStatus.value === "Deactivated") {
    alert("Deactivated");
    let users = [{}]; // the users with isActivated value == false
  }
});

// let users = [{ _id: 1, email: "user1@example.com" }]; // test to see if the below function works in using the dropdown menu to filter the options in the select multiple
// function to update users for selected element (all, activated, deactivated)
function updateUsersSelect() {
  let selectElement = document.getElementById("users");

  // Clear existing options
  selectElement.innerHTML = "";

  // Add options for each user
  users.forEach((user) => {
    let option = document.createElement("option");
    option.value = user._id;
    option.textContent = user.email;
    selectElement.appendChild(option);
  });
}
// Select Multiple, Activate button, and Deactivate button Ids
const userSelect = document.getElementById("users");
const activate = document.getElementById("activate");
const deactivate = document.getElementById("deactivate");

// async function displayUsers() {}

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
