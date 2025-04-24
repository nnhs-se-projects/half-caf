const loginButton = document.getElementById("login");
loginButton.addEventListener("click", async () => {
  const selectUserId = document.getElementById("deliveryPerson").value;
  const attemptedPin = document.getElementById("password").value;
  const response = await fetch("/delivery/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: selectUserId,
      pin: attemptedPin,
    }),
  }).then((response) => {
    if (response.redirected) {
      window.location.href = response.url;
    }
  });

  if (!response.ok) {
    console.log("error logging in");
  }
});
