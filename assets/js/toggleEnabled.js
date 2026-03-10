const toggleEnabled = document.querySelector("input.toggle");

toggleEnabled.addEventListener("change", async () => {
  const getEnabled = document.getElementById("myCheckbox").checked;

  const isEnabled = { enabled: getEnabled };

  const response = await fetch("/toggle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(isEnabled),
  });

  if (!response.ok) {
    if (response.status === 403) {
      alert("Only admins may perform this action");
    } else {
      console.log("error toggling global state", response.status);
    }
  }

  // reload UI in any case so header stays in sync
  window.location = "/toggle";

  if (response.ok) {
    console.log("success");
  }
});
