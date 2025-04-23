const logOut = document.getElementById("logout");
const finish = document.getElementById("finish");
logOut.addEventListener("click", async () => {
  logOut.disabled = true;

  const response = await fetch("/delivery/logout", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.ok) {
    window.location = "/delivery";
  }
});

finish.addEventListener("click", async () => {
  finish.disabled = true;

  const response = await fetch("/delivery/finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.ok) {
    window.location = "/delivery/home";
  }
});
