/* eslint-disable no-unused-vars */
async function deleteIngredient() {
  const selectedId = document.querySelector("#toDelete").value;
  const response = await fetch(`/admin/deleteIngredient/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/admin/deleteIngredient";
  } else {
    console.log("error delete ingredient");
  }
}
