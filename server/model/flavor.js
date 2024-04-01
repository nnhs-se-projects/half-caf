/**
 * schema for flavoring
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  flavor: String,
  isAvailable: Boolean,
});

const Flavor = mongoose.model("Flavor", schema);

module.exports = Flavor;
