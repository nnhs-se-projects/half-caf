const addUserButton = document.querySelector("input.submit");
addUserButton.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const userType = document.getElementById("userType").value;
  alert("data..." + email + " " + userType);
  const user = { isActivated: true, email: email, userType: userType };

  const response = await fetch("/addUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (response.ok) {
    window.location = "/addUser";
  } else {
    console.log("error creating user");
  }
});
