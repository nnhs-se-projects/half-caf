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
  deliveryTimes: [
    {
      duration: Number,
      orderId: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
      },
      email: String,
    },
  ],
});

const deliveryPerson = mongoose.model("DeliveryPerson", schema);

module.exports = deliveryPerson;
