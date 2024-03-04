/**
 * schema for temperature
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  temp: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    required: true,
  },
});

const Temp = mongoose.model("Temp", schema);

module.exports = Temp;
