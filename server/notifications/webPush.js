const webPush = require("web-push");
require("dotenv").config();

// Set VAPID details using the keys from .env
webPush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Function to send push notification using a subscription and payload
function sendPushNotification(subscription, payload) {
  webPush.sendNotification(subscription, payload).catch((err) => {
    console.error("Error sending push", err);
  });
}

module.exports = { sendPushNotification };
