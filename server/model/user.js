/**
 * schema for a user
 */

const mongoose = require("mongoose");
const Order = require("./order");
//const Drink = require("./drink");

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
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: false,
  },
  orderHistory: {
    type: [mongoose.Schema.ObjectId],
    ref: "Drink",
    required: false,
  },
  favoriteDrinks: {
    type: [mongoose.Schema.ObjectId],
    ref: "Drink",
    required: false,
  },
});

const User = mongoose.model("User", schema);

module.exports = User;
