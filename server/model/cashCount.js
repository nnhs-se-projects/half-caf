/**
 * schema for a cash count reconciliation
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  totalCounted: {
    type: Number,
    required: true,
  },
  expectedTotal: {
    type: Number,
    required: true,
  },
  difference: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CashCount = mongoose.model("CashCount", schema);

module.exports = CashCount;
