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
    required: true,
  },
  flavor: {
    type: [Flavor],
    required: true,
  },
  temp: {
    type: [Temp],
    required: true,
  },
});

const MenuItem = mongoose.model("MenuItem", schema);

module.exports = MenuItem;
