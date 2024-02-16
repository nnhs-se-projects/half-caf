/**
 * schema for toppings
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  topping: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    required: true,
  },
});

const Topping = mongoose.model("Topping", schema);

module.exports = Topping;
