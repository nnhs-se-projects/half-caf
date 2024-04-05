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

  // // Get the selected option element
  // const selectedOption = userSelect.options[userSelect.selectedIndex];

  // // Access the ID of the selected option
  // const selectedOptionId = selectedOption.value;

  // const selectedUserIds = Array.from(users.selectedOptions).map(
  //   (select) => option.email
  // );
  // await updateUserStatus(selectedUserIds, true);
});

deactivate.addEventListener("click", async () => {
  // Get the selected user IDs
  const selectedUserIds = Array.from(userSelect.selectedOptions).map(
    (option) => option.id
  );
  console.log(selectedUserIds);

  // Call the updateUserStatus function with the selected user IDs
  await updateUserStatus(selectedUserIds, false);
  // const selectedUserIds = Array.from(users.selectedOptions).map(
  //   (option) => option.email
  // );
  // await updateUserStatus(selectedUserIds, false);
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

// the activate user button on the view user page, updates the isActivated property to true
// currently updates all users, will need to change to just the selected users

// const activate = document.getElementById("activate");
// activate.addEventListener("click", async () => {
//   for (let user of users) {
//     user.isActivated = true;
//     console.log("is activated: " + user.isActivated + ", user: " + user);
//   }
//   console.log("activate");
// });

// // the deactivate user button on the view user page, updates the isActivated property to false
// // currently updates all users, will need to change to just the selected users
// const deactivate = document.getElementById("deactivate");
// deactivate.addEventListener("click", async () => {
//   for (let user of users) {
//     user.isActivated = false;
//     console.log("is activated?: " + user.isActivated + ", user: " + user.email);
//   }
//   console.log("deactivate");
// });
