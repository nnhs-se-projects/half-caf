/**
 * schema for a user
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
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
  subscription: {
    // mixed because the current stored subscriptions are only strings so this lets both go thro.
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
});

const User = mongoose.model("User", schema);

module.exports = User;
