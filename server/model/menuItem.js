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
    type: String,
    required: true,
  },
  popular: {
    type: Boolean,
    required: false,
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
    type: [String],
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
  imageData: {
    type: Buffer,
    required: false,
  },
});

const MenuItem = mongoose.model("MenuItem", schema);

module.exports = MenuItem;
