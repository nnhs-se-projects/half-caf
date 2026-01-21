/**
 * schema for an ingredient
 */

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
    // if the quantity is less than this number, the ingredient will be highlighted red on the inventory page
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
  },
  category: {
    type: String,
    enum: ['milk', 'syrups', 'powders', 'sauces', 'coffee', 'toppings', 'ice', 'water', 'other'],
    default: 'other',
  },
});

const Ingredient = mongoose.model("Ingredient", schema);

module.exports = Ingredient;
