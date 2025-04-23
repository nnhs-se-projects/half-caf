const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temps.json");
const Drink = require("../model/drink");
const Order = require("../model/order");
const Schedule = require("../model/schedule");
const Period = require("../model/period");
const Enabled = require("../model/enabled");
const Weekday = require("../model/weekdays");
const DeliveryPerson = require("../model/deliveryPerson");
const {
  emitToggleChange,
  emitOrderCompleted,
  emitOrderCancelled,
  emitOrderClaimed,
  emitNewOrderPlaced,
} = require("../socket/socket");
const devEmails = [
  "bfjesso@stu.naperville203.org",
  "rekrzyzanowski@stu.naperville203.org",
  "jjkrzyzanowski@stu.naperville203.org",
  "egkohl@stu.naperville203.org",
];

const timeBeforeEnd = 10; // 10 minutes before end of period, ordering will be automatically disabled
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
    // console.log(error);
    return;
  }
  if (!currentSchedule) {
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
    const endDate = new Date(
      currentTimeDate.getFullYear(),
      currentTimeDate.getMonth(),
      currentTimeDate.getDate(),
      periodEndHr,
      periodEndMin
    );

    let periodStartHr = Number(
      period.start.substring(0, period.start.indexOf(":"))
    );
    const periodStartMin = Number(
      period.start.substring(
        period.start.indexOf(":") + 1,
        period.start.length - 3
      )
    );
    if (period.start.indexOf("PM") > -1 && periodStartHr !== 12) {
      periodStartHr += 12;
    }
    if (period.start.indexOf("AM") > -1 && periodStartHr === 12) {
      periodStartHr = 0;
    }
    const startDate = new Date(
      currentTimeDate.getFullYear(),
      currentTimeDate.getMonth(),
      currentTimeDate.getDate(),
      periodStartHr,
      periodStartMin
    );
    const startDateMs = Date.parse(startDate);
    const endDateMs = Date.parse(endDate);
    const timeToEnd = endDateMs - currentTimeMs;
    // If during period
    if (currentTimeMs > startDateMs && currentTimeMs < endDateMs) {
      const toggle = await Enabled.findById("660f6230ff092e4bb15122da");

      // Check if period was manually disabled in the scheduler
      if (period.orderingDisabled) {
        if (toggle.enabled) {
          toggle.enabled = false;
          await toggle.save();
          emitToggleChange();
          return;
        }
      }

      // If at the end of the period
      if (timeToEnd > 0 && timeToEnd <= timeBeforeEnd * 60 * 1000) {
        if (!period.hasDisabledOrdering) {
          toggle.enabled = false;
          toggle.reason = "Scheduler";
          await toggle.save();
          period.hasDisabledOrdering = true;
          await period.save();
          emitToggleChange();
        }
      } else if (period.hasDisabledOrdering) {
        toggle.enabled = true;
        await toggle.save();
        period.hasDisabledOrdering = false;
        await period.save();
        emitToggleChange();
      }
    }
  }
}

setInterval(checkTime, 15000); // check every 15 sec

route.get("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  res.render("_adminHeader", { enabled: toggle });
});

// updating toggleEnabled
route.post("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  toggle.enabled = req.body.enabled;
  toggle.reason = "Admin/Barista";
  await toggle.save();
  emitToggleChange();
});

route.use(async (req, res, next) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");

  res.locals.headerData = {
    enabled: toggle.enabled,
    reason: toggle.reason,
  };

  next();
});

route.get("/auth", (req, res) => {
  if (req.session.email) {
    res.redirect("/redirectUser");
  } else {
    res.render("auth");
  }
});

// Separate redirectUser route is used to easily redirect
//    the user dependent on their role
route.get("/redirectUser", async (req, res) => {
  console.log("Redirecting user.");
  try {
    const user = await User.findOne({ email: req.session.email });
    const role = await getUserRoles(req.session.email);
    req.session.cart = [];
    if (role === "admin") {
      res.redirect("/addUser");
    } else if (role === "barista") {
      res.redirect("/barista");
    } else if (role === "teacher") {
      res.redirect("/teacherPopularDrinks");
    } else if (
      (user === null || user === undefined) &&
      req.session.email.indexOf("@naperville203.org") > -1
    ) {
      console.log("User is a staff member, creating account...");
      const newUser = new User({
        email: req.session.email,
        userType: "teacher",
      });
      await newUser.save();
      res.redirect("/teacherPopularDrinks");
    } else {
      req.session.email = "";
      res.redirect("/auth"); // User is either not a staff member, not in the database, or has an invalid role.
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

  // Remove drinks from cart and clean up
  for (const drink of req.session.cart) {
    await Drink.findByIdAndRemove(drink);
  }

  req.session.destroy((err) => {
    if (err) {
      return console.error("Logout error:", err);
    }
    // Redirect to auth page after logout
    res.redirect("/auth");
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

route.post("/updatePeriod", async (req, res) => {
  const { periodId, orderingDisabled } = req.body;
  try {
    const period = await Period.findById(periodId);

    if (period) {
      period.orderingDisabled = orderingDisabled;
      await period.save();
      console.log("Period updated successfully");
      res.status(200).json({ message: "Period updated successfully" });
    } else {
      console.log("Period not found");
      res.status(404).json({ message: "Period not found" });
    }
  } catch (error) {
    console.error("Error updating period:", error);
    res.status(500).json({ message: "Internal server error" });
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
    allowDecaf: req.body.allowDecaf,
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
    menuItem.allowDecaf = req.body.allowDecaf;
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
  const deliveryPersons = await DeliveryPerson.find();
  const delivererNames = [];
  const averageDeliveryTimePerPerson = [];
  for (const person of deliveryPersons) {
    delivererNames.push(person.name);
    let sum = 0;
    for (let i = 0; i < person.deliveryTimes.length; i++) {
      sum += person.deliveryTimes[i].duration;
    }
    averageDeliveryTimePerPerson.push(sum / person.deliveryTimes.length);
  }

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
    averageDeliveryTimePerPerson,
    delivererNames,
  });
});

route.delete("/wipeOrders", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    await Order.deleteMany();
    await Drink.deleteMany();
    res.end();
  }
});

route.delete("/wipeDevOrders", async (req, res) => {
  const deliveryPersons = await DeliveryPerson.find();
  for (const person of deliveryPersons) {
    person.deliveryTimes = person.deliveryTimes.filter((time) => {
      return !devEmails.includes(time.email);
    });
    await person.save();
  }

  const devOrders = await Order.find({ email: { $in: devEmails } });

  for (const order of devOrders) {
    for (const drinkId of order.drinks) {
      await Drink.findByIdAndRemove(drinkId);
    }
    await Order.findByIdAndRemove(order._id);
  }
  res.status(200).send("Deleted all dev orders");
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

route.get("/deliveryPersonManager", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const deliveryPersons = await DeliveryPerson.find();

    res.render("deliveryPersonManager", { deliveryPersons });
  }
});
route.post("/addDeliveryPerson", async (req, res) => {
  console.log(req.body);
  const deliveryPerson = new DeliveryPerson({
    name: req.body.name,
    pin: req.body.pin,
  });
  await deliveryPerson.save();
  res.status(201).end();
});
route.delete("/deleteDeliveryPerson", async (req, res) => {
  await DeliveryPerson.findByIdAndRemove(req.body.id);
  res.end();
});
// Add route to handle push subscriptions for mobile web notifications
route.post("/subscribe", (req, res) => {
  const subscription = req.body;
  console.log("Received push subscription:", subscription);
  // TODO: Store the subscription information in your database for later use with web-push
  res.status(201).json({ message: "Subscription received" });
});

route.use("/auth", require("./auth"));
route.use("/barista", require("./barista"));
route.use("/teacher", require("./teacher"));
route.use("/delivery", require("./delivery"));

module.exports = route;
