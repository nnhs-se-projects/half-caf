const webPush = require("web-push");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

webPush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

let subscriptions = []; // In production, use a persistent store

function addSubscription(subscription) {
  // Avoid duplicates if needed
  subscriptions.push(subscription);
}

function sendPushNotification(payload) {
  subscriptions.forEach((subscription) => {
    webPush
      .sendNotification(subscription, JSON.stringify(payload))
      .catch((error) => {
        console.error("Error sending notification", error);
      });
  });
}

module.exports = {
  addSubscription,
  sendPushNotification,
};
