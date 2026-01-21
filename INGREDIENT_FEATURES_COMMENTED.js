/**
 * INGREDIENT MANAGEMENT FEATURE CHECKLIST
 * 
 * This document provides a detailed analysis of requested ingredient management features
 * and their current implementation status with code references.
 */

// ============================================================================
// FEATURE 1: List all ingredients that are tracked (LE)
// ============================================================================
// STATUS: ✓ ALREADY IMPLEMENTED
// 
// CURRENT IMPLEMENTATION:
// - Tracked ingredients are stored with type='customizable' in the database
// - Non-tracked ingredients have type='uncustomizable' or other values
// - The admin ingredients page displays a "Customizable by user" column
//
// CODE LOCATIONS:
// 1. Database Schema: server/model/ingredient.js
//    - Uses 'type' field to track: String (required)
//
// 2. Backend Route: server/routes/admin.js (line 750)
//    route.get("/ingredients", async (req, res) => {
//      const ingredients = await Ingredient.find();
//      res.render("ingredients", { ingredients: ingredients });
//    });
//
// 3. Frontend View: views/ingredients.ejs (line 37-40)
//    <% if (ingredient.type === 'customizable') { %>Yes<% } else { %>No<% } %>
//
// 4. Add/Edit Logic: server/routes/admin.js (line 773-780)
//    type: req.body.type  // Set to "customizable" or "uncustomizable"
//
// USAGE:
// - Navigate to /admin/ingredients page
// - View the "Customizable by user" column (Yes/No)
// - Edit ingredient to toggle customizable status


// ============================================================================
// FEATURE 2: Export ingredient list
// ============================================================================
// STATUS: ⊘ NOT IMPLEMENTED
//
// MISSING FUNCTIONALITY:
// - No CSV export endpoint
// - No JSON export endpoint
// - No export button in UI
//
// RECOMMENDED IMPLEMENTATION:
//
// A. Add routes to server/routes/admin.js (after line 805):
//
//    // Export all ingredients as JSON
//    route.get("/api/ingredients/export/json", async (req, res) => {
//      const ingredients = await Ingredient.find();
//      res.setHeader('Content-Type', 'application/json');
//      res.setHeader('Content-Disposition', 'attachment; filename="ingredients.json"');
//      res.json(ingredients);
//    });
//
//    // Export all ingredients as CSV
//    route.get("/api/ingredients/export/csv", async (req, res) => {
//      const ingredients = await Ingredient.find();
//      let csv = 'Name,Quantity,Unit,Price,Tracked,Order Threshold\n';
//      ingredients.forEach(ing => {
//        csv += `"${ing.name}",${ing.quantity},"${ing.unit}",${ing.price},`;
//        csv += `${ing.type === 'customizable' ? 'Yes' : 'No'},${ing.orderThreshold}\n`;
//      });
//      res.setHeader('Content-Type', 'text/csv');
//      res.setHeader('Content-Disposition', 'attachment; filename="ingredients.csv"');
//      res.send(csv);
//    });
//
// B. Add button to views/ingredients.ejs (after line 15):
//
//    <button class="action-button export" id="exportJsonBtn">
//      📥 Export as JSON
//    </button>
//    <button class="action-button export" id="exportCsvBtn">
//      📥 Export as CSV
//    </button>
//
// C. Add listeners to assets/js/ingredients.js (after line 200):
//
//    document.getElementById("exportJsonBtn").addEventListener("click", () => {
//      window.location.href = "/admin/api/ingredients/export/json";
//    });
//
//    document.getElementById("exportCsvBtn").addEventListener("click", () => {
//      window.location.href = "/admin/api/ingredients/export/csv";
//    });


// ============================================================================
// FEATURE 3: Group by category
// ============================================================================
// STATUS: ⊘ NOT IMPLEMENTED
//
// ROOT CAUSE:
// - Ingredient schema LACKS 'category' field
// - No grouping logic exists in backend or frontend
//
// CURRENT SCHEMA: server/model/ingredient.js
// {
//   name: String (required),
//   quantity: Number (required),
//   orderThreshold: Number (required),
//   unit: String (required),
//   price: Number (required),
//   type: String (required)
//   // ← MISSING: category field
// }
//
// RECOMMENDED IMPLEMENTATION:
//
// A. Update schema: server/model/ingredient.js (add after 'type' field):
//
//    category: {
//      type: String,
//      enum: ['milk', 'syrups', 'powders', 'sauces', 'coffee', 'toppings', 'ice', 'water', 'other'],
//      default: 'other'
//    }
//
// B. Update add ingredient route: server/routes/admin.js (line 773-780):
//
//    route.post("/addIngredient", async (req, res) => {
//      const ingredient = new Ingredient({
//        name: req.body.name,
//        quantity: req.body.quantity,
//        orderThreshold: req.body.orderThreshold,
//        unit: req.body.unit,
//        price: req.body.price,
//        type: req.body.type,
//        category: req.body.category  // ← ADD THIS
//      });
//      await ingredient.save();
//      res.status(201).end();
//    });
//
// C. Update edit ingredient route: server/routes/admin.js (line 791-800):
//
//    route.post("/editIngredient/:id", async (req, res) => {
//      const ingredient = await Ingredient.findById(req.params.id);
//      ingredient.name = req.body.name;
//      ingredient.quantity = req.body.quantity;
//      ingredient.orderThreshold = req.body.orderThreshold;
//      ingredient.unit = req.body.unit;
//      ingredient.price = req.body.price;
//      ingredient.type = req.body.type;
//      ingredient.category = req.body.category;  // ← ADD THIS
//      await ingredient.save();
//      res.status(201).end();
//    });
//
// D. Update view: views/ingredients.ejs (add category column and dropdown):
//    
//    Add to table header (line 27):
//    <th>Category</th>
//
//    Add to table body (line 41):
//    <td><%= ingredient.category %></td>
//
//    Add to add modal (around line 80):
//    <div class="form-group">
//      <label for="addCategory">Category:</label>
//      <select id="addCategory" required>
//        <option value="milk">Milk</option>
//        <option value="syrups">Syrups</option>
//        <option value="powders">Powders</option>
//        <option value="sauces">Sauces</option>
//        <option value="coffee">Coffee</option>
//        <option value="toppings">Toppings</option>
//        <option value="ice">Ice</option>
//        <option value="water">Water</option>
//        <option value="other" selected>Other</option>
//      </select>
//    </div>
//
// E. Update add form submission: assets/js/ingredients.js (line 37):
//
//    const data = {
//      name: document.getElementById("addName").value,
//      quantity: document.getElementById("addQuantity").value,
//      orderThreshold: document.getElementById("addOrderThreshold").value,
//      unit: document.getElementById("addUnit").value,
//      price: document.getElementById("addPrice").value,
//      type: document.getElementById("addType").checked ? "customizable" : "uncustomizable",
//      category: document.getElementById("addCategory").value  // ← ADD THIS
//    };


// ============================================================================
// FEATURE 4: Confirm naming consistency
// ============================================================================
// STATUS: ⊘ PARTIALLY IMPLEMENTED (Search exists, but no validation)
//
// CURRENT IMPLEMENTATION:
// - Live search functionality: assets/js/ingredients.js (line 176-205)
// - Filters ingredients by name as user types
// - No validation or warnings about similar names
//
// MISSING:
// - No check for duplicates when adding/editing
// - No similar name suggestions
// - No warning messages
//
// RECOMMENDED IMPLEMENTATION:
//
// A. Add utility function to assets/js/ingredients.js:
//
//    function isSimilarName(name1, name2) {
//      const n1 = name1.toLowerCase().trim();
//      const n2 = name2.toLowerCase().trim();
//      
//      // Check for exact match
//      if (n1 === n2) return true;
//      
//      // Check for substring match
//      if (n1.includes(n2) || n2.includes(n1)) return true;
//      
//      // Check for word overlap (e.g., "Vanilla Syrup" vs "Vanilla Extract")
//      const words1 = n1.split(/\s+/);
//      const words2 = n2.split(/\s+/);
//      const commonWords = words1.filter(w => words2.includes(w));
//      
//      return commonWords.length > 0;
//    }
//
// B. Add validation before submitting add form:
//
//    document.getElementById("addIngredientForm").addEventListener("submit", async function (e) {
//      e.preventDefault();
//      const newName = document.getElementById("addName").value;
//      
//      // Check for similar names
//      const rows = document.querySelectorAll("#ingredientsTable tbody tr");
//      let hasSimilar = false;
//      const similarNames = [];
//      
//      rows.forEach(row => {
//        const existingName = row.querySelector("td:first-child").textContent;
//        if (isSimilarName(existingName, newName)) {
//          hasSimilar = true;
//          similarNames.push(existingName);
//        }
//      });
//      
//      if (hasSimilar) {
//        const message = `Warning: Similar ingredients found:\n${similarNames.join('\n')}\n\nContinue anyway?`;
//        if (!confirm(message)) {
//          return;
//        }
//      }
//      
//      // Continue with form submission...
//    });


// ============================================================================
// FEATURE 5: Flag duplicates or aliases
// ============================================================================
// STATUS: ⊘ NOT IMPLEMENTED
//
// CURRENT SITUATION:
// - No duplicate detection logic
// - No merge/consolidate functionality
// - No warning system for near-duplicates
//
// RECOMMENDED IMPLEMENTATION:
//
// A. Add endpoint to server/routes/admin.js (after line 805):
//
//    // Check for duplicate/similar ingredients
//    route.get("/api/ingredients/check-duplicates/:name", async (req, res) => {
//      const name = req.params.name;
//      const ingredients = await Ingredient.find();
//      
//      const duplicates = [];
//      const aliases = [];
//      
//      ingredients.forEach(ing => {
//        const ingName = ing.name.toLowerCase();
//        const checkName = name.toLowerCase();
//        
//        // Exact duplicates
//        if (ingName === checkName) {
//          duplicates.push(ing);
//        }
//        // Similar names (aliases)
//        else if (ingName.includes(checkName) || checkName.includes(ingName)) {
//          aliases.push(ing);
//        }
//      });
//      
//      res.json({ duplicates, aliases });
//    });
//
// B. Add UI feedback to assets/js/ingredients.js:
//
//    const addNameInput = document.getElementById("addName");
//    addNameInput.addEventListener("blur", async function() {
//      const name = this.value;
//      if (!name) return;
//      
//      const response = await fetch(`/admin/api/ingredients/check-duplicates/${encodeURIComponent(name)}`);
//      const { duplicates, aliases } = await response.json();
//      
//      const warningDiv = document.getElementById("duplicateWarning");
//      
//      if (duplicates.length > 0) {
//        warningDiv.innerHTML = `
//          ⚠️ <strong>DUPLICATE FOUND!</strong><br/>
//          Ingredient "${duplicates[0].name}" already exists.
//        `;
//        warningDiv.style.display = "block";
//      } else if (aliases.length > 0) {
//        warningDiv.innerHTML = `
//          ⚠️ <strong>Similar ingredients found:</strong><br/>
//          ${aliases.map(a => a.name).join(', ')}<br/>
//          <small>Did you mean one of these?</small>
//        `;
//        warningDiv.style.display = "block";
//      } else {
//        warningDiv.style.display = "none";
//      }
//    });
//
// C. Add warning display to views/ingredients.ejs (in add modal):
//
//    <div id="duplicateWarning" class="warning-box" style="display: none;">
//      <!-- Warning messages will be shown here -->
//    </div>
//
// D. Add CSS styling (in assets/css/styles.css):
//
//    .warning-box {
//      background-color: #fff3cd;
//      border: 1px solid #ffc107;
//      padding: 12px;
//      border-radius: 4px;
//      margin-bottom: 15px;
//      color: #856404;
//    }


// ============================================================================
// SUMMARY TABLE
// ============================================================================
// 
// Feature                          Status              Implementation Time
// ────────────────────────────────────────────────────────────────────────
// 1. List tracked ingredients      ✓ IMPLEMENTED       Already Done
// 2. Export ingredient list        ⊘ NOT DONE          1-2 hours
// 3. Group by category             ⊘ NOT DONE          2-3 hours
// 4. Confirm naming consistency    ⊘ PARTIALLY         1-2 hours
// 5. Flag duplicates/aliases       ⊘ NOT DONE          2-3 hours
//
// TOTAL ESTIMATED IMPLEMENTATION TIME: ~8-11 hours


// ============================================================================
// FILES TO MODIFY
// ============================================================================
// 
// Priority: HIGH
// - server/model/ingredient.js (add category field)
// - server/routes/admin.js (add export & duplicate endpoints)
// - views/ingredients.ejs (add UI controls)
// - assets/js/ingredients.js (add event handlers)
//
// Priority: MEDIUM (UI/UX improvements)
// - assets/css/styles.css (add warning styling)
//
// Priority: LOW (Optional)
// - assets/js/customizeDrink.js (if filtering by category)
// - views/customizeDrink.ejs (if showing category info)
