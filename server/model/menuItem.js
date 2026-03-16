/**
 * schema for a menuItem
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  popular: {
    type: Boolean,
    required: false,
  },
  ingredients: {
    type: [mongoose.Schema.ObjectId],
    ref: "Ingredient",
    required: true,
  },
  ingredientCounts: {
    type: [Number],
  },
  temps: {
    type: [String],
    required: true,
  },
  caffeination: {
    type: Boolean,
    required: false,
  },
  allowDecaf: {
    type: Boolean,
    required: false,
  },
  special: {
    type: Boolean,
    required: false,
  },
  imageData: {
    type: Buffer,
    required: false,
  },
  allowedIngredientCategories: {
    type: [String],
    enum: [
      "milk",
      "syrups",
      "powders",
      "sauces",
      "espresso_shots",
      "toppings",
      "ice",
      "water",
      "other",
    ],
    default: ["milk", "syrups", "powders", "sauces", "toppings"],
  },
});

const MenuItem = mongoose.model("MenuItem", schema);

module.exports = MenuItem;
