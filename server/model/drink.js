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
  flavors: {
    type: [mongoose.Schema.ObjectId],
    ref: "Flavor",
    required: true,
  },
  toppings: {
    type: [mongoose.Schema.ObjectId],
    ref: "Topping",
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
    required: false,
  },
  completed: {
    type: Boolean,
    required: true,
  },
});

const Drink = mongoose.model("Drink", schema);

module.exports = Drink;
