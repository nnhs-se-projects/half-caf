/**
 * schema for a period
 */
const mongoose = require("mongoose");
const scheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  hasDisabledOrdering: {
    type: Boolean,
    required: true,
  },
  orderingDisabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const Period = mongoose.model("Period", scheme);
module.exports = Period;
