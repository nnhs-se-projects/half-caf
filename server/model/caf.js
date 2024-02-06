/**
 * schema for caffeination
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  isCaffeinated: {
    type: Boolean,
    required: true,
  },
});

const Caf = mongoose.model("Caf", schema);

module.exports = Caf;
