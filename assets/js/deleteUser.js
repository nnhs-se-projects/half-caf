/* eslint-disable no-unused-vars */
const selectedId = document.querySelector("select#toDelete").value;

async function deleteUsers() {
  console.log(selectedId);
  const response = await fetch(`/deleteUser/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("hi");

  if (response.ok) {
    window.location = "/deleteUser";
  } else {
    console.log("error");
  }
}
