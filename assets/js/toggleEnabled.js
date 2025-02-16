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

  window.location = "/toggle";

  if (response.ok) {
    console.log("success");
  } else {
    console.log("error");
  }
});
