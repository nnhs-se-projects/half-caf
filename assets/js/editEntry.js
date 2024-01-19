/**
 * contains client-side javaScript function
 *  (primarily event handlers to fetch data form the Node server)
 */
const submitButton = document.querySelector("input.submit");
const id = document.querySelector("#hiddenId").value;
submitButton.addEventListener("click", async () => {
  const date = document.querySelector("input.date").value;
  const habitOfMindButtons = document.querySelectorAll("input.habits:checked");
  const habitOfMind =
    habitOfMindButtons.length > 0 ? habitOfMindButtons[0].value : null;
  const content = document.querySelector("textarea.content").value;

  const entry = { date, habit: habitOfMind, content };
  const response = await fetch(`/editEntry/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (response.ok) {
    window.location = "/";
  } else {
    console.log("error creating entry");
  }
});

// eslint-disable-next-line no-unused-vars
async function deleteEntry(id) {
  const response = await fetch(`/removeEntry/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/";
  } else {
    console.log("error creating entry");
  }
}
