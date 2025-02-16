/**
 * schema for a schedule
 */
const mongoose = require("mongoose");
const scheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  periods: {
    type: [mongoose.Schema.ObjectId],
    ref: "Period",
    required: true,
  },
});

const Schedule = mongoose.model("Schedule", scheme);
module.exports = Schedule;
