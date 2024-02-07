const addUserButton = document.querySelector("input.submit");
addUserButton.addEventListener("click", async () => {
  const email = document.querySelector("input.email").value;
  const userType = document.querySelectorAll("select.userType:checked");

  user = { email, userType };

  const response = await fetch("/addUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(email),
  });
});
