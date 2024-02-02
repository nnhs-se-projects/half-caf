/**
 * schema for temperature
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  options: {
    type: [String],
    required: true,
  },
});

const Temp = mongoose.model("Temp", schema);

module.exports = Temp;
