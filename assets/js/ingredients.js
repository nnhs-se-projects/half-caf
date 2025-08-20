document.addEventListener("DOMContentLoaded", function () {
  // --- Generic Modal Control ---
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("show");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("show");
  }

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });

  document.querySelectorAll(".close, .btn-cancel").forEach((button) => {
    button.addEventListener("click", function () {
      const modalId = this.getAttribute("data-modal");
      closeModal(modalId);
    });
  });

  // --- Add Ingredient Modal ---
  document.getElementById("addIngredientBtn").addEventListener("click", () => {
    openModal("addIngredientModal");
  });

  document
    .getElementById("addIngredientForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const data = {
        name: document.getElementById("addName").value,
        quantity: document.getElementById("addQuantity").value,
        orderThreshold: document.getElementById("addOrderThreshold").value,
        unit: document.getElementById("addUnit").value,
        price: document.getElementById("addPrice").value,
        type: document.getElementById("addType").checked
          ? "customizable"
          : "uncustomizable",
      };

      try {
        const response = await fetch("/admin/addIngredient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to add ingredient.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });

  // --- Edit Ingredient Modal ---
  document.querySelectorAll(".action-button.edit").forEach((button) => {
    button.addEventListener("click", async function () {
      const id = this.getAttribute("data-ingredient-id");
      try {
        const response = await fetch(`/admin/api/ingredient/${id}`);
        if (!response.ok) throw new Error("Failed to fetch ingredient data.");

        const ingredient = await response.json();

        document.getElementById("editIngredientId").value = ingredient._id;
        document.getElementById("editName").value = ingredient.name;
        document.getElementById("editQuantity").value = ingredient.quantity;
        document.getElementById("editOrderThreshold").value =
          ingredient.orderThreshold;
        document.getElementById("editUnit").value = ingredient.unit;
        document.getElementById("editPrice").value = ingredient.price;
        document.getElementById("editType").checked =
          ingredient.type === "customizable";

        openModal("editIngredientModal");
      } catch (error) {
        console.error("Error:", error);
        alert(error.message);
      }
    });
  });

  document
    .getElementById("editIngredientForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const id = document.getElementById("editIngredientId").value;
      const data = {
        name: document.getElementById("editName").value,
        quantity: document.getElementById("editQuantity").value,
        orderThreshold: document.getElementById("editOrderThreshold").value,
        unit: document.getElementById("editUnit").value,
        price: document.getElementById("editPrice").value,
        type: document.getElementById("editType").checked
          ? "customizable"
          : "uncustomizable",
      };

      try {
        const response = await fetch(`/admin/editIngredient/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to update ingredient.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });

  // --- Delete Ingredient Modal ---
  document.querySelectorAll(".action-button.delete").forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.getAttribute("data-ingredient-id");
      const name = this.getAttribute("data-ingredient-name");
      document.getElementById("deleteIngredientId").value = id;
      document.getElementById("deleteIngredientName").textContent = name;
      openModal("deleteIngredientModal");
    });
  });

  document
    .getElementById("deleteIngredientForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const id = document.getElementById("deleteIngredientId").value;
      try {
        const response = await fetch(`/admin/deleteIngredient/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to delete ingredient.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    });

  // --- Live Search ---
  const nameSearch = document.getElementById("nameSearch");
  if (nameSearch) {
    nameSearch.addEventListener("input", function () {
      const query = this.value.toLowerCase().trim();
      const rows = document.querySelectorAll("#ingredientsTable tbody tr");
      const noResults = document.getElementById("noResults");
      let visibleCount = 0;

      rows.forEach((row) => {
        const name = row.getAttribute("data-name");
        if (name.includes(query)) {
          row.style.display = "";
          visibleCount++;
        } else {
          row.style.display = "none";
        }
      });

      noResults.style.display = visibleCount === 0 ? "block" : "none";
    });
  }
});
