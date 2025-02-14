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
const Schedule = require("../model/schedule");
const Period = require("../model/period");
const Enabled = require("../model/enabled");
const Weekday = require("../model/weekdays");
const {
  emitToggleChange,
  emitOrderCancelled,
  emitOrderFinished,
  emitNewOrderPlaced,
} = require("../socket/socket");

const timeBeforeEnd = 5; // 5 minutes before end of period, ordering will be automatically disabled
async function checkTime() {
  const currentTimeDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const currentTimeMs = Date.parse(currentTimeDate);
  let currentSchedule;
  try {
    const currentWeekDay = await Weekday.findOne({
      day: currentTimeDate.getDay() - 1,
    });
    currentSchedule = await Schedule.findById(currentWeekDay.schedule);
  } catch (error) {
    console.log(error);
    return;
  }
  for (const periodId of currentSchedule.periods) {
    const period = await Period.findById(periodId);
    let periodEndHr = Number(period.end.substring(0, period.end.indexOf(":")));
    const periodEndMin = Number(
      period.end.substring(period.end.indexOf(":") + 1, period.end.length - 3)
    );
    if (period.end.indexOf("PM") > -1 && periodEndHr !== 12) {
      periodEndHr += 12;
    }
    if (period.end.indexOf("AM") > -1 && periodEndHr === 12) {
      periodEndHr = 0;
    }
    const endDateMs = Date.parse(
      new Date(
        currentTimeDate.getFullYear(),
        currentTimeDate.getMonth(),
        currentTimeDate.getDate(),
        periodEndHr,
        periodEndMin
      ).toLocaleString("en-US", {
        timeZone: "America/Chicago",
      })
    );
    const difference = endDateMs - currentTimeMs;
    if (difference > 0 && difference <= timeBeforeEnd * 60 * 1000) {
      if (!period.hasDisabledOrdering) {
        const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
        toggle.enabled = false;
        await toggle.save();
        period.hasDisabledOrdering = true;
        await period.save();
        emitToggleChange();
      }
    } else if (period.hasDisabledOrdering) {
      const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
      toggle.enabled = true;
      await toggle.save();
      period.hasDisabledOrdering = false;
      await period.save();
      emitToggleChange();
    }
  }
}

setInterval(checkTime, 5000); // check every 5 sec

route.get("/", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  if (user === null) {
    if (req.session.email.indexOf("@naperville203.org") > -1) {
      const newUser = new User({
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

  emitToggleChange();
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

  for (const drink of req.session.cart) {
    await Drink.findByIdAndRemove(drink);
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

route.get("/addSchedule", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addSchedule");
  }
});

route.post("/addSchedule", async (req, res) => {
  const periodIds = [];
  for (const period of req.body.periods) {
    const newPeriod = new Period({
      name: period.name,
      start: period.start,
      end: period.end,
      hasDisabledOrdering: false,
    });
    await newPeriod.save();

    periodIds.push(newPeriod._id);
  }
  const schedule = new Schedule({
    name: req.body.name,
    periods: periodIds,
  });

  for (const day of req.body.days) {
    const findDay = await Weekday.findOne({ day: day });
    findDay.schedule = schedule._id;
    await findDay.save();
  }

  await schedule.save();
  res.status(201).end();
});

route.delete("/deleteSchedule", async (req, res) => {
  const schedule = await Schedule.findById(req.body.id);
  await Period.deleteMany({ _id: { $in: schedule.periods } });
  await Schedule.findByIdAndRemove(req.body.id);
  res.end();
});

route.get("/scheduler", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const schedules = await Schedule.find();
    const selectedPeriods = [];

    const { id } = req.query;
    let selectedSchedule;
    let activeSchedule;
    try {
      const currentTime = new Date();
      const currentWeekDay = await Weekday.findOne({
        day: currentTime.getDay() - 1,
      });
      activeSchedule = await Schedule.findById(currentWeekDay.schedule);
    } catch {
      activeSchedule = schedules[0];
    }

    if (id != null) {
      selectedSchedule = await Schedule.findById(id);
    } else {
      selectedSchedule = activeSchedule;
    }
    if (selectedSchedule) {
      for (const period of selectedSchedule.periods) {
        const periodData = await Period.findById(period);
        selectedPeriods.push(periodData);
      }
    }

    res.render("scheduler", {
      activeSchedule,
      selectedSchedule,
      schedules,
      selectedPeriods,
    });
  }
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

route.get("/modifyUser", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const allUsers = await User.find();

    const { id } = req.query;

    let selectedUser;
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
route.post("/addDrink", async (req, res) => {
  console.log(req.body);
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
    imageData: req.body.imageData,
  });
  await drink.save();
  res.status(200).end();
});

route.post("/modifyDrink/:id", async (req, res) => {
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
    menuItem.imageData = req.body.imageData
      ? req.body.imageData
      : menuItem.imageData;
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

route.delete("/deleteDrink/:id", async (req, res) => {
  await MenuItem.findByIdAndRemove(req.params.id);
  res.end();
});

route.get("/metrics", async (req, res) => {
  const orders = await Order.find();
  const drinks = await Drink.find();
  const users = await User.find();
  const flavors = await Flavor.find();
  const toppings = await Topping.find();
  const menuItems = await MenuItem.find();

  const ordersPerHour = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const revenuePerHour = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const averageTimerPerHour = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ];
  let totalTimer = 0;
  let totalOrders = 0;
  for (const order of orders) {
    if (order.complete === false) {
      continue;
    }
    const time = order.timestamp.substring(14, 20);
    if (order.timer !== "uncompleted") {
      switch (true) {
        case time.substring(0, 2) === "12" && time.indexOf("a") > -1:
          ordersPerHour[0]++;
          revenuePerHour[0] += order.totalPrice;
          averageTimerPerHour[0].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "1:" && time.indexOf("a") > -1:
          ordersPerHour[1]++;
          revenuePerHour[1] += order.totalPrice;
          averageTimerPerHour[1].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "2:" && time.indexOf("a") > -1:
          ordersPerHour[2]++;
          revenuePerHour[2] += order.totalPrice;
          averageTimerPerHour[2].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "3:" && time.indexOf("a") > -1:
          ordersPerHour[3]++;
          revenuePerHour[3] += order.totalPrice;
          averageTimerPerHour[3].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "4:" && time.indexOf("a") > -1:
          ordersPerHour[4]++;
          revenuePerHour[4] += order.totalPrice;
          averageTimerPerHour[4].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "5:" && time.indexOf("a") > -1:
          ordersPerHour[5]++;
          revenuePerHour[5] += order.totalPrice;
          averageTimerPerHour[5].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;

          break;
        case time.substring(0, 2) === "6:" && time.indexOf("a") > -1:
          ordersPerHour[6]++;
          revenuePerHour[6] += order.totalPrice;
          averageTimerPerHour[6].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "7:" && time.indexOf("a") > -1:
          ordersPerHour[7]++;
          revenuePerHour[7] += order.totalPrice;
          averageTimerPerHour[7].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "8:" && time.indexOf("a") > -1:
          ordersPerHour[8]++;
          revenuePerHour[8] += order.totalPrice;
          averageTimerPerHour[8].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "9:" && time.indexOf("a") > -1:
          ordersPerHour[9]++;
          revenuePerHour[9] += order.totalPrice;
          averageTimerPerHour[9].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "10" && time.indexOf("a") > -1:
          ordersPerHour[10]++;
          revenuePerHour[10] += order.totalPrice;
          averageTimerPerHour[10].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "11" && time.indexOf("a") > -1:
          ordersPerHour[11]++;
          revenuePerHour[11] += order.totalPrice;
          averageTimerPerHour[11].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "12" && time.indexOf("p") > -1:
          ordersPerHour[12]++;
          revenuePerHour[12] += order.totalPrice;
          averageTimerPerHour[12].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "1:" && time.indexOf("p") > -1:
          ordersPerHour[13]++;
          revenuePerHour[13] += order.totalPrice;
          averageTimerPerHour[13].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "2:" && time.indexOf("p") > -1:
          ordersPerHour[14]++;
          revenuePerHour[14] += order.totalPrice;
          averageTimerPerHour[14].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "3:" && time.indexOf("p") > -1:
          ordersPerHour[15]++;
          revenuePerHour[15] += order.totalPrice;
          averageTimerPerHour[15].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "4:" && time.indexOf("p") > -1:
          ordersPerHour[16]++;
          revenuePerHour[16] += order.totalPrice;
          averageTimerPerHour[16].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "5:" && time.indexOf("p") > -1:
          ordersPerHour[17]++;
          revenuePerHour[17] += order.totalPrice;
          averageTimerPerHour[17].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "6:" && time.indexOf("p") > -1:
          ordersPerHour[18]++;
          revenuePerHour[18] += order.totalPrice;
          averageTimerPerHour[18].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "7:" && time.indexOf("p") > -1:
          ordersPerHour[19]++;
          revenuePerHour[19] += order.totalPrice;
          averageTimerPerHour[19].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "8:" && time.indexOf("p") > -1:
          ordersPerHour[20]++;
          revenuePerHour[20] += order.totalPrice;
          averageTimerPerHour[20].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "9:" && time.indexOf("p") > -1:
          ordersPerHour[21]++;
          revenuePerHour[21] += order.totalPrice;
          averageTimerPerHour[21].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "10" && time.indexOf("p") > -1:
          ordersPerHour[22]++;
          revenuePerHour[22] += order.totalPrice;
          averageTimerPerHour[22].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
        case time.substring(0, 2) === "11" && time.indexOf("p") > -1:
          ordersPerHour[23]++;
          revenuePerHour[23] += order.totalPrice;
          averageTimerPerHour[23].push(Number(order.timer));
          totalTimer += Number(order.timer);
          totalOrders++;
          break;
      }
    }
  }

  for (let hour of averageTimerPerHour) {
    let sum = 0;
    for (let i = 0; i < hour.length; i++) {
      sum += hour[i];
    }
    hour = sum / hour.length;
  }
  const averageTimer = totalTimer / totalOrders;

  const userEmails = [];
  const ordersPerUser = [];
  const revenuePerUser = [];
  let totalOrdersNum = 0;
  let totalRevenue = 0;
  for (const user of users) {
    let ordersFromUser = 0;
    let revenueFromUser = 0;
    for (const order of orders) {
      if (order.complete === true && order.email === user.email) {
        ordersFromUser++;
        revenueFromUser += order.totalPrice;
      }
    }
    totalOrdersNum += ordersFromUser;
    totalRevenue += revenueFromUser;
    userEmails.push(user.email);
    ordersPerUser.push(ordersFromUser);
    revenuePerUser.push(revenueFromUser);
  }

  const menuItemNames = [];
  const ordersPerMenuItem = [];
  const revenuePerMenuItem = [];
  let totalDrinkOrdersNum = 0;
  for (const menuItem of menuItems) {
    let ordersOfMenuItem = 0;
    let revenueOfMenuItem = 0;
    for (const drink of drinks) {
      if (drink.completed === true && drink.name === menuItem.name) {
        ordersOfMenuItem++;
        revenueOfMenuItem += drink.price;
      }
    }

    totalDrinkOrdersNum += ordersOfMenuItem;
    menuItemNames.push(menuItem.name);
    ordersPerMenuItem.push(ordersOfMenuItem);
    revenuePerMenuItem.push(revenueOfMenuItem);
  }

  const toppingNames = [];
  const ordersPerTopping = [];
  for (const topping of toppings) {
    let ordersOfTopping = 0;
    for (const drink of drinks) {
      if (drink.completed === true && drink.toppings.includes(topping.id)) {
        ordersOfTopping++;
      }
    }

    toppingNames.push(topping.topping);
    ordersPerTopping.push(ordersOfTopping);
  }

  const flavorNames = [];
  const ordersPerFlavor = [];
  for (const flavor of flavors) {
    let ordersOfFlavor = 0;
    for (const drink of drinks) {
      if (drink.completed === true && drink.flavors.includes(flavor.id)) {
        ordersOfFlavor++;
      }
    }

    flavorNames.push(flavor.flavor);
    ordersPerFlavor.push(ordersOfFlavor);
  }
  res.render("metrics", {
    userEmails,
    ordersPerUser,
    revenuePerUser,
    menuItemNames,
    ordersPerMenuItem,
    revenuePerMenuItem,
    toppingNames,
    ordersPerTopping,
    flavorNames,
    ordersPerFlavor,
    totalOrdersNum,
    totalDrinkOrdersNum,
    totalRevenue,
    ordersPerHour,
    revenuePerHour,
    averageTimerPerHour,
    averageTimer,
  });
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

    for (const order of orders) {
      if (order.drinks.length === 0) {
        await Order.findByIdAndRemove(order._id);
      }
    }

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
            if (tempFlavor !== null && tempFlavor !== undefined) {
              formattedDrink.flavors.push(" " + tempFlavor.flavor);
            }
          }
        }
        if (drink.toppings.length === 0) {
          formattedDrink.toppings.push("None");
        } else {
          for (let x = 0; x < drink.toppings.length; x++) {
            const tempTopping = toppings.find((t) =>
              t._id.equals(drink.toppings[x])
            );
            if (tempTopping !== null && tempTopping !== undefined) {
              formattedDrink.toppings.push(" " + tempTopping.topping);
            }
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

  emitOrderCancelled({
    cancelMessage: req.body.message,
    email: order.email,
  });

  res.status(201).end();
});

route.post("/barista/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = true;
  order.timer = req.body.t;
  await order.save();

  for (const drinkId of order.drinks) {
    const drink = await Drink.findById(drinkId);
    drink.completed = true;
    await drink.save();
  }

  emitOrderFinished({ email: order.email });

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
            if (tempFlavor !== null && tempFlavor !== undefined) {
              formattedDrink.flavors.push(" " + tempFlavor.flavor);
            }
          }
        }
        if (drink.toppings.length === 0) {
          formattedDrink.toppings.push("None");
        } else {
          for (let x = 0; x < drink.toppings.length; x++) {
            const tempTopping = toppings.find((t) =>
              t._id.equals(drink.toppings[x])
            );
            if (tempTopping !== null && tempTopping !== undefined) {
              formattedDrink.toppings.push(" " + tempTopping.topping);
            }
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

  for (const drinkId of order.drinks) {
    const drink = await Drink.findById(drinkId);
    drink.completed = false;
    await drink.save();
  }

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
            if (tempFlavor !== null && tempFlavor !== undefined) {
              formattedDrink.flavors.push(" " + tempFlavor.flavor);
            }
          }
        }
        if (drink.toppings.length === 0) {
          formattedDrink.toppings.push("None");
        } else {
          for (let x = 0; x < drink.toppings.length; x++) {
            const tempTopping = toppings.find((t) =>
              t._id.equals(drink.toppings[x])
            );
            if (tempTopping !== null && tempTopping !== undefined) {
              formattedDrink.toppings.push(" " + tempTopping.topping);
            }
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
          drink,
          flavors,
          temps: drink.temps,
          toppings,
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
  let quantity = req.body.quantity;
  quantity = quantity < 1 ? 1 : quantity > 9 ? 9 : quantity;
  for (let i = 0; i < quantity; i++) {
    const drink = new Drink({
      name: req.body.name,
      price: req.body.price,
      flavors: req.body.checkedFlavors,
      toppings: req.body.checkedToppings,
      temps: req.body.temp,
      instructions: req.body.instructions,
      favorite: req.body.favorite,
      completed: false,
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

route.get("/teacherMyCart", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "teacher" && role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const customizationDict = {};
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
    res.render("teacherMyCart", {
      cart: req.session.cart,
      customizationDict,
      email: req.session.email,
    });
  }
});

route.get("/updateCart", async (req, res) => {});

route.post("/updateCart", async (req, res) => {
  console.log("Post Updating cart");
  await Drink.findByIdAndRemove(req.session.cart[req.body.index]);
  req.session.cart.splice(req.body.index, 1);

  res.status(200).end();
});

route.post("/teacherMyCart", async (req, res) => {
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
      timer: "uncompleted",
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
          if (tempFlavor !== null && tempFlavor !== undefined) {
            formattedDrink.flavors.push(" " + tempFlavor.flavor);
          }
        }
      }
      if (drink.toppings.length === 0) {
        formattedDrink.toppings.push("None");
      } else {
        for (let x = 0; x < drink.toppings.length; x++) {
          const tempTopping = toppings.find((t) =>
            t._id.equals(drink.toppings[x])
          );
          if (tempTopping !== null && tempTopping !== undefined) {
            formattedDrink.toppings.push(" " + tempTopping.topping);
          }
        }
      }
      formattedDrink.name = drink.name;
      formattedDrink.temp = drink.temps;
      formattedDrink.instructions = drink.instructions;
      drinkArray.push(formattedDrink);
    }

    emitNewOrderPlaced({
      order,
      drinks: drinkArray,
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

  res.redirect("/teacherMyCart");
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
      history: orderHistory.reverse(),
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
