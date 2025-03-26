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
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
  claimTime: {
    type: Number,
    required: true,
  },
  complete: {
    type: Boolean,
    required: true,
  },
  claimed: {
    type: Boolean,
    required: true,
  },
  delivered: {
    type: Boolean,
    required: true,
  },
  cancelled: {
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
  totalPrice: {
    type: Number,
    required: true,
  },
  timer: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
});

const Order = mongoose.model("Order", schema);

module.exports = Order;
