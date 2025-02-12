/**
 * Schema for the schedule schedule
 */

const mongoose = require("mongoose");
const scheme = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
  },
  schedule: {
    type: mongoose.Schema.ObjectId,
    ref: "Schedule",
    required: true,
  },
});

const Weekday = mongoose.model("Weekday", scheme);
module.exports = Weekday;
