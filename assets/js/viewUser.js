const userStatus = document.getElementById("filter-users");
console.log("userStatus: " + userStatus);
userStatus.addEventListener("change", (event) => {
  if (userStatus.value === "All") {
    // alert("All");
  } else if (userStatus.value === "Activated") {
    // alert("Activated");
  } else if (userStatus.value === "Deactivated") {
    // alert("Deactivated");
  }
});

// the activate user button on the view user page, updates the isActivated property to true
  // currently updates all users, will need to change to just the selected users
const activate = document.getElementById("activate");
activate.addEventListener("click", async () => {
  for (let user of users) {
    user.isActivated = true;
    console.log("is activated:" + user.isActivated);
  }
  console.log("activate");
});

// the deactivate user button on the view user page, updates the isActivated property to false
  // currently updates all users, will need to change to just the selected users
const deactivate = document.getElementById("deactivate");
deactivate.addEventListener("click", async () => {
  for (let user of users) {
    user.isActivated = false;
    console.log("is activated: " + user.isActivated);
  }
  console.log("deactivate");
});
