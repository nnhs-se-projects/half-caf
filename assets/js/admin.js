/**
 * contains client-side JavaScript function
 *  (primarily event handlers to fetch data from the Node server)
 */
const userStatus = document.getElementById("filter-users");

userStatus.addEventListener("change", (event) => {
  if (userStatus.value === "All") {
    alert("All");
  } else if (userStatus.value === "Activated") {
    alert("Activated");
  } else if (userStatus.value === "Unactivated") {
    alert("Unactivated");
  }
});

//temp alerts to let me know its working
//will change the actual page later
