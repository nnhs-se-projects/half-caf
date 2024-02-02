/**
 * schema for a user
 */

const mongoose = require("mongoose");
const Order = require("./order");

const schema = new mongoose.Schema({
  isActivated: {
    type: Boolean,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    required: true,
  },
  currentOrder: {
    type: Order,
    required: true,
  },
});

const User = mongoose.model("User", schema);

module.exports = User;
