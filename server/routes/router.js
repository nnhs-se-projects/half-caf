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

const wss = new WebSocket.Server({ port: 8081 });
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./assets/img");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});

const upload = multer({ storage: storage });

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

route.get("/", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  if (user === null) {
    if (req.session.email.indexOf("@naperville203.org") > -1) {
      const newUser = new User({
        isActivated: true,
        email: req.session.email,
        userType: "teacher",
      });
      await newUser.save();
      res.redirect("/teacherPopularDrinks");
    } else {
      // they are not in the database and do not have a staff email
      res.redirect("/auth");
    }
  } else {
    const menuItems = await MenuItem.find();
    const popularMenu = [];
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].popular === true) {
        popularMenu.push(menuItems[i]);
      }
    }

    res.render("homePopularDrinks", {
      menuItems: popularMenu,
    });
  }
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

  const jsonData = JSON.stringify({
    message: "Ordering toggle changed",
  });

  clients.forEach((client) => {
    client.send(jsonData);
  });
});

route.use(async (req, res, next) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");

  res.locals.headerData = {
    enabled: toggle.enabled,
  };

  next();
});

route.get("/auth", (req, res) => {
  res.render("auth");
});

async function getUserRoles(email) {
  try {
    const user = await User.findOne({ email }, "userType");
    if (user === null) {
      return null;
    }
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
    req.session.cart = [];
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

  // Destroy session/remove user data from session
  req.session.destroy((err) => {
    if (err) {
      return console.error("Logout error:", err);
    }
    // Redirect to home page or login page after logout
    res.redirect("/");
  });
});

route.get("/addUser", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addUser");
  }
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
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const users = await User.find();

    res.render("deleteUser", { users });
  }
});

route.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndRemove(userId);
  res.end();
});

route.get("/viewUser", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    // access all the users in the database
    const allUsers = await User.find();
    res.render("viewUser", {
      users: allUsers,
    });
  }
});

route.get("/modifyUser", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const allUsers = await User.find();

    const { id } = req.query;

    let selectedUser = undefined;
    if (id != null) {
      selectedUser = await User.findById(id);
    } else if (allUsers[0] !== null && allUsers[0] !== undefined) {
      selectedUser = allUsers[0];
    }

    res.render("modifyUser", {
      users: allUsers,
      selectedUser,
    });
  }
});

route.post("/modifyUser/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  user.email = req.body.email;
  user.userType = req.body.role;
  await user.save();
  res.status(201).end();
});

// gets the activated/ deactivated users for the view user filter
route.get("/users/:status", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
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
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
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
  }
});

route.get("/api/menuItem/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// everything loads on the Modify Drink page when a
// menu item is selected, except for flavors
route.get("/modifyDrink", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    // get id of selected drink
    const { id } = req.query;

    const menuItems = await MenuItem.find();
    const toppings = await Topping.find();
    const flavors = await Flavor.find();

    let selectedMenuItem;
    // check if any drink has been selected
    if (id != null) {
      selectedMenuItem = await MenuItem.findById(id);
    } else if (menuItems[0] !== null && menuItems[0] !== undefined) {
      selectedMenuItem = menuItems[0];
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
  }
});
// updates database with new menu item
route.post("/addDrink", upload.single("image"), async (req, res) => {
  try {
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
      imagePath: req.file ? req.file.path : null,
    });
    await drink.save();
    res.status(200).json({ message: "Drink added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

route.post("/modifyDrink/:id", upload.single("image"), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    menuItem.name = req.body.name;
    menuItem.description = req.body.description;
    menuItem.price = req.body.price;
    menuItem.flavors = req.body.checkedFlavors ? req.body.checkedFlavors : [];
    menuItem.toppings = req.body.checkedToppings
      ? req.body.checkedToppings
      : [];
    menuItem.temps = req.body.checkedTemps;
    menuItem.caffeination = req.body.caf;
    menuItem.special = req.body.special;
    menuItem.popular = req.body.popular;
    if (req.file) {
      menuItem.imagePath = req.file.path;
    }
    await menuItem.save();
    res.status(200).json({ message: "Drink added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

route.get("/deleteDrink", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const menuItems = await MenuItem.find();

    const formattedMenuItems = menuItems.map((menuItem) => {
      return {
        name: menuItem.name,
        id: menuItem._id,
      };
    });
    res.render("deleteDrink", { menuItems: formattedMenuItems });
  }
});

const fs = require("fs");

route.delete("/deleteDrink/:id", async (req, res) => {
  const menuItemId = req.params.id;
  const menuItem = await MenuItem.findById(menuItemId);

  // Asynchronously delete a file
  fs.unlink(menuItem.imagePath, (err) => {
    if (err) {
      // Handle specific error if any
      if (err.code === "ENOENT") {
        console.error("Image file does not exist.");
      } else {
        throw err;
      }
    } else {
      console.log("Image File deleted.");
    }
  });

  await MenuItem.findByIdAndRemove(menuItemId);
  res.end();
});

route.get("/metrics", (req, res) => {
  res.render("metrics");
});

// Main/Home page of barista that displays all current orders
route.get("/barista", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role === "teacher") {
    res.redirect("/redirectUser");
  } else {
    const orders = await Order.find();
    const drinkIds = orders.flatMap((order) => order.drinks);
    const drinks = await Drink.find({ _id: { $in: drinkIds } });
    const flavors = await Flavor.find({});
    const toppings = await Topping.find({});

    const drinkMap = new Map();
    for (let i = 0; i < orders.length; i++) {
      const drinkArray = [];
      for (let n = 0; n < orders[i].drinks.length; n++) {
        const formattedDrink = {
          name: "",
          flavors: [],
          toppings: [],
          temp: "",
          instructions: "",
        };
        const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
        if (drink.flavors.length === 0) {
          formattedDrink.flavors.push("None");
        } else {
          for (let x = 0; x < drink.flavors.length; x++) {
            const tempFlavor = flavors.find((f) =>
              f._id.equals(drink.flavors[x])
            );
            formattedDrink.flavors.push(" " + tempFlavor.flavor);
          }
        }
        if (drink.toppings.length === 0) {
          formattedDrink.toppings.push("None");
        } else {
          for (let x = 0; x < drink.toppings.length; x++) {
            const tempTopping = toppings.find((t) =>
              t._id.equals(drink.toppings[x])
            );
            formattedDrink.toppings.push(" " + tempTopping.topping);
          }
        }
        formattedDrink.name = drink.name;
        formattedDrink.temp = drink.temps;
        formattedDrink.instructions = drink.instructions;
        drinkArray.push(formattedDrink);
      }
      drinkMap.set(i, drinkArray);
    }

    res.render("barista", {
      orders,
      drinkMap,
    });
  }
});

route.delete("/barista/:id", async (req, res) => {
  // await Order.findByIdAndRemove(req.params.id);
  // res.end();

  const order = await Order.findById(req.params.id);
  order.cancelled = true;
  await order.save();

  const jsonData = JSON.stringify({
    message: "Order cancelled",
    cancelMessage: req.body.message,
    email: order.email,
  });

  clients.forEach((client) => {
    client.send(jsonData);
  });

  res.status(201).end();
});

route.post("/barista/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = true;
  await order.save();

  const jsonData = JSON.stringify({
    message: "Order finished",
    email: order.email,
  });

  clients.forEach((client) => {
    client.send(jsonData);
  });

  res.status(201).end();
});

// completed orders page of barista that displays all completed orders
route.get("/completed", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role === "teacher") {
    res.redirect("/redirectUser");
  } else {
    const orders = await Order.find({ complete: true });
    const drinkIds = orders.flatMap((order) => order.drinks);
    const drinks = await Drink.find({ _id: { $in: drinkIds } });
    const flavors = await Flavor.find({});
    const toppings = await Topping.find({});

    const drinkMap = new Map();
    for (let i = 0; i < orders.length; i++) {
      const drinkArray = [];
      for (let n = 0; n < orders[i].drinks.length; n++) {
        const formattedDrink = {
          name: "",
          flavors: [],
          toppings: [],
          temp: "",
          instructions: "",
        };
        const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
        if (drink.flavors.length === 0) {
          formattedDrink.flavors.push("None");
        } else {
          for (let x = 0; x < drink.flavors.length; x++) {
            const tempFlavor = flavors.find((f) =>
              f._id.equals(drink.flavors[x])
            );
            formattedDrink.flavors.push(" " + tempFlavor.flavor);
          }
        }
        if (drink.toppings.length === 0) {
          formattedDrink.toppings.push("None");
        } else {
          for (let x = 0; x < drink.toppings.length; x++) {
            const tempTopping = toppings.find((t) =>
              t._id.equals(drink.toppings[x])
            );
            formattedDrink.toppings.push(" " + tempTopping.topping);
          }
        }
        formattedDrink.name = drink.name;
        formattedDrink.temp = drink.temps;
        formattedDrink.instructions = drink.instructions;
        drinkArray.push(formattedDrink);
      }
      drinkMap.set(i, drinkArray);
    }

    res.render("completed", {
      orders,
      drinkMap,
    });
  }
});

route.post("/completed/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = false;
  await order.save();
  res.status(201).end();
});

route.get("/cancelledOrders", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role === "teacher") {
    res.redirect("/redirectUser");
  } else {
    const orders = await Order.find({ cancelled: true });
    const drinkIds = orders.flatMap((order) => order.drinks);
    const drinks = await Drink.find({ _id: { $in: drinkIds } });
    const flavors = await Flavor.find({});
    const toppings = await Topping.find({});

    const drinkMap = new Map();
    for (let i = 0; i < orders.length; i++) {
      const drinkArray = [];
      for (let n = 0; n < orders[i].drinks.length; n++) {
        const formattedDrink = {
          name: "",
          flavors: [],
          toppings: [],
          temp: "",
          instructions: "",
        };
        const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
        if (drink.flavors.length === 0) {
          formattedDrink.flavors.push("None");
        } else {
          for (let x = 0; x < drink.flavors.length; x++) {
            const tempFlavor = flavors.find((f) =>
              f._id.equals(drink.flavors[x])
            );
            formattedDrink.flavors.push(" " + tempFlavor.flavor);
          }
        }
        if (drink.toppings.length === 0) {
          formattedDrink.toppings.push("None");
        } else {
          for (let x = 0; x < drink.toppings.length; x++) {
            const tempTopping = toppings.find((t) =>
              t._id.equals(drink.toppings[x])
            );
            formattedDrink.toppings.push(" " + tempTopping.topping);
          }
        }
        formattedDrink.name = drink.name;
        formattedDrink.temp = drink.temps;
        formattedDrink.instructions = drink.instructions;
        drinkArray.push(formattedDrink);
      }
      drinkMap.set(i, drinkArray);
    }

    res.render("cancelledOrders", {
      orders,
      drinkMap,
    });
  }
});

route.post("/cancelledOrders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.cancelled = false;
  await order.save();
  res.status(201).end();
});

route.get("/addFlavor", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addFlavor");
  }
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
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const flavors = await Flavor.find();

    const formattedFlavors = flavors.map((flavor) => {
      return {
        flavor: flavor.flavor,
        id: flavor._id,
      };
    });
    res.render("deleteFlavor", { flavors: formattedFlavors });
  }
});

route.delete("/deleteFlavor/:id", async (req, res) => {
  const flavorId = req.params.id;
  await Flavor.findByIdAndRemove(flavorId);
  res.end();
});

route.get("/addTopping", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addTopping");
  }
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
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const toppings = await Topping.find();

    const formattedToppings = toppings.map((topping) => {
      return {
        topping: topping.topping,
        id: topping._id,
      };
    });
    res.render("deleteTopping", { toppings: formattedToppings });
  }
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
route.get("/teacherMenu", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const menu = await MenuItem.find();
    res.render("teacherMenu", {
      menuItems: menu,
      email: req.session.email,
    });
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
  }
}

route.get("/customizeDrink/:name", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const selectedDrink = req.params.name; // params holds parameters from the URL path
    const drinkName = decodeURIComponent(selectedDrink.replace("%20/", " ")); // convert URL-friendly string to regular name format
    try {
      const drink = await findDrinkByName(drinkName); // finds drink by name

      // available flavors array
      const flavors = [];
      for (let i = 0; i < drink.flavors.length; i++) {
        flavors[i] = await findFlavorById(drink.flavors[i]);
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
          temps: drink.temps,
          toppings: toppings,
          email: req.session.email,
        });
      } else {
        res.status(404).send("Drink not found");
      }
    } catch (error) {
      // handle error appropriately
      console.error("Error finding the drink:", error);
      res.status(500);
    }
  }
});

route.post("/customizeDrink/:name", async (req, res) => {
  // drink user is adding to order
  for (let i = 0; i < req.body.quantity; i++) {
    const drink = new Drink({
      name: req.body.name,
      price: req.body.price,
      flavors: req.body.checkedFlavors,
      toppings: req.body.checkedToppings,
      temps: req.body.temp,
      instructions: req.body.instructions,
      favorite: req.body.favorite,
    });

    await drink.save();
    req.session.cart.push(drink);

    if (req.body.favorite === true && i === 0) {
      const user = await User.findOne({ email: req.session.email });
      const index = user.favoriteDrinks.indexOf(drink.id);
      if (index === -1) {
        drink.favorite = true;
        await drink.save();
        user.favoriteDrinks.push(drink);
        await user.save();
      }
    }
  }

  res.status(200).send("Drink added to session.");
});

route.get("/teacherMyOrder", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    let customizationDict = {};
    for (const drink of req.session.cart) {
      const drinkFlavorsArray = [];
      const drinkToppingsArray = [];
      for (const flavor of drink.flavors) {
        drinkFlavorsArray.push(await findFlavorById(flavor));
      }
      for (const topping of drink.toppings) {
        drinkToppingsArray.push(await findToppingsById(topping));
      }
      customizationDict[drink._id] = {
        flavors: drinkFlavorsArray,
        toppings: drinkToppingsArray,
      };
    }
    res.render("teacherMyOrder", {
      cart: req.session.cart,
      customizationDict: customizationDict,
      email: req.session.email,
    });
  }
});

route.get("/updateCart", async (req, res) => {});

route.post("/updateCart", async (req, res) => {
  console.log("Post Updating cart");
  req.session.cart.splice(req.body.index, 1);

  res.status(200).end();
});

route.post("/teacherMyOrder", async (req, res) => {
  let total = 0;
  for (const drink of req.session.cart) {
    total += drink.price;
  }
  try {
    const order = new Order({
      email: req.session.email,
      room: req.body.rm,
      timestamp: req.body.timestamp,
      complete: false,
      cancelled: false,
      read: false,
      drinks: req.session.cart,
      totalPrice: total,
    });
    await order.save();
    const user = await User.findOne({ email: req.session.email });
    user.currentOrder = order;
    user.orderHistory.push(order);
    await user.save();

    const drinks = await Drink.find({ _id: { $in: req.session.cart } });
    const flavors = await Flavor.find({});
    const toppings = await Topping.find({});

    const drinkArray = [];
    for (let n = 0; n < order.drinks.length; n++) {
      const formattedDrink = {
        name: "",
        flavors: [],
        toppings: [],
        temp: "",
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(order.drinks[n]));
      if (drink.flavors.length === 0) {
        formattedDrink.flavors.push("None");
      } else {
        for (let x = 0; x < drink.flavors.length; x++) {
          const tempFlavor = flavors.find((f) =>
            f._id.equals(drink.flavors[x])
          );
          formattedDrink.flavors.push(" " + tempFlavor.flavor);
        }
      }
      if (drink.toppings.length === 0) {
        formattedDrink.toppings.push("None");
      } else {
        for (let x = 0; x < drink.toppings.length; x++) {
          const tempTopping = toppings.find((t) =>
            t._id.equals(drink.toppings[x])
          );
          formattedDrink.toppings.push(" " + tempTopping.topping);
        }
      }
      formattedDrink.name = drink.name;
      formattedDrink.temp = drink.temps;
      formattedDrink.instructions = drink.instructions;
      drinkArray.push(formattedDrink);
    }

    const jsonData = JSON.stringify({
      message: "New order placed",
      order,
      drinks: drinkArray,
    });

    clients.forEach((client) => {
      client.send(jsonData);
    });
  } catch (err) {
    console.log(err);
  }
  res.status(200).end();
});

route.get("/teacherPopularDrinks", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const menuItems = await MenuItem.find();
    const popularMenu = [];
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].popular === true) {
        popularMenu.push(menuItems[i]);
      }
    }
    res.render("teacherPopularDrinks", {
      menuItems: popularMenu,
      email: req.session.email,
    });
  }
});

route.get("/homePopularDrinks", async (req, res) => {
  const menuItems = await MenuItem.find();
  const popularMenu = [];
  for (let i = 0; i < menuItems.length; i++) {
    if (menuItems[i].popular === true) {
      popularMenu.push(menuItems[i]);
    }
  }

  res.render("homePopularDrinks", {
    menuItems: popularMenu,
  });
});

route.get("/homeMenu", async (req, res) => {
  const menu = await MenuItem.find();
  res.render("homeMenu", {
    menuItems: menu,
  });
});

route.get("/teacherMyFavorites", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const user = await User.findOne({ email: req.session.email });

    const favoriteDrinkIds = user.favoriteDrinks.filter(
      (drink) => drink != null
    );
    const favoriteDrinks = await Drink.find({ _id: { $in: favoriteDrinkIds } });
    const flavorIds = favoriteDrinks.flatMap((drink) => drink.flavors);
    const toppingIds = favoriteDrinks.flatMap((drink) => drink.toppings);
    const flavors = await Flavor.find({ _id: { $in: flavorIds } });
    const toppings = await Topping.find({ _id: { $in: toppingIds } });

    const favoriteDrinksFlavors = favoriteDrinks.map((drink) =>
      drink.flavors.map((flavorId) =>
        flavors.find((flavor) => flavor._id.equals(flavorId))
      )
    );

    const favoriteDrinksToppings = favoriteDrinks.map((drink) =>
      drink.toppings.map((toppingId) =>
        toppings.find((topping) => topping._id.equals(toppingId))
      )
    );

    res.render("teacherMyFavorites", {
      favoriteDrinks,
      favoriteDrinksFlavors,
      favoriteDrinksToppings,
      email: req.session.email,
    });
  }
});

route.get("/addDrinkToCart/:id", async (req, res) => {
  // drink user is adding to order
  const drink = await Drink.findById(req.params.id);
  req.session.cart.push(drink);

  res.redirect("/teacherMyOrder");
});

route.get("/unfavoriteDrink/:id", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const index = user.favoriteDrinks.indexOf(req.params.id);
  if (index > -1) {
    const drink = await Drink.findById(req.params.id);
    drink.favorite = false;
    await drink.save();
    user.favoriteDrinks.splice(index, 1);
  }
  await user.save();

  res.redirect("/teacherMyFavorites");
});

route.get("/favoriteDrinkFromHistory/:id", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const index = user.favoriteDrinks.indexOf(req.params.id);
  if (index === -1) {
    const drink = await Drink.findById(req.params.id);
    drink.favorite = true;
    await drink.save();
    user.favoriteDrinks.push(drink);
    await user.save();
  }

  res.redirect("/teacherOrderHistory");
});

route.get("/teacherOrderHistory", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const user = await User.findOne({ email: req.session.email });
    const orderIds = user.orderHistory.filter((order) => order != null);
    const orders = await Order.find({ _id: { $in: orderIds } }).populate({
      path: "drinks",
      populate: [
        { path: "flavors", model: "Flavor" },
        { path: "toppings", model: "Topping" },
      ],
    });

    const orderHistory = orders.filter((order) => order != null);

    user.orderHistory = orderHistory.map((order) => order._id); // Update user's orderHistory with non-null orders
    await user.save();

    res.render("teacherOrderHistory", {
      history: orderHistory,
      email: req.session.email,
    });
  }
});

route.get("/orderConfirmation", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    req.session.cart = [];
    res.render("orderConfirmation", { email: req.session.email });
  }
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
