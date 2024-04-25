/* eslint-disable no-unused-vars */
async function deleteMenuItem() {
  const selectedId = document.querySelector("#toDelete").value;
  console.log(selectedId);
  const response = await fetch(`/deleteDrink/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/deleteDrink";
  } else {
    console.log("error");
  }
}
