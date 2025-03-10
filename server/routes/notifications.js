const express = require("express");
const router = express.Router();
const { getNotifications } = require("../notificationsStore");

router.get("/", (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.json([]);
  }
  const notifs = getNotifications(email);
  res.json(notifs);
});

module.exports = router;
