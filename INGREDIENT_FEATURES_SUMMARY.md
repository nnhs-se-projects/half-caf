# INGREDIENT MANAGEMENT FEATURES - QUICK REFERENCE

## STATUS OVERVIEW

| #   | Feature                       | Status          | Notes                            |
| --- | ----------------------------- | --------------- | -------------------------------- |
| 1   | List tracked ingredients (LE) | ✅ **DONE**     | Uses `type='customizable'` field |
| 2   | Export ingredient list        | ❌ **NOT DONE** | Need CSV/JSON export endpoints   |
| 3   | Group by category             | ❌ **NOT DONE** | Schema lacks `category` field    |
| 4   | Naming consistency check      | ⚠️ **PARTIAL**  | Search exists, no validation     |
| 5   | Flag duplicates/aliases       | ❌ **NOT DONE** | Need duplicate detection logic   |

---

## DETAILED FINDINGS

### ✅ FEATURE 1: List All Tracked Ingredients (LE)

**Status: ALREADY IMPLEMENTED**

**Code Evidence:**

```javascript
// Database field: type='customizable' or 'uncustomizable'

// View display (views/ingredients.ejs, line 37-40):
<% if (ingredient.type === 'customizable') { %>Yes<% } else { %>No<% } %>

// Add ingredient route (server/routes/admin.js, line 773-780):
type: req.body.type
```

**How to Use:**

- Go to `/admin/ingredients`
- Check "Customizable by user" column
- Add/Edit ingredient and toggle "Customizable by user" checkbox

---

### ❌ FEATURE 2: Export Ingredient List

**Status: NOT IMPLEMENTED**

**What's Missing:**

- No export endpoints in backend
- No export buttons in UI
- No file download functionality

**Implementation Required:**

1. **Backend** - Add to `server/routes/admin.js` (line 805+):

```javascript
// JSON Export
route.get("/api/ingredients/export/json", async (req, res) => {
  const ingredients = await Ingredient.find();
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="ingredients.json"',
  );
  res.json(ingredients);
});

// CSV Export
route.get("/api/ingredients/export/csv", async (req, res) => {
  const ingredients = await Ingredient.find();
  let csv = "Name,Quantity,Unit,Price,Tracked,OrderThreshold\n";
  ingredients.forEach((ing) => {
    csv += `"${ing.name}",${ing.quantity},"${ing.unit}",${ing.price},`;
    csv += `${ing.type === "customizable" ? "Yes" : "No"},${ing.orderThreshold}\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="ingredients.csv"',
  );
  res.send(csv);
});
```

2. **Frontend** - Add buttons to `views/ingredients.ejs` (line 15+):

```html
<button class="action-button" id="exportJsonBtn">📥 Export JSON</button>
<button class="action-button" id="exportCsvBtn">📥 Export CSV</button>
```

3. **JavaScript** - Add listeners to `assets/js/ingredients.js` (line 200+):

```javascript
document.getElementById("exportJsonBtn").addEventListener("click", () => {
  window.location.href = "/admin/api/ingredients/export/json";
});
document.getElementById("exportCsvBtn").addEventListener("click", () => {
  window.location.href = "/admin/api/ingredients/export/csv";
});
```

**Time Estimate:** 1-2 hours

---

### ❌ FEATURE 3: Group by Category

**Status: NOT IMPLEMENTED - SCHEMA MISSING**

**Root Problem:**
The `Ingredient` schema does NOT have a `category` field.

**Current Schema** (`server/model/ingredient.js`):

```javascript
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  orderThreshold: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true },
  // ← MISSING: category field!
});
```

**Implementation Required:**

1. **Schema Update** - Modify `server/model/ingredient.js`:

```javascript
category: {
  type: String,
  enum: ['milk', 'syrups', 'powders', 'sauces', 'coffee', 'toppings', 'ice', 'water', 'other'],
  default: 'other'
}
```

2. **Suggested Categories:**
   - **milk**: Whole milk, skim milk, almond milk, oat milk, soy milk, coconut milk
   - **syrups**: Vanilla, caramel, hazelnut, mocha, chocolate, Irish cream, maple, simple
   - **powders**: Matcha, cocoa, protein, instant coffee, espresso
   - **sauces**: Caramel sauce, chocolate sauce, mocha sauce
   - **coffee**: Espresso shots, cold brew, concentrated coffee
   - **toppings**: Whipped cream, cinnamon, nutmeg, cocoa, sprinkles
   - **ice**: Ice, crushed ice
   - **water**: Hot water, cold water
   - **other**: Miscellaneous

3. **Route Updates** - Modify `server/routes/admin.js`:
   - Line 773: Add `category: req.body.category` to add route
   - Line 791: Add `ingredient.category = req.body.category` to edit route

4. **UI Updates** - Modify `views/ingredients.ejs`:
   - Add category column to table (line 27)
   - Add category dropdown to add/edit modals (line 80+)

5. **Frontend** - Update `assets/js/ingredients.js`:
   - Include category in form data (line 37)

**Time Estimate:** 2-3 hours

---

### ⚠️ FEATURE 4: Confirm Naming Consistency

**Status: PARTIALLY IMPLEMENTED**

**What Works:**

- Live search filter in ingredients page (`assets/js/ingredients.js`, line 176)
- Filters ingredients by name as you type

**What's Missing:**

- No validation when adding/editing ingredients
- No warning for similar ingredient names
- No suggestion system

**Implementation Required:**

1. **Add similarity checker** to `assets/js/ingredients.js`:

```javascript
function isSimilarName(name1, name2) {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  const commonWords = words1.filter((w) => words2.includes(w));

  return commonWords.length > 0;
}
```

2. **Validate on form submit** - Add check before ingredients POST
3. **Show warnings** in modal
4. **Add warning styles** to CSS

**Time Estimate:** 1-2 hours

---

### ❌ FEATURE 5: Flag Duplicates or Aliases

**Status: NOT IMPLEMENTED**

**What's Missing:**

- No duplicate detection endpoint
- No merge/consolidate functionality
- No warning system for similar ingredients

**Implementation Required:**

1. **Backend Endpoint** - Add to `server/routes/admin.js`:

```javascript
route.get("/api/ingredients/check-duplicates/:name", async (req, res) => {
  const name = req.params.name;
  const ingredients = await Ingredient.find();

  const duplicates = [];
  const aliases = [];

  ingredients.forEach((ing) => {
    const ingName = ing.name.toLowerCase();
    const checkName = name.toLowerCase();

    if (ingName === checkName) {
      duplicates.push(ing);
    } else if (ingName.includes(checkName) || checkName.includes(ingName)) {
      aliases.push(ing);
    }
  });

  res.json({ duplicates, aliases });
});
```

2. **Frontend Handler** - Add to `assets/js/ingredients.js`:

```javascript
document.getElementById("addName").addEventListener("blur", async function () {
  const name = this.value;
  if (!name) return;

  const response = await fetch(
    `/admin/api/ingredients/check-duplicates/${encodeURIComponent(name)}`,
  );
  const { duplicates, aliases } = await response.json();

  const warning = document.getElementById("duplicateWarning");
  if (duplicates.length > 0) {
    warning.textContent = `⚠️ DUPLICATE: "${duplicates[0].name}" already exists!`;
    warning.style.display = "block";
  } else if (aliases.length > 0) {
    warning.textContent = `⚠️ Similar: ${aliases.map((a) => a.name).join(", ")}`;
    warning.style.display = "block";
  } else {
    warning.style.display = "none";
  }
});
```

3. **UI Display** - Add to `views/ingredients.ejs` modal:

```html
<div
  id="duplicateWarning"
  class="warning"
  style="display: none; color: #d32f2f; margin-bottom: 10px;"
></div>
```

**Time Estimate:** 2-3 hours

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (2-3 hours)

1. Update ingredient schema with `category` field
2. Update all related routes to handle category
3. Update modals to include category selector
4. Migrate existing ingredients to categories (manual or script)

### Phase 2: Export & Consistency (2-3 hours)

1. Add JSON/CSV export endpoints
2. Add export buttons to UI
3. Add naming consistency validation
4. Add warning messages

### Phase 3: Duplicate Detection (2-3 hours)

1. Add duplicate check endpoint
2. Add duplicate detection UI feedback
3. Add warning styling
4. Test with edge cases

### Phase 4: Polish (1-2 hours)

1. User testing
2. Performance optimization
3. Edge case handling
4. Documentation

**Total Time Estimate:** 8-11 hours

---

## FILE SUMMARY

| File                         | Action     | Why                              |
| ---------------------------- | ---------- | -------------------------------- |
| `server/model/ingredient.js` | **MODIFY** | Add `category` field to schema   |
| `server/routes/admin.js`     | **MODIFY** | Add export & duplicate endpoints |
| `views/ingredients.ejs`      | **MODIFY** | Add UI controls & warnings       |
| `assets/js/ingredients.js`   | **MODIFY** | Add event handlers & validation  |
| `assets/css/styles.css`      | **MODIFY** | Add warning & button styling     |

---

## KEY CODE LOCATIONS

### Current Implementation References:

- Tracked check: [views/ingredients.ejs#L37-L40](views/ingredients.ejs#L37-L40)
- Add route: [server/routes/admin.js#L773-L780](server/routes/admin.js#L773-L780)
- Edit route: [server/routes/admin.js#L791-L800](server/routes/admin.js#L791-L800)
- Delete route: [server/routes/admin.js#L805](server/routes/admin.js#L805)
- Get route: [server/routes/admin.js#L750-L755](server/routes/admin.js#L750-L755)
- Schema: [server/model/ingredient.js](server/model/ingredient.js)
- Search: [assets/js/ingredients.js#L176-L205](assets/js/ingredients.js#L176-L205)

---

## TESTING CHECKLIST

- [ ] Can view tracked vs non-tracked ingredients
- [ ] Can add ingredient with category
- [ ] Can edit ingredient category
- [ ] Can export ingredients as JSON
- [ ] Can export ingredients as CSV
- [ ] Sees warning when adding duplicate
- [ ] Sees warning when adding similar ingredient
- [ ] Search still works after changes
- [ ] Edit modal shows category properly
- [ ] Existing ingredients still work after schema change

---

## NOTES

1. The `type` field currently uses `"customizable"` and `"uncustomizable"` values
2. Backend routes are well-structured and easy to extend
3. EJS templates make UI changes straightforward
4. No major architectural changes needed
5. Consider data migration strategy for existing ingredients when adding category
