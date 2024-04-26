const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temps.json");
const Toppings = require("../model/topping");
const Drink = require("../model/drink");
const Order = require("../model/order");
const Enabled = require("../model/enabled");
const WebSocket = require("ws");

route.get("/", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/auth", (req, res) => {
  res.render("auth");
});

route.get("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  res.render("_adminHeader", { enabled: toggle });
});

// updating toggleEnabled
route.post("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  toggle.enabled = req.body.enabled;
  await toggle.save();
});

let sendToggle = false;
route.use((req, res, next) => {
  const ws = new WebSocket("ws://localhost:8081");

  ws.on("message", (message) => {
    const jsonData = JSON.parse(message);
    sendToggle = jsonData.toggle;
  });

  res.locals.headerData = {
    enabled: sendToggle,
  };
  next();
});

const wss = new WebSocket.Server({ port: 8081 });

// Client connections storage
let clients = [];

// WebSocket connection handling
wss.on("connection", (ws) => {
  clients.push(ws); // Add client to storage

  // Handle client disconnection
  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
  });
});

let pastValue;
async function checkForUpdates() {
  const enabled = await Enabled.findById("660f6230ff092e4bb15122da");
  let updated = false;
  if (enabled.enabled === pastValue) {
    updated = false;
  } else {
    updated = true;
  }

  pastValue = enabled.enabled;

  const sendData = {
    message: "Data updated",
    toggle: enabled.enabled,
  };

  const jsonData = JSON.stringify(sendData);

  if (updated === true) {
    // If updates detected, notify all connected clients
    clients.forEach((client) => {
      client.send(jsonData);
    });
  }
}
setInterval(checkForUpdates, 1000);

async function getUserRoles(email) {
  try {
    const user = await User.findOne({ email }, "userType");
    const userRole = user.userType;
    return userRole;
  } catch (error) {
    console.error(error);
  }
}

// Separate redirectUser route is used to easily redirect
//    the user dependent on their role
route.get("/redirectUser", async (req, res) => {
  try {
    const role = await getUserRoles(req.session.email);
    if (role === "admin") {
      res.redirect("/addUser");
    } else if (role === "barista") {
      res.redirect("/barista");
    } else if (role === "teacher") {
      req.session.cart = [];
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

route.get("/logout", async (req, res) => {
  if (req.session.token) {
    // Revoke Google's access token
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${req.session.token}`,
      {
        method: "POST",
      }
    ).catch((err) => {
      console.error("Error revoking token:", err);
    });
  }

  // Destroy session or remove user data from session
  req.session.destroy((err) => {
    if (err) {
      return console.error("Logout error:", err);
    }
    // Redirect to home page or login page after logout
    res.redirect("/");
  });
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

route.get("/viewUser", async (req, res) => {
  // access all the users in the database
  const allUsers = await User.find();
  res.render("viewUser", {
    users: allUsers,
  });
});
// gets the activated/ deactivated users for the view user filter
route.get("/users/:status", async (req, res) => {
  const status = req.params.status;
  try {
    let users;
    if (status === "activated") {
      users = await User.find({ isActivated: true });
    } else if (status === "deactivated") {
      users = await User.find({ isActivated: false });
    } else {
      // If status is not 'activated' or 'deactivated', fetch all users
      users = await User.find();
    }
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// not working yet but will update the database based on if the user is activated or deactivated
route.post("/updateUserStatus", async (req, res) => {
  const { userIds, isActivated } = req.body;
  try {
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActivated: isActivated } }
    );
    //   user.isActivated = req.body.isActivated;
    res.status(200).json({ message: "User status updated successfully." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
  // for (let use of allUsers) {
  //   const userId = req.params.id;
  //   let user = await use.findById(userId);
  //   user.isActivated = req.body.isActivated;
  //   await user.save();
  //   console.log(user);
  //   res.status(201).end();
  // }
});

route.get("/addDrink", async (req, res) => {
  const flavors = await Flavor.find();
  const toppings = await Topping.find();

  const formattedFlavors = flavors.map((flavor) => {
    return {
      flavor: flavor.flavor,
      id: flavor._id,
    };
  });

  const formattedToppings = toppings.map((topping) => {
    return {
      topping: topping.topping,
      id: topping._id,
    };
  });
  res.render("addDrink", {
    temps: TempJson,
    toppings: formattedToppings,
    flavors: formattedFlavors,
  });
});
// updates database with new menu item
route.post("/addDrink", async (req, res) => {
  const drink = new MenuItem({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    popular: req.body.popular,
    flavors: req.body.checkedFlavors,
    toppings: req.body.checkedToppings,
    temps: req.body.checkedTemps,
    caffeination: req.body.caf,
    special: req.body.special,
  });
  await drink.save();
  res.status(200).end();
});

// everything loads on the Modify Drink page when a
// menu item is selected, except for flavors
route.get("/modifyDrink", async (req, res) => {
  // get id of selected drink
  const { id } = req.query;

  const menuItems = await MenuItem.find();
  const toppings = await Topping.find();
  const flavors = await Flavor.find();

  let selectedMenuItem;
  // check if any drink has been selected
  if (id != null) {
    selectedMenuItem = await MenuItem.findById(id);
  } else {
    selectedMenuItem = undefined;
  }

  const formattedMenuItems = menuItems.map((menuItem) => {
    return {
      name: menuItem.name,
      id: menuItem._id,
    };
  });

  res.render("modifyDrink", {
    menuItems: formattedMenuItems,
    selectedMenuItem,
    toppings,
    flavors,
    temps: TempJson,
  });
});

route.get("/deleteDrink", async (req, res) => {
  const menuItems = await MenuItem.find();

  const formattedMenuItems = menuItems.map((menuItem) => {
    return {
      name: menuItem.name,
      id: menuItem._id,
    };
  });
  res.render("deleteDrink", { menuItems: formattedMenuItems });
});

route.delete("/deleteDrink/:id", async (req, res) => {
  const menuItemId = req.params.id;
  await MenuItem.findByIdAndRemove(menuItemId);
  res.end();
});

// Main/Home page of the Barista branch that displays all current orders
route.get("/barista", async (req, res) => {
  const orders = await Order.find();
  const drinks = await Drink.find();
  res.render("barista", {
    orders,
    drinks,
  });
});

route.get("/addFlavor", (req, res) => {
  res.render("addFlavor");
});
// updates database with new flavor options
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

route.get("/addTopping", async (req, res) => {
  res.render("addTopping");
});

// updates database with new topping options
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

// route.get("/barista", (req, res) => {
//   res.render("barista");
// });

route.get("/completed", (req, res) => {
  res.render("completed");
});

// Route Teacher Menu
route.get("/teacherMenu/", async (req, res) => {
  const menu = await MenuItem.find();
  res.render("teacherMenu", {
    menuItems: menu,
  });
});

route.get("/customizeDrink/:name", async (req, res) => {
  const selectedDrink = req.params.name; // params holds parameters from the URL path
  const drinkName = decodeURIComponent(selectedDrink.replace("%20/", " ")); // convert URL-friendly string to regular name format
  try {
    const drink = await findDrinkByName(drinkName); // finds drink by name

    // available flavors array
    const flavors = [];
    for (let i = 0; i < drink.flavor.length; i++) {
      flavors[i] = await findFlavorById(drink.flavor[i]);
    }

    // available toppings array
    const toppings = [];
    for (let i = 0; i < drink.toppings.length; i++) {
      toppings[i] = await findToppingsById(drink.toppings[i]);
    }

    if (drink) {
      res.render("customizeDrink", {
        drink: drink,
        flavors: flavors,
        temps: drink.temp,
        toppings: toppings,
      });
    } else {
      res.status(404).send("Drink not found");
    }
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink:", error);
    res.status(500);
  }
});

// gets drink object by its name
async function findDrinkByName(drinkName) {
  try {
    const drink = await MenuItem.findOne({ name: drinkName });
    return drink;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink by name:", error);
    res.status(500);
  }
}

// finds flavor object by id given by drink.flavor
async function findFlavorById(id) {
  try {
    const flavor = await Flavor.findOne({ _id: id });
    return flavor;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the flavor:", error);
    res.status(500);
  }
}

// finds topping objects by id given by drink.toppings
async function findToppingsById(id) {
  try {
    const toppings = await Toppings.findOne({ _id: id });
    return toppings;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink by name:", error);
    res.status(500);
  }
}

route.post("/customizeDrink/:name", async (req, res) => {
  // drink user is adding to order
  const drink = new Drink({
    name: req.body.name,
    price: req.body.price,
    flavors: req.body.checkedFlavors,
    toppings: req.body.checkedToppings,
    temp: req.body.temp,
    // caffeination: req.body.caf,
    instructions: req.body.instructions,
    favorite: req.body.favorite,
  });
  await drink.save();
  req.session.cart.push(drink);
  res.status(200).send("Drink added to session.");
});

route.get("/teacherMyOrder", async (req, res) => {
  res.render("teacherMyOrder", { cart: req.session.cart });
});

route.post("/teacherMyOrder", async (req, res) => {
  try {
    const order = new Order({
      email: req.session.email,
      room: req.body.rm,
      timestamp: req.body.timestamp,
      complete: false,
      read: false,
      drinks: req.session.cart,
    });
    await order.save();
    const user = await User.findOne({ email: req.session.email });
    user.currentOrder = order;
    await user.save();
  } catch (err) {
    console.log(err);
  }
  res.status(200).end();
});

route.get("/teacherPopularDrinks", async (req, res) => {
  res.render("teacherPopularDrinks");
});

route.get("/homePopularDrinks", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/teacherMyFavorites", async (req, res) => {
  res.render("teacherMyFavorites");
});

route.get("/teacherOrderHistory", async (req, res) => {
  res.render("teacherOrderHistory");
});

route.get("/orderConfirmation", async (req, res) => {
  req.session.cart = [];
  res.render("orderConfirmation");
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
