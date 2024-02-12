/**
 * schema for a user
 */

const mongoose = require("mongoose");
const Order = require("./order");
const Drink = require("./drink");

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
  orderHistory: {
    type: [Order],
    required: false,
  },
  favoriteDrinks: {
    type: [Drink],
    required: false,
  },
});

const User = mongoose.model("User", schema);

module.exports = User;
