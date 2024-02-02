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
    required: true,
  },
  flavor: {
    type: [String],
    required: true,
  },
  temp: {
    type: [String],
    required: true,
  },
  caffination: {
    type: [String],
    required: true,
  },
});

const MenuItem = mongoose.model("MenuItem", schema);

module.exports = MenuItem;
