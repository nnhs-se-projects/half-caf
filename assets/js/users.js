document.addEventListener("DOMContentLoaded", function () {
  // Modal functionality
  const modals = document.querySelectorAll(".modal");
  const closeButtons = document.querySelectorAll(".close, .btn-cancel");

  // Search functionality
  const searchInput = document.getElementById("emailSearch");
  const usersTable = document.getElementById("usersTable");
  const noResults = document.getElementById("noResults");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();
      const rows = usersTable.querySelectorAll("tbody tr");
      let visibleCount = 0;

      rows.forEach((row) => {
        const email = row.getAttribute("data-email");

        if (email && email.includes(searchTerm)) {
          row.style.display = "";
          visibleCount++;
        } else {
          row.style.display = "none";
        }
      });

      // Show/hide no results message
      if (visibleCount === 0 && searchTerm !== "") {
        noResults.style.display = "block";
        usersTable.style.display = "none";
      } else {
        noResults.style.display = "none";
        usersTable.style.display = "table";
      }
    });
  }

  // Open modal function
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  }

  // Close modal function
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  }

  // Close modal when clicking outside
  modals.forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close modal buttons
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modalId = this.getAttribute("data-modal");
      if (modalId) {
        closeModal(modalId);
      }
    });
  });

  // Add User button
  const addUserBtn = document.getElementById("addUserBtn");
  if (addUserBtn) {
    addUserBtn.addEventListener("click", function () {
      openModal("addUserModal");
    });
  }

  // Edit buttons
  const editButtons = document.querySelectorAll(".action-button.edit");
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const userId = this.getAttribute("data-user-id");
      const userEmail = this.getAttribute("data-user-email");
      const userType = this.getAttribute("data-user-type");

      // Populate edit form
      document.getElementById("editUserId").value = userId;
      document.getElementById("editUserEmail").value = userEmail;
      document.getElementById("editUserType").value = userType;

      openModal("editUserModal");
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll(".action-button.delete");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const userId = this.getAttribute("data-user-id");
      const userEmail = this.getAttribute("data-user-email");

      // Populate delete form
      document.getElementById("deleteUserId").value = userId;
      document.getElementById("deleteUserEmail").textContent = userEmail;

      openModal("deleteUserModal");
    });
  });

  // Form submissions
  const addUserForm = document.getElementById("addUserForm");
  const editUserForm = document.getElementById("editUserForm");
  const deleteUserForm = document.getElementById("deleteUserForm");

  if (addUserForm) {
    addUserForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("addUserEmail").value;
      const userType = document.getElementById("addUserType").value;
      const user = { email, userType };
      console.log("Adding user:", user);

      try {
        const response = await fetch("/admin/addUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          console.log("User added successfully");
          // Refresh the page to show the new user
          window.location.reload();
        } else {
          const errorData = await response.json();
          console.error("Error creating user:", errorData);
          alert(
            "Error creating user: " + (errorData.message || "Unknown error")
          );
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error occurred while creating user");
      }

      closeModal("addUserModal");
    });
  }

  if (editUserForm) {
    editUserForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const id = document.getElementById("editUserId").value;
      const email = document.getElementById("editUserEmail").value;
      const role = document.getElementById("editUserType").value;

      const user = {
        email,
        role,
      };

      try {
        const response = await fetch(`/admin/modifyUser/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          console.log("Edit user form submitted");
          window.location.reload();
        }
      } catch (error) {
        console.error("Error updating drink: ", error);
      }
      closeModal("editUserModal");
    });
  }

  if (deleteUserForm) {
    deleteUserForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const userId = document.getElementById("deleteUserId").value;

      try {
        const response = await fetch(`/admin/deleteUser/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log("User deleted successfully");
          window.location.reload(); // Reload to show updated table
        } else {
          console.log("Error deleting user");
          alert("Failed to delete user");
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error occurred while deleting user");
      }

      closeModal("deleteUserModal");
    });
  }

  // ESC key to close modals
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      modals.forEach((modal) => {
        if (modal.classList.contains("show")) {
          closeModal(modal.id);
        }
      });
    }
  });
});
