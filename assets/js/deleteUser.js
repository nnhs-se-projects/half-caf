const deleteUser = document.querySelector("button.delUserBt");
console.log("delUser: " + deleteUser);
deleteUser.addEventListener("click", async () => {
  var selectedUser = document.getElementById("toDelete");
  selectedUser.remove(selectedUser.selectedIndex);
});

// temp deletes temp users
