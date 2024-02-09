/* eslint-disable no-unused-vars */
const deleteUser = document.querySelector("input.submit");
console.log("delUser: " + deleteUser);
deleteUser.addEventListener("click", async () => {
  var selectedUser = document.getElementById("toDelete");
  selectedUser.remove(selectedUser.selectedIndex);
});

const selectedEmail = document.querySelector("select#toDelete");

function test() {
  console.log("heyyy");
}

// temp deletes temp users
// eslint-disable-next-line no-unused-vars
async function deleteUsers(id) {
  console.log(id);
  const response = await fetch(`/removeUser/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    window.location = "/deleteUser";
  }
}
