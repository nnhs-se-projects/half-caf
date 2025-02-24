const logOut = document.getElementById("logout");
const finish = document.getElementById("finish");
logOut.addEventListener("click", async () => {
  logOut.disabled = true;

  const response = await fetch("/deliveryLogOut", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.ok) {
    window.location = "/deliveryLogin";
  }
});

finish.addEventListener("click", async () => {
  finish.disabled = true;

  const response = await fetch("/deliveryFinish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.ok) {
    window.location = "/deliveryHome";
  }
});
