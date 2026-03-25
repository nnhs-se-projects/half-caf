/**
 * Schema for an announcement
 */

const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  visibleFrom: {
    type: Date,
    default: Date.now,
  },
  visibleUntil: {
    type: Date,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const announcement = mongoose.model("Announcement", schema);

module.exports = announcement;
