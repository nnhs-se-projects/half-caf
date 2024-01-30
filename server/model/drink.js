/**
 * schema for a drink
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  menuItem: {
    type: Date, // create menuitem schema
    required: true,
  },
  temp: {
    type: String,
    required: true,
  },
  decaf: {
    type: String,
    required: true,
  },
  flavors: {
    type: String,
    required: true,
  },
  instructions: {},
  sugarFree: {
    type: Boolean,
    required: false,
  },
});

const Drink = mongoose.model("Drink", schema);

module.exports = Drink;
