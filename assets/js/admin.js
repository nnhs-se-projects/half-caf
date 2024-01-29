/**
 * contains client-side JavaScript function
 *  (primarily event handlers to fetch data from the Node server)
 */

const addUserButton = document.querySelector("input.submit");
addUserButton.addEventListener("click", async () => {
  const response = await fetch("/addUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (response.ok) {
    window.location = "/";
  } else {
    console.log("error adding user");
  }
});

const deleteUserButton = document.querySelector("input.submit");
deleteUserButton.addEventListener("click", async () => {
  const response = await fetch("/deleteUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (response.ok) {
    window.location = "/";
  } else {
    console.log("error deleting user");
  }
});

// const viewUserButton = document.querySelector("input.submit");
// viewUserButton.addEventListener("click", async () => {
//   const response = await fetch("/viewUser", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(entry),
//   });

//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error viewing user");
//   }
// });

const addDrinkButton = document.querySelector("input.submit");
addDrinkButton.addEventListener("click", async () => {
  const response = await fetch("/addDrink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (response.ok) {
    window.location = "/";
  } else {
    console.log("error adding drink");
  }
});

// const modifyDrinkButton = document.querySelector("input.submit");
// modifyDrinkButton.addEventListener("click", async () => {
//   const response = await fetch("/modifyDrink", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(entry),
//   });

//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error modifying drink");
//   }
// });

// const deleteDrinkButton = document.querySelector("input.submit");
// modifyDrinkButton.addEventListener("click", async () => {
//   const response = await fetch("/deleteDrink", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(entry),
//   });

//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error modifying drink");
//   }
// });

// const addFlavorButton = document.querySelector("input.submit");
// addFlavorButton.addEventListener("click", async () => {
//   const response = await fetch("/addFlavor", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(entry),
//   });

//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error modifying drink");
//   }
// });

// const deleteFlavorButton = document.querySelector("input.submit");
// deleteFlavorButton.addEventListener("click", async () => {
//   const response = await fetch("/deleteFlavor", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(entry),
//   });

//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error modifying drink");
//   }
// });

// const logoutButton = document.querySelector("input.submit");
// logoutButton.addEventListener("click", async () => {
//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error modifying drink");
//   }
// });
