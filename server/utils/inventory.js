const Ingredient = require('../model/ingredient');

async function computeRequiredFromCart(cart) {
  const required = {};
  for (const drink of cart) {
    if (!drink.ingredients || !drink.ingredientCounts) continue;
    for (let i = 0; i < drink.ingredients.length; i++) {
      const ingId = drink.ingredients[i] ? String(drink.ingredients[i]) : null;
      if (!ingId) continue;
      const count = parseInt(drink.ingredientCounts[i], 10) || 0;
      required[ingId] = (required[ingId] || 0) + count;
    }
  }
  return required;
}

async function checkInventory(required) {
  const requiredIds = Object.keys(required);
  if (requiredIds.length === 0) return [];

  const inventory = await Ingredient.find({ _id: { $in: requiredIds } });
  const insufficient = [];

  const foundIds = new Set(inventory.map((i) => String(i._id)));
  for (const reqId of requiredIds) {
    if (!foundIds.has(reqId)) {
      insufficient.push({ id: reqId, name: 'Unknown ingredient', required: required[reqId], available: 0 });
    }
  }

  for (const item of inventory) {
    const need = required[String(item._id)] || 0;
    if (need > item.quantity) {
      insufficient.push({ id: item._id, name: item.name, required: need, available: item.quantity });
    }
  }

  return insufficient;
}

module.exports = { computeRequiredFromCart, checkInventory };
