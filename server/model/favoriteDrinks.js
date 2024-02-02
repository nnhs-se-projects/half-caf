/**
 * schema for favorite drinks
 */

const mongoose = require("mongoose");
const User = require("./user");
const Drink = require("./drink");

const schema = new mongoose.Schema({
  user: {
    type: User,
    required: true,
  },
  drinks: {
    type: [Drink],
    required: true,
  },
});

const FavoriteDrinks = mongoose.model("FavoriteDrinks", schema);

module.exports = FavoriteDrinks;
