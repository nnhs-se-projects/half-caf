/**
 * schema for toppings
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  toppings: {
    type: [String],
    required: true,
  },
});

const Topping = mongoose.model("Topping", schema);

module.exports = Topping;
