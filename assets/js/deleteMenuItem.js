/* eslint-disable no-unused-vars */
async function deleteMenuItem() {
  const selectedId = document.querySelector("#toDelete").value;
  const response = await fetch(`/admin/deleteDrink/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/admin/deleteDrink";
  } else {
    console.log("error");
  }
}
