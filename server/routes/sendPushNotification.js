const express = require("express");
const router = express.Router();
const Subscription = require("../model/subscription");
const webpush = require("web-push");

const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY;
if (!PUBLIC_VAPID_KEY || !PRIVATE_VAPID_KEY) {
  throw new Error(
    "VAPID keys are not set in environment variables. Please set PUBLIC_VAPID_KEY and PRIVATE_VAPID_KEY."
  );
}
webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

router.get("/", async (req, res) => {
  console.log("sendPushNotification route accessed");
  try {
    const subscriptions = await Subscription.find({});
    const payload = JSON.stringify({
      title: "Server Notification",
      options: { body: "Hello from Half Caf Server!" },
    });
    const notifiedEndpoints = [];
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        notifiedEndpoints.push(sub.endpoint);
      } catch (error) {
        console.error("Error sending notification to", sub.endpoint, error);
      }
    }
    res.send(
      `<pre>Notifications sent to:\n${notifiedEndpoints.join("\n")}</pre>`
    );
  } catch (error) {
    console.error("Error in sendPushNotification route:", error);
    res.status(500).send("Error sending notifications");
  }
});

module.exports = router;
