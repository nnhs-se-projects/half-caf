const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");

route.get("/", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/auth", (req, res) => {
  res.render("auth");
});

async function getUserRoles(email) {
  try {
    var user = await User.findOne({ email: email }, "userType");
    var userRole = user.userType;
    return userRole;
  } catch (error) {
    console.error(error);
  }
}

route.get("/redirectUser", async (req, res) => {
  try {
    var role = await getUserRoles(req.session.email);
    if (role === "admin") {
      res.redirect("/addUser");
    } else if (role === "barista") {
      res.redirect("/barista");
    } else if (role === "teacher") {
      res.redirect("/teacherPopularDrinks");
    } else {
      console.log("Role Not Recognized");
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
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

route.post("/addFlavor", async (req, res) => {
  const flavor = new Flavor({
    flavor: req.body.flavor,
    isAvailable: true,
  });
  await flavor.save();
  res.status(201).end();
});

route.get("/deleteFlavor", async (req, res) => {
  const flavors = await Flavor.find();

  const formattedFlavors = flavors.map((flavor) => {
    return {
      flavor: flavor.flavor,
      id: flavor._id,
    };
  });
  res.render("deleteFlavor", { flavors: formattedFlavors });
});

route.delete("/deleteFlavor/:id", async (req, res) => {
  const flavorId = req.params.id;
  await Flavor.findByIdAndRemove(flavorId);
  res.end();
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
    price: req.body.price,
  });
  await topping.save();
  res.status(201).end();
});

route.get("/deleteTopping", async (req, res) => {
  const toppings = await Topping.find();

  const formattedToppings = toppings.map((topping) => {
    return {
      topping: topping.topping,
      id: topping._id,
    };
  });
  res.render("deleteTopping", { toppings: formattedToppings });
});

route.delete("/deleteTopping/:id", async (req, res) => {
  const toppingId = req.params.id;
  await Topping.findByIdAndRemove(toppingId);
  res.end();
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
