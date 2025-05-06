/**
 * schema for a drink
 */

const mongoose = require("mongoose");
// const MenuItem = require("./menuItem");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  ingredients: {
    type: [mongoose.Schema.ObjectId],
    ref: "Ingredient",
    required: true,
  },
  temps: {
    type: String,
    required: true,
  },
  caffeinated: {
    type: Boolean,
    required: false,
  },
  instructions: {
    type: String,
    required: false,
  },
  favorite: {
    type: Boolean,
    required: false,
  },
  completed: {
    type: Boolean,
    required: true,
  },
});

const Drink = mongoose.model("Drink", schema);

module.exports = Drink;
