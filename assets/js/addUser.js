const addUserButton = document.querySelector("input.submit");
addUserButton.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const userType = document.getElementById("userType").value;
  const user = { email, userType };

  addUserButton.disabled = true;

  const response = await fetch("/admin/addUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (response.ok) {
    window.location = "/admin/addUser";
  } else {
    console.log("error creating user");
  }
});
