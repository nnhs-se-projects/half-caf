const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Enabled = require("../model/user");

route.get("/", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/addUser", (req, res) => {
  res.render("addUser");
});

route.post("/addUser", async (req, res) => {
  const user = new User({
    isActivated: true,
    email: req.body.email,
    userType: req.body.userType,
  });
  await user.save();
  res.status(201).end();
});

route.get("/deleteUser", async (req, res) => {
  const users = await User.find();

  const formattedUsers = users.map((user) => {
    return {
      email: user.email,
      id: user._id,
    };
  });
  res.render("deleteUser", { usersJs: formattedUsers });
});

route.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndRemove(userId);
  res.end();
});

route.get("/viewUser", (req, res) => {
  res.render("viewUser");
});

route.get("/addDrink", (req, res) => {
  res.render("addDrink");
});

route.get("/modifyDrink", (req, res) => {
  res.render("modifyDrink");
});

route.get("/deleteDrink", (req, res) => {
  res.render("deleteDrink");
});

route.get("/addFlavor", (req, res) => {
  res.render("addFlavor");
});

route.get("/deleteFlavor", (req, res) => {
  res.render("deleteFlavor");
});

route.get("/barista", (req, res) => {
  res.render("barista");
});

route.get("/completed", (req, res) => {
  res.render("completed");
});

// Route Teacher Menu
route.get("/teacherMenu/", async (req, res) => {
  res.render("teacherMenu");
});
route.get("/teacherPopularDrinks", async (req, res) => {
  res.render("teacherPopularDrinks");
});

route.get("/homePopularDrinks", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/teacherMyOrder", async (req, res) => {
  res.render("teacherMyOrder");
});

route.get("/teacherMyFavorites", async (req, res) => {
  res.render("teacherMyFavorites");
});

route.get("/teacherOrderHistory", async (req, res) => {
  res.render("teacherOrderHistory");
});

route.get("/orderConfirmation", async (req, res) => {
  res.render("orderConfirmation");
});

route.get("/customizeDrink", async (req, res) => {
  const { drink, price, description } = req.query; // Extract query parameters
  res.render("customizeDrink", { drink, price, description });
}); // Pass parameters to view renderer

route.get("/addTopping", async (req, res) => {
  res.render("addTopping");
});

route.post("/addTopping", async (req, res) => {
  const topping = new Topping({
    topping: req.body.topping,
    isAvailable: true,
  });
  await topping.save();
  res.status(201).end();
});

route.get("/deleteTopping", async (req, res) => {
  res.render("deleteTopping");
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

/** 
// updating toggleEnabled
route.get("/_adminHeader", async (req, res) => {
  Enabled.updateOne(); // add parameter
  await Enabled.save();
  res.status(201).end();
});
*/

module.exports = route;
