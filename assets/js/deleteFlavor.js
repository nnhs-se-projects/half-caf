/* eslint-disable no-unused-vars */
async function deleteFlavor() {
  const selectedId = document.querySelector("#toDelete").value;
  const response = await fetch(`/deleteFlavor/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/deleteFlavor";
  } else {
    console.log("error deleting flavor");
  }
}
