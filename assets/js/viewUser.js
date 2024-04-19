// \/ Drop down menu that will filter through All, Activated, and Deactivated and only display users of that type
let users;
const userStatus = document.getElementById("filter-users");
userStatus.addEventListener("change", async (event) => {
  if (userStatus.value === "All") {
    users = await fetchUsersFromServer("all");
  } else if (userStatus.value === "Activated") {
    users = await fetchUsersFromServer("activated");
  } else if (userStatus.value === "Deactivated") {
    users = await fetchUsersFromServer("deactivated");
  }
  updateUsersSelect(users);
});

async function fetchUsersFromServer(status) {
  const response = await fetch(`/users/${status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users with status: ${status}`);
  }
  return response.json();
}
// Used to test if the function below will update the select multiple based on value in dropped down selected
// let users = [
//   { _id: 1, email: "user1@example.com" },
//   { _id: 2, email: "user2@example.com" },
// ];
// Function to update the users in the select element
function updateUsersSelect(users) {
  const selectElement = document.getElementById("users");

  // Clear existing options
  selectElement.innerHTML = "";

  // Add options for each user
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user._id;
    option.textContent = user.email;
    selectElement.appendChild(option);
  });
}

const userSelect = document.getElementById("users");
const activate = document.getElementById("activate");
const deactivate = document.getElementById("deactivate");

// async function displayUsers() {}

activate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.value
  );
  // Call the updateUserStatus function with the selected user IDs
  await updateUserStatus(selectedUserIds, true);
  alert("The selected users have been activated.");
});

deactivate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.value
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
