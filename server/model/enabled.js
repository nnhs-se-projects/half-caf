/**
 * schema for enabling orders
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    required: true,
  },
  reason: {
    type: String,
    required: false,
    default: null,
  },
});

const Enabled = mongoose.model("Enabled", schema);

module.exports = Enabled;
