const loginButton = document.getElementById("login");
loginButton.addEventListener("click", async () => {
  const selectUserId = document.getElementById("deliveryPerson").value;
  const attemptedPin = document.getElementById("password").value;
  try {
    const response = await fetch("deliveryLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: selectUserId,
        pin: attemptedPin,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      window.location = `/deliveryMenu?id=${data.id}`;
    } else {
      console.error("Server error:", data.error);
    }
  } catch (error) {
    console.error("Error logging in: ", error);
  }
});
