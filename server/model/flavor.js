/**
 * schema for flavoring
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  flavor: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    required: true,
  },
});

const Flavor = mongoose.model("Flavor", schema);

module.exports = Flavor;
