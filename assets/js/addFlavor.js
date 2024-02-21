const addFlavorButton = document.querySelector("input.submit");
console.log(addFlavorButton);
addFlavorButton.addEventListener("click", async () => {
  const getFlavor = document.getElementById("flavor").value;
  console.log(getFlavor);
  const flavor = { flavor: getFlavor };

  const response = await fetch("/addFlavor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flavor),
  });

  if (response.ok) {
    window.location = "/addFlavor";
  } else {
    console.log("error adding flavor");
  }
});
