/**
 * Ingredient Analysis Tool
 * This script analyzes ingredients in the database and generates reports
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Ingredient = require("./server/model/ingredient");
const fs = require("fs");

let reportOutput = "";

function log(msg = "") {
  console.log(msg);
  reportOutput += msg + "\n";
}

// Categories mapping (common ingredient categorization)
const INGREDIENT_CATEGORIES = {
  milk: [
    "milk",
    "whole milk",
    "skim milk",
    "2% milk",
    "almond milk",
    "oat milk",
    "soy milk",
    "coconut milk",
    "cashew milk",
    "macadamia milk",
  ],
  syrups: [
    "syrup",
    "vanilla syrup",
    "caramel syrup",
    "hazelnut syrup",
    "mocha syrup",
    "chocolate syrup",
    "irish cream syrup",
    "amaretto syrup",
    "maple syrup",
    "simple syrup",
  ],
  powders: [
    "powder",
    "matcha powder",
    "cocoa powder",
    "protein powder",
    "instant coffee",
    "espresso powder",
  ],
  sauces: [
    "sauce",
    "caramel sauce",
    "chocolate sauce",
    "mocha sauce",
    "hazelnut sauce",
  ],
  coffee: [
    "espresso",
    "espresso shot",
    "coffee",
    "cold brew",
    "concentrated coffee",
  ],
  toppings: [
    "whipped cream",
    "foam",
    "cinnamon",
    "nutmeg",
    "cocoa",
    "sprinkles",
    "chocolate chips",
    "caramel drizzle",
  ],
  ice: ["ice", "crushed ice"],
  water: ["water", "hot water", "cold water"],
  other: [],
};

async function analyzeIngredients() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost/half-caf");
    log("Connected to MongoDB\n");

    // Fetch all ingredients
    const ingredients = await Ingredient.find().sort({ name: 1 });

    log("=".repeat(80));
    log("INGREDIENT ANALYSIS REPORT");
    log("=".repeat(80));
    log(`Total Ingredients: ${ingredients.length}\n`);

    // 1. List all ingredients that are tracked (customizable)
    log("1. TRACKED INGREDIENTS (LE - Listed/Exported)");
    log("-".repeat(80));
    const trackedIngredients = ingredients.filter((ing) => ing.type === "customizable");
    log(`Tracked Ingredients (Customizable): ${trackedIngredients.length}`);
    trackedIngredients.forEach((ing, idx) => {
      log(
        `   ${idx + 1}. ${ing.name} - Unit: ${ing.unit}, Price: $${ing.price}, Qty: ${ing.quantity}`
      );
    });
    log("");

    // 2. Group ingredients by category
    log("2. GROUPED BY CATEGORY");
    log("-".repeat(80));
    const ingredientsByCategory = {};

    for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
      ingredientsByCategory[category] = ingredients.filter((ing) => {
        const nameLower = ing.name.toLowerCase();
        return keywords.some((kw) => nameLower.includes(kw.toLowerCase()));
      });
    }

    // Categorize uncategorized ingredients
    const categorizedNames = new Set();
    Object.values(ingredientsByCategory).forEach((items) => {
      items.forEach((ing) => categorizedNames.add(ing._id.toString()));
    });

    const uncategorized = ingredients.filter(
      (ing) => !categorizedNames.has(ing._id.toString())
    );
    if (uncategorized.length > 0) {
      ingredientsByCategory["uncategorized"] = uncategorized;
    }

    // Display categories
    for (const [category, items] of Object.entries(ingredientsByCategory)) {
      if (items.length > 0) {
        log(`\n${category.toUpperCase()} (${items.length} items)`);
        items.forEach((ing) => {
          const tracked = ing.type === "customizable" ? "[TRACKED]" : "";
          log(
            `   - ${ing.name.padEnd(30)} | ${ing.unit.padEnd(10)} | $${ing.price
              .toString()
              .padEnd(7)} | Qty: ${ing.quantity} ${tracked}`
          );
        });
      }
    }
    log("");

    // 3. Check naming consistency
    log("3. NAMING CONSISTENCY & ISSUES");
    log("-".repeat(80));

    // Check for duplicates (exact matches)
    const nameCount = {};
    ingredients.forEach((ing) => {
      const normalizedName = ing.name.toLowerCase().trim();
      if (!nameCount[normalizedName]) {
        nameCount[normalizedName] = [];
      }
      nameCount[normalizedName].push(ing);
    });

    // 4. Flag duplicates and aliases
    log("\n4. DUPLICATES & POTENTIAL ALIASES");
    log("-".repeat(80));
    let duplicatesFound = 0;

    for (const [normalizedName, items] of Object.entries(nameCount)) {
      if (items.length > 1) {
        duplicatesFound++;
        log(`\nDUPLICATE FOUND: "${normalizedName}"`);
        items.forEach((ing, idx) => {
          log(
            `   ${idx + 1}. ID: ${ing._id} - Original: "${ing.name}", Unit: ${ing.unit}, Price: $${ing.price}`
          );
        });
      }
    }

    if (duplicatesFound === 0) {
      log("✓ No exact duplicates found");
    }

    // Check for potential aliases (similar names)
    log("\n\nPOTENTIAL ALIASES (Similar Names)");
    const potentialAliases = [];
    for (let i = 0; i < ingredients.length; i++) {
      for (let j = i + 1; j < ingredients.length; j++) {
        const name1 = ingredients[i].name.toLowerCase().trim();
        const name2 = ingredients[j].name.toLowerCase().trim();

        // Check if one name is contained in the other or if they share common words
        const words1 = name1.split(" ");
        const words2 = name2.split(" ");
        const commonWords = words1.filter((word) => words2.includes(word));

        if (commonWords.length > 0 && name1 !== name2) {
          potentialAliases.push({
            name1: ingredients[i].name,
            name2: ingredients[j].name,
            commonWords,
          });
        }
      }
    }

    if (potentialAliases.length > 0) {
      potentialAliases.forEach((alias, idx) => {
        log(
          `   ${idx + 1}. "${alias.name1}" & "${alias.name2}" (Common: ${alias.commonWords.join(", ")})`
        );
      });
    } else {
      log("✓ No potential aliases detected");
    }

    // 5. Summary Statistics
    log("\n\n5. SUMMARY STATISTICS");
    log("-".repeat(80));
    const totalValue = ingredients.reduce((sum, ing) => sum + ing.price * ing.quantity, 0);
    const avgPrice = (
      ingredients.reduce((sum, ing) => sum + ing.price, 0) / ingredients.length
    ).toFixed(2);

    log(`Total Inventory Value: $${totalValue.toFixed(2)}`);
    log(`Average Price Per Unit: $${avgPrice}`);
    log(`Customizable Items: ${trackedIngredients.length}`);
    log(
      `Non-Customizable Items: ${ingredients.length - trackedIngredients.length}`
    );

    // 6. Export functionality status
    log("\n\n6. FEATURE IMPLEMENTATION STATUS");
    log("-".repeat(80));
    log("✓ List all ingredients that are tracked (LE):");
    log("  → Found in: /admin/ingredients route and view");
    log("  → Tracked items: Those with type='customizable'");
    log("  → Already Implemented");
    log("");
    log("⊘ Export ingredient list:");
    log("  → NOT Currently Implemented");
    log("  → Would need: CSV/JSON export endpoint");
    log("");
    log("⊘ Group by category:");
    log("  → NOT Currently Implemented");
    log("  → Ingredient schema missing 'category' field");
    log("  → Could be added as a new field to schema");
    log("");
    log("⊘ Confirm naming consistency:");
    log("  → PARTIALLY Implemented");
    log("  → No built-in validation in current system");
    log("");
    log("⊘ Flag duplicates/aliases:");
    log("  → NOT Currently Implemented");
    log("  → Would need: Duplicate detection logic on admin panel");
    log("");

    // 7. Detailed recommendations
    log("\n\n7. RECOMMENDATIONS FOR NEW FEATURES");
    log("-".repeat(80));
    log("1. Add 'category' field to ingredient schema");
    log("   Location: server/model/ingredient.js");
    log("");
    log("2. Create export endpoints");
    log("   Location: server/routes/admin.js");
    log("   Endpoints needed:");
    log("     - GET /admin/api/ingredients/export/csv");
    log("     - GET /admin/api/ingredients/export/json");
    log("     - GET /admin/api/ingredients/export/grouped");
    log("");
    log("3. Add duplicate detection UI");
    log("   Location: assets/js/ingredients.js and views/ingredients.ejs");
    log("   Show warnings when adding ingredients with similar names");
    log("");
    log("4. Add category selector to add/edit ingredient modals");
    log("   Location: views/ingredients.ejs");
    log("");

    // Generate export data
    log("\n\n8. EXPORT-READY DATA (JSON Format)");
    log("-".repeat(80));
    const exportData = {
      exportDate: new Date().toISOString(),
      totalIngredients: ingredients.length,
      trackedIngredientsCount: trackedIngredients.length,
      ingredients: ingredients.map((ing) => ({
        id: ing._id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        price: ing.price,
        tracked: ing.type === "customizable",
        orderThreshold: ing.orderThreshold,
      })),
    };

    log(JSON.stringify(exportData, null, 2));

    // Save to file
    const fileName = "ingredient_analysis_report.txt";
    fs.writeFileSync(fileName, reportOutput);
    log("\n\n" + "=".repeat(80));
    log(`Report saved to: ${fileName}`);
    log("=".repeat(80));

    await mongoose.disconnect();
  } catch (error) {
    log("Error analyzing ingredients: " + error.message);
    log(error.stack);
    process.exit(1);
  }
}

analyzeIngredients();
