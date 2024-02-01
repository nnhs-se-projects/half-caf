/**
 * schema for a roomNum
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  number: {
    type: [Number],
    required: true,
  },
});

const RoomNum = mongoose.model("RoomNum", schema);

module.exports = RoomNum;
