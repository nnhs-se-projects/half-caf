/**
 * schema for flavoring
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  flavors: {
    type: [String],
    required: true,
  },
});

const Flavor = mongoose.model("Flavor", schema);

module.exports = Flavor;
