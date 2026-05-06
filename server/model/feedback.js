const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", schema);

module.exports = Feedback;
