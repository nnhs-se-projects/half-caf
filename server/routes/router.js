const express = require("express");
const route = express.Router();
const Entry = require("../model/entry");

route.get("/", async (req, res) => {});

route.get("/admin", (req, res) => {
  res.render("admin", {
    // entries: formattedEntries,
    // habits: habitsOfMind,
    // selectedHabit: habit,
  });
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
