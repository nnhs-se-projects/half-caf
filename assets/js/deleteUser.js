/* eslint-disable no-unused-vars */

async function deleteUsers() {
  const selectedId = document.querySelector("#toDelete").value;
  console.log(selectedId);
  const response = await fetch(`/deleteUser/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/deleteUser";
  } else {
    console.log("error");
  }
}
