/**
 * contains client-side JavaScript function
 *  (primarily event handlers to fetch data from the Node server)
 */

// const submitButton = document.querySelector("input.submit");
// submitButton.addEventListener("click", async () => {
//   // get the values entered by the user
//   const date = document.querySelector("input.date").value;

//   // a more sophisticated select that selects all input elements of class
//   //  habits that are checked
//   const habitOfMindButtons = document.querySelectorAll("input.habits:checked");
//   const habitOfMind =
//     habitOfMindButtons.length > 0 ? habitOfMindButtons[0].value : null;

//   const content = document.querySelector("textarea.content").value;
//   const entry = { date, habit: habitOfMind, content };

//   const response = await fetch("/barista", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(entry),
//   });

//   if (response.ok) {
//     window.location = "/";
//   } else {
//     console.log("error creating entry");
//   }
// });

// const disableEnableButton = document.querySelector("dis/en");

// disableEnableButton.addEventListener("click", function () {
//   disableEnableButton.changeText();
// });

// function changeText() {
//   if (disableEnableButton.textContent == "Enable") {
//     disableEnableButton.textContent == "Disable";
//   } else {
//     disableEnableButton.textContent == "Enable";
//   }
// }

// let num = $("#orders option").length;
