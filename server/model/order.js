/**
 * schema for an order
 */

const mongoose = require("mongoose");
const User = require("./user");
const RoomNum = require("./roomNum");

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
  /**
   * Figure out how to dynamically accommodate
   * number of drinks in order
   */
});

const Order = mongoose.model("Order", schema);

module.exports = Order;
