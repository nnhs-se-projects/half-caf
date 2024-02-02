/**
 * schema for a drink
 */

const mongoose = require("mongoose");
const MenuItem = require("./menuItem");

const schema = new mongoose.Schema({
  menuItem: {
    type: MenuItem,
    required: true,
  },
  flavors: {
    type: [String],
    required: true,
  },
  temp: {
    type: [String],
    required: true,
  },
  caffeination: {
    type: Boolean,
    required: true,
  },
  instructions: {
    type: String,
    required: false,
  },
  sugarFree: {
    type: Boolean,
    required: false,
  },
  favorite: {
    type: Boolean,
    required: true,
  },
});

const Drink = mongoose.model("Drink", schema);

module.exports = Drink;
