/**
 * Schema for a delivery person
 */

const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  pin: {
    type: String,
    required: true,
  },
});

const deliveryPerson = mongoose.model("DeliveryPerson", schema);

module.exports = deliveryPerson;
