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

const activate = document.getElementById("activate");
activate.addEventListener("click", async () => {
  user.isActivated = true;
  console.log("clicked");
});
console.log(activate);
const deactivate = document.getElementById("deactivate");
deactivate.addEventListener("click", async () => {
  user.isActivated = false;
  console.log("clicked");
});
