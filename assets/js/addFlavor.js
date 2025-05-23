// creates a flavor with a name chosen by an admin
const addFlavorButton = document.querySelector("input.submit");
addFlavorButton.addEventListener("click", async () => {
  const getFlavor = document.getElementById("flavor").value;
  const flavor = { flavor: getFlavor };

  addFlavorButton.disabled = true;

  const response = await fetch("/admin/addFlavor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flavor),
  });

  if (response.ok) {
    window.location = "/admin/addFlavor";
  } else {
    console.log("error adding flavor");
  }
});
