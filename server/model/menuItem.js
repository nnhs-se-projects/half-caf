/**
 * schema for a menuItem
 */

const mongoose = require("mongoose");
/**
const Flavor = require("./flavor");
const Temp = require("./temp");
const Caf = require("./caf");
*/

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
  flavors: {
    type: [String],
    required: true,
  },
  toppings: {
    type: [String],
    required: true,
  },
  temp: {
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
});

const MenuItem = mongoose.model("MenuItem", schema);

module.exports = MenuItem;
