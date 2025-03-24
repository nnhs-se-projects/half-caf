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
const Weekday = require("../model/weekdays");
const DeliveryPerson = require("../model/deliveryPerson");

const devEmails = [
  "bfjesso@stu.naperville203.org",
  "rekrzyzanowski@stu.naperville203.org",
  "jjkrzyzanowski@stu.naperville203.org",
  "egkohl@stu.naperville203.org",
];

route.get("/admin/addSchedule", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addSchedule");
  }
});

route.post("/admin/addSchedule", async (req, res) => {
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

route.delete("/admin/deleteSchedule", async (req, res) => {
  const schedule = await Schedule.findById(req.body.id);
  await Period.deleteMany({ _id: { $in: schedule.periods } });
  await Schedule.findByIdAndRemove(req.body.id);
  res.end();
});

route.get("/admin/scheduler", async (req, res) => {
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

route.get("/admin/addUser", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addUser");
  }
});

route.post("/admin/addUser", async (req, res) => {
  const user = new User({
    email: req.body.email,
    userType: req.body.userType,
  });
  await user.save();
  res.status(201).end();
});

route.get("/admin/deleteUser", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    const users = await User.find();

    res.render("deleteUser", { users });
  }
});

route.delete("/admin/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndRemove(userId);
  res.end();
});

route.get("/admin/modifyUser", async (req, res) => {
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

route.post("/admin/modifyUser/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  user.email = req.body.email;
  user.userType = req.body.role;
  await user.save();
  res.status(201).end();
});

route.get("/admin/addDrink", async (req, res) => {
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

// everything loads on the Modify Drink page when a
// menu item is selected, except for flavors
route.get("/admin/modifyDrink", async (req, res) => {
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
route.post("/admin/addDrink", async (req, res) => {
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

route.post("/admin/modifyDrink/:id", async (req, res) => {
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

route.get("/admin/deleteDrink", async (req, res) => {
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

route.delete("/admin/deleteDrink/:id", async (req, res) => {
  await MenuItem.findByIdAndRemove(req.params.id);
  res.end();
});

route.get("/admin/metrics", async (req, res) => {
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

route.delete("/admin/wipeDevOrders", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
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
  }
});

route.delete("/admin/wipeOrders", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    await Order.deleteMany();
    await Drink.deleteMany();
    res.end();
  }
});

route.get("/admin/addFlavor", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addFlavor");
  }
});

// updates database with new flavor options
route.post("/admin/addFlavor", async (req, res) => {
  const flavor = new Flavor({
    flavor: req.body.flavor,
    isAvailable: true,
  });
  await flavor.save();
  res.status(201).end();
});

route.get("/admin/deleteFlavor", async (req, res) => {
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

route.delete("/admin/deleteFlavor/:id", async (req, res) => {
  const flavorId = req.params.id;
  await Flavor.findByIdAndRemove(flavorId);
  res.end();
});

route.get("/admin/addTopping", async (req, res) => {
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    res.redirect("/redirectUser");
  } else {
    res.render("addTopping");
  }
});

// updates database with new topping options
route.post("/admin/addTopping", async (req, res) => {
  const topping = new Topping({
    topping: req.body.topping,
    isAvailable: true,
    price: req.body.price,
  });
  await topping.save();
  res.status(201).end();
});

route.get("/admin/deleteTopping", async (req, res) => {
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

route.delete("/admin/deleteTopping/:id", async (req, res) => {
  const toppingId = req.params.id;
  await Topping.findByIdAndRemove(toppingId);
  res.end();
});
