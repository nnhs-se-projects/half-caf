/**
 * schema for an order
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  room: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  complete: {
    type: Boolean,
    required: true,
  },
  read: {
    type: Boolean,
    required: false,
  },
  drinks: {
    type: [mongoose.Schema.ObjectId],
    ref: "Drink",
    required: true,
  },
});

const Order = mongoose.model("Order", schema);

module.exports = Order;
