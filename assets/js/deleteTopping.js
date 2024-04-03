/* eslint-disable no-unused-vars */
async function deleteTopping() {
  const selectedId = document.querySelector("#toDelete").value;
  const response = await fetch(`/deleteTopping/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/deleteTopping";
  } else {
    console.log("error delete topping");
  }
}
