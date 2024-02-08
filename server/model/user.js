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
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order", // Replace 'OtherModel' with the name of the model you're referencing
  },
});

const User = mongoose.model("User", schema);

module.exports = User;
