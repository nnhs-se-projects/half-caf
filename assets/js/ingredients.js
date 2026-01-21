document.addEventListener("DOMContentLoaded", function () {
  // --- Utility Functions ---
  function isSimilarName(name1, name2) {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    
    return commonWords.length > 0;
  }

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

  // Check for duplicates on name input blur
  const addNameInput = document.getElementById("addName");
  if (addNameInput) {
    addNameInput.addEventListener("blur", async function() {
      const name = this.value;
      if (!name) {
        document.getElementById("duplicateWarning").style.display = "none";
        return;
      }
      
      try {
        const response = await fetch(`/admin/api/ingredients/check-duplicates/${encodeURIComponent(name)}`);
        const { duplicates, aliases } = await response.json();
        
        const warningDiv = document.getElementById("duplicateWarning");
        if (!warningDiv) return;
        
        if (duplicates.length > 0) {
          warningDiv.innerHTML = `<strong style="color: #d32f2f;">⚠️ DUPLICATE FOUND!</strong><br/>Ingredient "${duplicates[0].name}" already exists.`;
          warningDiv.style.display = "block";
        } else if (aliases.length > 0) {
          warningDiv.innerHTML = `<strong style="color: #f57c00;">⚠️ Similar ingredients found:</strong><br/>${aliases.map(a => a.name).join(', ')}<br/><small>Did you mean one of these?</small>`;
          warningDiv.style.display = "block";
        } else {
          warningDiv.style.display = "none";
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
      }
    });
  }

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
        category: document.getElementById("addCategory").value,
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
        document.getElementById("editCategory").value = ingredient.category || 'other';
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
        category: document.getElementById("editCategory").value,
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

  // --- Export Handlers ---
  document.getElementById("exportJsonBtn").addEventListener("click", () => {
    window.location.href = "/admin/api/ingredients/export/json";
  });

  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    window.location.href = "/admin/api/ingredients/export/csv";
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
