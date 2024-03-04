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
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  popular: {
    type: Boolean,
    required: false,
  },
  flavor: {
    type: [mongoose.Schema.ObjectId],
    ref: "Flavor",
    required: true,
  },
  toppings: {
    type: [mongoose.Schema.ObjectId],
    ref: "Topping",
    required: true,
  },
  temp: {
    type: [mongoose.Schema.ObjectId],
    ref: "Temp",
    required: true,
  },
  caffeination: {
    type: Boolean,
    required: false,
  },
  special: {
    type: Boolean,
    required: false,
  },
});

const MenuItem = mongoose.model("MenuItem", schema);

module.exports = MenuItem;
