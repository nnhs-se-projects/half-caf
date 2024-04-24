/**
 * schema for a drink
 */

const mongoose = require("mongoose");
// const MenuItem = require("./menuItem");

const schema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  flavors: {
    type: String,
    required: true,
  },
  toppings: {
    type: String,
    required: true,
  },
  temps: {
    type: String,
    required: true,
  },
  caffeination: {
    type: Boolean,
    required: false,
  },
  instructions: {
    type: String,
    required: false,
  },
  favorite: {
    type: Boolean,
    required: true,
  },
});

const Drink = mongoose.model("Drink", schema);

module.exports = Drink;
