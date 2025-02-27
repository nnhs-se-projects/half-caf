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
  currentOrder: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: false,
  },
  deliveryTimes: {
    type: [Number],
    required: false,
  },
});

const deliveryPerson = mongoose.model("DeliveryPerson", schema);

module.exports = deliveryPerson;
