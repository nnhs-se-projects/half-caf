// CURRENT CODE REVIEW WITH COMMENTS
// This file shows the existing ingredient code with implementation status annotations

// ============================================================================
// FILE: server/model/ingredient.js
// CURRENT STATUS: Needs modification (missing category field)
// ============================================================================

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  orderThreshold: {
    // Already Implemented: Used to highlight when quantity is low
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
    // Already Implemented: "customizable" = tracked (LE), "uncustomizable" = not tracked
  },
  
  // ⊘ NOT IMPLEMENTED: Add this field for grouping by category
  // category: {
  //   type: String,
  //   enum: ['milk', 'syrups', 'powders', 'sauces', 'coffee', 'toppings', 'ice', 'water', 'other'],
  //   default: 'other'
  // }
});

const Ingredient = mongoose.model("Ingredient", schema);

module.exports = Ingredient;


// ============================================================================
// FILE: server/routes/admin.js
// RELEVANT ROUTES: Lines 750-805
// CURRENT STATUS: Partially implemented
// ============================================================================

// ✓ Already Implemented: Get all ingredients
route.get("/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.render("ingredients", { ingredients: ingredients });
  } catch (error) {
    res.status(500).send({ message: "Error fetching data for ingredients page" });
  }
});

// ✓ Already Implemented: Get single ingredient (for editing)
route.get("/api/ingredient/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✓ Already Implemented: Add new ingredient
// ✓ Already Implemented: Uses type field to track if "customizable" or not
route.post("/addIngredient", async (req, res) => {
  const ingredient = new Ingredient({
    name: req.body.name,
    quantity: req.body.quantity,
    orderThreshold: req.body.orderThreshold,
    unit: req.body.unit,
    price: req.body.price,
    type: req.body.type, // ← "customizable" = tracked (LE)
    
    // ⊘ NOT IMPLEMENTED: Add category handling here when schema is updated
    // category: req.body.category || 'other'
  });
  await ingredient.save();
  res.status(201).end();
});

// ✓ Already Implemented: Edit ingredient
route.post("/editIngredient/:id", async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);
  ingredient.name = req.body.name;
  ingredient.quantity = req.body.quantity;
  ingredient.orderThreshold = req.body.orderThreshold;
  ingredient.unit = req.body.unit;
  ingredient.price = req.body.price;
  ingredient.type = req.body.type;
  
  // ⊘ NOT IMPLEMENTED: Add category update here when schema is updated
  // ingredient.category = req.body.category || 'other';
  
  await ingredient.save();
  res.status(201).end();
});

// ✓ Already Implemented: Delete ingredient
route.delete("/deleteIngredient/:id", async (req, res) => {
  const ingredientId = req.params.id;
  await Ingredient.findByIdAndRemove(ingredientId);
  res.end();
});

// ⊘ NOT IMPLEMENTED: Need these export endpoints
// GET /admin/api/ingredients/export/json - Export as JSON
// GET /admin/api/ingredients/export/csv - Export as CSV
// GET /admin/api/ingredients/export/grouped - Export grouped by category

// ⊘ NOT IMPLEMENTED: Need this duplicate check endpoint
// GET /admin/api/ingredients/check-duplicates/:name - Check for duplicates


// ============================================================================
// FILE: views/ingredients.ejs
// RELEVANT SECTIONS: Lines 1-150
// CURRENT STATUS: Partially implemented
// ============================================================================

<!-- ✓ Already Implemented: Search functionality -->
<input type="text" id="nameSearch" placeholder="Search by name..." />

<!-- ✓ Already Implemented: Add button -->
<button id="addIngredientBtn">+ Add Ingredient</button>

<!-- ✓ Already Implemented: Table structure -->
<table class="ingredients-table" id="ingredientsTable">
  <thead>
    <tr>
      <th>Name</th>
      <th>Quantity</th>
      <th>Unit</th>
      <th>Price</th>
      <!-- ✓ Already Implemented: Shows tracked status -->
      <th>Customizable by user</th>
      <th>Actions</th>
      <!-- ⊘ NOT IMPLEMENTED: Should add <th>Category</th> here -->
    </tr>
  </thead>
  <tbody>
    <% for (let ingredient of ingredients) { %>
    <tr data-ingredient-id="<%= ingredient._id %>">
      <td><%= ingredient.name %></td>
      <td><%= ingredient.quantity %></td>
      <td><%= ingredient.unit %></td>
      <td>$<%= ingredient.price %></td>
      
      <!-- ✓ Already Implemented: Shows if customizable (tracked/LE) -->
      <td>
        <span>
          <% if (ingredient.type === 'customizable') { %>Yes<% } else { %>No<% } %>
        </span>
      </td>
      
      <!-- ⊘ NOT IMPLEMENTED: Should add category display here -->
      <!-- <td><%= ingredient.category %></td> -->
      
      <td>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </td>
    </tr>
    <% } %>
  </tbody>
</table>

<!-- ⊘ NOT IMPLEMENTED: Add export buttons here -->
<!-- <button id="exportJsonBtn">📥 Export JSON</button> -->
<!-- <button id="exportCsvBtn">📥 Export CSV</button> -->

<!-- ✓ Already Implemented: Add ingredient modal -->
<div id="addIngredientModal" class="modal">
  <form id="addIngredientForm">
    <input type="text" id="addName" placeholder="e.g., Caramel Syrup" required />
    <input type="number" id="addQuantity" required />
    <input type="number" id="addOrderThreshold" required />
    <input type="text" id="addUnit" placeholder="e.g., ml, g, pumps" required />
    <input type="number" step="any" id="addPrice" required />
    <input type="checkbox" id="addType" />
    <label>Customizable by user</label>
    
    <!-- ⊘ NOT IMPLEMENTED: Add category dropdown here -->
    <!-- <select id="addCategory" required>
      <option value="milk">Milk</option>
      <option value="syrups">Syrups</option>
      <option value="powders">Powders</option>
      <option value="sauces">Sauces</option>
      <option value="coffee">Coffee</option>
      <option value="toppings">Toppings</option>
      <option value="ice">Ice</option>
      <option value="water">Water</option>
      <option value="other" selected>Other</option>
    </select> -->
    
    <!-- ⊘ NOT IMPLEMENTED: Add duplicate warning here -->
    <!-- <div id="duplicateWarning" class="warning-box" style="display: none;"></div> -->
  </form>
</div>

<!-- ✓ Already Implemented: Edit ingredient modal (similar structure) -->
<div id="editIngredientModal" class="modal">
  <!-- Similar to add modal -->
</div>


// ============================================================================
// FILE: assets/js/ingredients.js
// RELEVANT SECTIONS: Lines 27-200
// CURRENT STATUS: Partially implemented
// ============================================================================

// ✓ Already Implemented: Add ingredient form submission
document.getElementById("addIngredientForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const data = {
    name: document.getElementById("addName").value,
    quantity: document.getElementById("addQuantity").value,
    orderThreshold: document.getElementById("addOrderThreshold").value,
    unit: document.getElementById("addUnit").value,
    price: document.getElementById("addPrice").value,
    type: document.getElementById("addType").checked ? "customizable" : "uncustomizable",
    // ⊘ NOT IMPLEMENTED: Add category here
    // category: document.getElementById("addCategory").value
  };

  try {
    const response = await fetch("/admin/addIngredient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      window.location.reload();
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

// ✓ Already Implemented: Edit ingredient functionality
document.querySelectorAll(".action-button.edit").forEach((button) => {
  button.addEventListener("click", async function () {
    const id = this.getAttribute("data-ingredient-id");
    const response = await fetch(`/admin/api/ingredient/${id}`);
    const ingredient = await response.json();
    
    // Populate modal with ingredient data
    document.getElementById("editName").value = ingredient.name;
    document.getElementById("editQuantity").value = ingredient.quantity;
    // ...etc
  });
});

// ✓ Already Implemented: Delete functionality
document.querySelectorAll(".action-button.delete").forEach((button) => {
  button.addEventListener("click", function () {
    const id = this.getAttribute("data-ingredient-id");
    // Show delete confirmation
  });
});

// ✓ Already Implemented: Live search
const nameSearch = document.getElementById("nameSearch");
nameSearch.addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#ingredientsTable tbody tr");
  
  rows.forEach((row) => {
    const name = row.getAttribute("data-name");
    if (name.includes(query)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});

// ⊘ NOT IMPLEMENTED: Duplicate checking on name input
// function isSimilarName(name1, name2) { ... }

// ⊘ NOT IMPLEMENTED: Export handlers
// document.getElementById("exportJsonBtn").addEventListener("click", () => { ... });
// document.getElementById("exportCsvBtn").addEventListener("click", () => { ... });


// ============================================================================
// SUMMARY OF IMPLEMENTATION STATUS
// ============================================================================

FEATURE 1: List tracked ingredients
Status: ✓ ALREADY IMPLEMENTED
Code locations:
  - Schema field: type = 'customizable' or 'uncustomizable'
  - View display: views/ingredients.ejs line 37-40
  - Backend routes: server/routes/admin.js lines 773-800

FEATURE 2: Export ingredient list
Status: ⊘ NOT IMPLEMENTED
Missing:
  - Export endpoints in server/routes/admin.js
  - Export buttons in views/ingredients.ejs
  - Event handlers in assets/js/ingredients.js

FEATURE 3: Group by category
Status: ⊘ NOT IMPLEMENTED
Missing:
  - category field in server/model/ingredient.js schema
  - Category column in views/ingredients.ejs table
  - Category selector in modals
  - category in all routes

FEATURE 4: Naming consistency
Status: ⚠️ PARTIALLY IMPLEMENTED
Existing:
  - Live search exists
Missing:
  - Validation on add/edit
  - Warning messages
  - Similarity checking

FEATURE 5: Flag duplicates
Status: ⊘ NOT IMPLEMENTED
Missing:
  - Duplicate check endpoint
  - Duplicate detection logic
  - UI warning display

