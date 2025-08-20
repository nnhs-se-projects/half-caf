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

  function handleIngredientCheckboxChange(checkbox) {
    const countInput = checkbox
      .closest(".ingredient-item")
      .querySelector(".ingredient-count");
    if (countInput) {
      countInput.style.display = checkbox.checked ? "block" : "none";
    }
  }

  // --- Add Drink Modal ---
  const addDrinkBtn = document.getElementById("addDrinkBtn");
  if (addDrinkBtn) {
    addDrinkBtn.addEventListener("click", () => openModal("addDrinkModal"));
  }

  let addSrcData = ""; // Define it properly in a visible scope

  const addImageInput = document.getElementById("addImage");
  if (addImageInput) {
    addImageInput.addEventListener("change", () => {
      const imageElement = document.getElementById("addDrinkImg");
      const filesSelected = addImageInput.files;

      if (filesSelected.length > 0) {
        const fileToLoad = filesSelected[0];

        // Add file type validation like in addDrink.js
        let goodType = false;
        const fileExt = fileToLoad.name
          .substring(fileToLoad.name.lastIndexOf(".") + 1)
          .toLowerCase();

        switch (fileExt) {
          case "jpg":
          case "jpeg":
          case "png":
          case "webp":
          case "heic":
          case "heif":
            goodType = true;
            break;
        }

        if (!goodType) {
          alert(
            "Please select a valid image type (jpg, jpeg, png, webp, heic, heif)"
          );
          addImageInput.value = ""; // Reset the file input
          imageElement.src = "";
          imageElement.style.display = "none";
          addSrcData = "";
          return;
        }

        const fileReader = new FileReader();
        fileReader.onload = (fileLoadedEvent) => {
          addSrcData = fileLoadedEvent.target.result; // Store the base64 data
          imageElement.src = addSrcData;
          imageElement.style.display = "block";
        };
        fileReader.readAsDataURL(fileToLoad);
      } else {
        addSrcData = "";
        imageElement.src = "";
        imageElement.style.display = "none";
      }
    });
  }

  const addCaf = document.getElementById("addCaffeinated");
  const addAllowDecaf = document.getElementById("addAllowDecaf");
  if (addCaf && addAllowDecaf) {
    addCaf.addEventListener("click", () => {
      addAllowDecaf.parentElement.hidden = !addCaf.checked;
      if (!addCaf.checked) {
        addAllowDecaf.checked = false;
      }
    });
  }

  document
    .querySelectorAll("#addIngredientsList .add-ingredients")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () =>
        handleIngredientCheckboxChange(checkbox)
      );
    });
  const addDrinkForm = document.getElementById("addDrinkForm");
  if (addDrinkForm) {
    addDrinkForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document
        .getElementById("addName")
        .value.replace(/[\/\\]/g, "");
      const description = document.getElementById("addDescription").value;
      const price = document
        .getElementById("addPrice")
        .value.replace(/[^.\d]/g, "");

      if (!price) {
        alert("Please enter a price");
        return;
      }

      const checkedTemps = Array.from(
        document.querySelectorAll(".add-temps:checked")
      ).map((cb) => cb.value);
      if (checkedTemps.length === 0) {
        alert("Please select at least one temperature");
        return;
      }

      const popular = document.getElementById("addPopular").checked;
      const special = document.getElementById("addSpecial").checked;
      const checkedIngredients = [];
      const ingredientCounts = [];
      document
        .querySelectorAll("#addIngredientsList .add-ingredients:checked")
        .forEach((cb) => {
          const item = cb.closest(".ingredient-item");
          const countInput = item.querySelector(".ingredient-count");
          checkedIngredients.push(cb.value);
          ingredientCounts.push(parseInt(countInput.value, 10) || 1);
        });
      const menuItem = {
        name,
        description,
        price,
        popular,
        special,
        checkedIngredients,
        ingredientCounts,
        checkedTemps,
        caf: document.getElementById("addCaffeinated").checked,
        allowDecaf: document.getElementById("addAllowDecaf").checked,
        imageData: addSrcData,
      };

      try {
        const response = await fetch("/admin/addDrink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(menuItem),
        });

        if (response.ok) {
          window.location.reload();
        } else {
          alert("Error adding drink.");
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("A network error occurred while adding the drink.");
      }
    });
  }

  // --- Edit Drink Modal ---
  let editSrcData = ""; // Will store the image data for editing

  document.querySelectorAll(".action-button.edit").forEach((button) => {
    button.addEventListener("click", async function (e) {
      e.preventDefault();
      const drinkId = this.getAttribute("data-drink-id");
      const tableRow = this.closest("tr");
      const preloadedImageData = tableRow.dataset.image;

      if (!drinkId) {
        alert("Error: Could not identify the drink to edit");
        return;
      }

      try {
        // Reset data and open modal
        editSrcData = "";
        openModal("editDrinkModal");

        // Use the pre-loaded image data from the data-image attribute
        const imageElement = document.getElementById("editDrinkImg");
        const noImageMessage = document.getElementById("noImageMessage");

        if (preloadedImageData && preloadedImageData.startsWith("data:image")) {
          imageElement.src = preloadedImageData;
          imageElement.style.display = "block";
          if (noImageMessage) noImageMessage.style.display = "none";
          // Store the pre-loaded data for re-saving
          editSrcData = preloadedImageData;
        } else {
          imageElement.src = "";
          imageElement.style.display = "none";
          if (noImageMessage) noImageMessage.style.display = "block";
        }

        // Fetch the rest of the drink data for checkboxes, etc.
        const response = await fetch(`/admin/api/menuItem/${drinkId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch drink data: ${response.status}`);
        }
        const drink = await response.json();

        // Populate form fields
        document.getElementById("editDrinkId").value = drink._id;
        document.getElementById("editName").value = drink.name || "";
        document.getElementById("editDescription").value =
          drink.description || "";
        document.getElementById("editPrice").value = drink.price || "";
        // Populate ingredients
        const allEditCheckboxes = document.querySelectorAll(
          "#editIngredientsList .edit-ingredients"
        );
        allEditCheckboxes.forEach((cb) => {
          const item = cb.closest(".ingredient-item");
          const countInput = item.querySelector(".ingredient-count");
          cb.checked = false;
          countInput.style.display = "none";
          countInput.value = "1";
        });

        if (drink.ingredients && Array.isArray(drink.ingredients)) {
          drink.ingredients.forEach((ingredientId, index) => {
            const checkbox = document.querySelector(
              `#editIngredientsList .edit-ingredients[value="${ingredientId}"]`
            );
            if (checkbox) {
              checkbox.checked = true;
              const item = checkbox.closest(".ingredient-item");
              const countInput = item.querySelector(".ingredient-count");
              countInput.style.display = "block";
              countInput.value = drink.ingredientCounts[index] || 1;
            }
          });
        }
        // Populate temps
        document.querySelectorAll(".edit-temps").forEach((checkbox) => {
          checkbox.checked =
            drink.temps &&
            Array.isArray(drink.temps) &&
            drink.temps.includes(checkbox.value);
        });

        document.getElementById("editPopular").checked = Boolean(drink.popular);
        document.getElementById("editSpecial").checked = Boolean(drink.special);

        const caffeinated = Boolean(drink.caffeination);
        document.getElementById("editCaffeinated").checked = caffeinated;

        const editDecafContainer =
          document.getElementById("editDecafContainer");
        if (editDecafContainer) {
          editDecafContainer.hidden = !caffeinated;
        }

        document.getElementById("editAllowDecaf").checked = Boolean(
          drink.allowDecaf
        );
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to load drink data for editing.");
      }
    });
  });

  // --- Edit Drink Image Preview ---
  const editImageInput = document.getElementById("editImage");
  if (editImageInput) {
    editImageInput.addEventListener("change", () => {
      const imageElement = document.getElementById("editDrinkImg");
      const noImageMessage = document.getElementById("noImageMessage");
      const filesSelected = editImageInput.files;

      if (filesSelected.length > 0) {
        const fileToLoad = filesSelected[0];

        // Validate file type
        let goodType = false;
        const fileExt = fileToLoad.name
          .substring(fileToLoad.name.lastIndexOf(".") + 1)
          .toLowerCase();

        switch (fileExt) {
          case "jpg":
          case "jpeg":
          case "png":
          case "webp":
          case "heic":
          case "heif":
            goodType = true;
            break;
        }

        if (!goodType) {
          alert(
            "Please select a valid image type (jpg, jpeg, png, webp, heic, heif)"
          );
          editImageInput.value = ""; // Reset the file input
          return;
        }

        const fileReader = new FileReader();
        fileReader.onload = (fileLoadedEvent) => {
          editSrcData = fileLoadedEvent.target.result; // Store the new base64 data
          imageElement.src = editSrcData;
          imageElement.style.display = "block";
          if (noImageMessage) noImageMessage.style.display = "none";
        };
        fileReader.readAsDataURL(fileToLoad);
      }
    });
  }

  // Handle caffeinated checkbox in edit modal
  const editCaf = document.getElementById("editCaffeinated");
  const editAllowDecaf = document.getElementById("editAllowDecaf");
  if (editCaf && editAllowDecaf) {
    editCaf.addEventListener("click", () => {
      document.getElementById("editDecafContainer").hidden = !editCaf.checked;
      if (!editCaf.checked) {
        editAllowDecaf.checked = false;
      }
    });
  }
  document
    .querySelectorAll("#editIngredientsList .edit-ingredients")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () =>
        handleIngredientCheckboxChange(checkbox)
      );
    });
  // Handle edit form submission
  const editDrinkForm = document.getElementById("editDrinkForm");
  if (editDrinkForm) {
    editDrinkForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const drinkId = document.getElementById("editDrinkId").value;
      const name = document
        .getElementById("editName")
        .value.replace(/[\/\\]/g, "");
      const description = document.getElementById("editDescription").value;
      const price = document
        .getElementById("editPrice")
        .value.replace(/[^.\d]/g, "");

      if (!price) {
        alert("Please enter a price");
        return;
      }

      const checkedTemps = Array.from(
        document.querySelectorAll(".edit-temps:checked")
      ).map((cb) => cb.value);

      if (checkedTemps.length === 0) {
        alert("Please select at least one temperature");
        return;
      }

      const popular = document.getElementById("editPopular").checked;
      const special = document.getElementById("editSpecial").checked;
      const checkedIngredients = [];
      const ingredientCounts = [];
      document
        .querySelectorAll("#editIngredientsList .edit-ingredients:checked")
        .forEach((cb) => {
          const item = cb.closest(".ingredient-item");
          const countInput = item.querySelector(".ingredient-count");
          checkedIngredients.push(cb.value);
          ingredientCounts.push(parseInt(countInput.value, 10) || 1);
        });
      const drink = {
        name,
        description,
        price,
        popular,
        special,
        checkedIngredients,
        ingredientCounts,
        checkedTemps,
        caf: document.getElementById("editCaffeinated").checked,
        allowDecaf: document.getElementById("editAllowDecaf").checked,
        imageData: editSrcData,
      };

      try {
        const response = await fetch(`/admin/modifyDrink/${drinkId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(drink),
        });

        if (response.ok) {
          window.location.reload();
        } else {
          alert("Error updating drink.");
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("A network error occurred while updating the drink.");
      }
    });
  }
  // --- Delete Drink Modal ---
  document.querySelectorAll(".action-button.delete").forEach((button) => {
    button.addEventListener("click", function () {
      const drinkId = this.getAttribute("data-drink-id");
      const drinkName = this.getAttribute("data-drink-name");

      document.getElementById("deleteDrinkId").value = drinkId;
      document.getElementById("deleteDrinkName").textContent = drinkName;

      openModal("deleteDrinkModal");
    });
  });

  const deleteDrinkForm = document.getElementById("deleteDrinkForm");
  if (deleteDrinkForm) {
    deleteDrinkForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const drinkId = document.getElementById("deleteDrinkId").value;

      try {
        const response = await fetch(`/admin/deleteDrink/${drinkId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to delete drink.");
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("A network error occurred while deleting the drink.");
      }
    });
  }

  // --- Live Search ---
  const nameSearch = document.getElementById("nameSearch");
  if (nameSearch) {
    nameSearch.addEventListener("input", function () {
      const query = this.value.toLowerCase().trim();
      const rows = document.querySelectorAll("#drinksTable tbody tr");
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
