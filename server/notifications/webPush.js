const webPush = require("web-push");
require("dotenv").config();

// Set VAPID details using keys from .env
webPush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Updated function using async/await
async function sendPushNotification(subscription, payload) {
  try {
    await webPush.sendNotification(subscription, payload);
  } catch (err) {
    console.error("Error sending push", err);
  }
}

module.exports = { sendPushNotification };
