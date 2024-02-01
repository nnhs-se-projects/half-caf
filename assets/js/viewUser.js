const userStatus = document.getElementById("filter-users");
console.log("userStatus: " + userStatus);
userStatus.addEventListener("change", (event) => {
  if (userStatus.value === "All") {
    // alert("All");
  } else if (userStatus.value === "Activated") {
    // alert("Activated");
  } else if (userStatus.value === "Unactivated") {
    // alert("Unactivated");
  }
});
