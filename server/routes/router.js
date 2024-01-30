const express = require("express");
const route = express.Router();
const Entry = require("../model/entry");

// easy way to assign static data (e.g., array of strings) to a variable
const habitsOfMind = require("../model/habitsOfMind.json");

// pass a path (e.g., "/") and callback function to the get method
//  when the client makes an HTTP GET request to the specified path,
//  the callback function is executed
route.get("/", async (req, res) => {
  // the req parameter references the HTTP request object, which has a number
  //  of properties
  console.log("path requested: " + req.path);

  const { habit } = req.query;

  let entries;

  if (habit && habit !== "All Habits") {
    entries = await Entry.find({ habit });
  } else {
    entries = await Entry.find();
  }

  entries.sort((a, b) => {
    const aDate = a.date;
    const bDate = b.date;
    if (aDate > bDate) {
      return -1;
    }
    if (aDate < bDate) {
      return 1;
    }
    return 0;
  });

  // convert MongoDB objects to objects formatted for the EJS template
  const formattedEntries = entries.map((entry) => {
    return {
      id: entry._id,
      date: entry.date.toLocaleDateString(),
      habit: entry.habit,
      content: entry.content.slice(0, 20) + "...",
    };
  });

  // the res parameter references the HTTP response object
  res.render("index", {
    entries: formattedEntries,
    habits: habitsOfMind,
    selectedHabit: habit,
  });
});

route.get("/createEntry", (req, res) => {
  res.render("createEntry", { habits: habitsOfMind });
});

route.post("/createEntry", async (req, res) => {
  const entry = new Entry({
    date: req.body.date,
    email: req.session.email,
    habit: req.body.habit,
    content: req.body.content,
  });
  await entry.save();
  res.status(201).end();
});

route.get("/editEntry/:id", async (req, res) => {
  const entry = await Entry.findById(req.params.id);
  console.log(entry);
  res.render("editEntry", { entry, id: req.params.id, habits: habitsOfMind });
});

route.post("/editEntry/:id", async (req, res) => {
  const entry = await Entry.findById(req.params.id);
  entry.content = req.body.content;
  entry.date = req.body.date;
  entry.habit = req.body.habit;
  await entry.save();
  res.status(201).end();
});

route.delete("/removeEntry/:id", async (req, res) => {
  const entryId = req.params.id;
  await Entry.findByIdAndRemove(entryId);
  res.status(201).end();
});

// Route Teacher Menu
route.get("/teacherMenu/", async (req, res) => {
  res.render("teacherMenu");
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
