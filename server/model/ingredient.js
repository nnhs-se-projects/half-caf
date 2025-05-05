/**
 * schema for an ingredient
 */

const mongoose = require("mongoose");
// const MenuItem = require("./menuItem");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  measure: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const Ingredient = mongoose.model("Ingredient", schema);

module.exports = Ingredient;
