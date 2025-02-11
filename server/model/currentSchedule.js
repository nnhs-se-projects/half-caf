/**
 * schema for the current Schedule
 */
const mongoose = require("mongoose");
const scheme = new mongoose.Schema({
  schedule: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
});

const CurrentSchedule = mongoose.model("CurrentSchedule", scheme);
module.exports = CurrentSchedule;
