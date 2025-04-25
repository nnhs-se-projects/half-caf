const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
