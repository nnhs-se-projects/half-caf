/* eslint-disable no-unused-vars */

async function deleteUsers() {
  const selectedId = document.querySelector("#toDelete").value;
  const response = await fetch(`/admin/deleteUser/${selectedId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/admin/deleteUser";
  } else {
    console.log("error deleting user");
  }
}
