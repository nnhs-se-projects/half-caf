/* eslint-disable no-unused-vars */
async function deleteFlavor() {
  const selectedId = document.querySelector("#toDelete").value;
  console.log(selectedId);
  const response = await fetch(`/deleteFlavor/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/deleteFlavor";
  } else {
    console.log("error");
  }
}
