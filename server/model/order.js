/**
 * schema for an order
 */

const mongoose = require("mongoose");
const User = require("./user");
const RoomNum = require("./roomNum");
const Drink = require("./drink");

const schema = new mongoose.Schema({
  user: {
    type: User,
    required: true,
  },
  room: {
    type: RoomNum,
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
  drink: {
    type: [Drink],
    required: true,
  },
});

const Order = mongoose.model("Order", schema);

module.exports = Order;
