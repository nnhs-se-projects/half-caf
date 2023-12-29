/**
 * schema for a journal entry
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  habit: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const Entry = mongoose.model("Entry", schema);

module.exports = Entry;
