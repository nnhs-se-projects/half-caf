const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Ingredient = require("../model/ingredient");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temps.json");
const Drink = require("../model/drink");
const Order = require("../model/order");
const Schedule = require("../model/schedule");
const Period = require("../model/period");
const Announcement = require("../model/announcement");
const Weekday = require("../model/weekdays");
const DeliveryPerson = require("../model/deliveryPerson");
const webPush = require("web-push");

const devEmails = [
  "bfjesso@stu.naperville203.org",
  "rekrzyzanowski@stu.naperville203.org",
  "jjkrzyzanowski@stu.naperville203.org",
  "egkohl@stu.naperville203.org",
];

// Set VAPID details. Mke sure ENV IN SERVER HAS IT
webPush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

route.get("/addSchedule", async (req, res) => {
  res.render("addSchedule");
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
    const findDay = await Weekday.findOne({ day });
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
  res.render("addUser");
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
  const users = await User.find();
  res.render("deleteUser", { users });
});

route.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndRemove(userId);
  res.end();
});

route.get("/modifyUser", async (req, res) => {
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
});

route.post("/modifyUser/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  user.email = req.body.email;
  user.userType = req.body.role;
  await user.save();
  res.status(201).end();
});

route.get("/addDrink", async (req, res) => {
  const ingredients = await Ingredient.find();

  res.render("addDrink", {
    temps: TempJson,
    ingredients,
  });
});

route.get("/api/menuItem/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

route.get("/modifyDrink", async (req, res) => {
  // get id of selected drink
  const { id } = req.query;

  const menuItems = await MenuItem.find();
  const ingredients = await Ingredient.find();

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
    ingredients,
    temps: TempJson,
  });
});
// updates database with new menu item
route.post("/addDrink", async (req, res) => {
  const drink = new MenuItem({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    popular: req.body.popular,
    ingredients: req.body.checkedIngredients,
    ingredientCounts: req.body.ingredientCounts,
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
    menuItem.ingredients = req.body.checkedIngredients
      ? req.body.checkedIngredients
      : [];
    menuItem.ingredientCounts = req.body.ingredientCounts;
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
  await MenuItem.findByIdAndRemove(req.params.id);
  res.end();
});

route.get("/inventoryManager", async (req, res) => {
  const ingredients = await Ingredient.find();
  const orders = await Order.find();
  const dailyConsumptionAvgs = [];
  const currentTime = new Date().getTime();
  for (const ingredient of ingredients) {
    let totalConsumption = 0;
    for (const order of orders) {
      const orderDateStr = order.timestamp.substring(
        0,
        order.timestamp.indexOf(" ") // only get the year, day, and month
      );
      const orderDate = new Date(orderDateStr);
      const orderTime = orderDate.getTime();
      if (
        order.complete === true &&
        orderTime >= currentTime - 1209600000 // 14 days in milliseconds
      ) {
        for (const drinkId of order.drinks) {
          const drink = await Drink.findById(drinkId);
          if (drink && drink.ingredients.includes(ingredient.id)) {
            totalConsumption +=
              drink.ingredientCounts[drink.ingredients.indexOf(ingredient.id)];
          }
        }
      }
    }
    dailyConsumptionAvgs.push(
      totalConsumption / 10 // Average over the last 10 business days (assuming no orders are placed on weekends)
    );
  }

  // For each menu item add up the cost of the ingredients and push to a list
  const menuItems = await MenuItem.find();
  const menuItemExpenses = [];
  for (const menuItem of menuItems) {
    let totalCost = 0;
    let i = 0;
    for (const ingredientId of menuItem.ingredients) {
      const ingredient = await Ingredient.findById(ingredientId);
      if (ingredient) {
        totalCost += ingredient.price * menuItem.ingredientCounts[i];
      }
      i++;
    }
    menuItemExpenses.push(totalCost);
  }

  const drinks = await Drink.find({ completed: true });

  let allTimeExpenses = 0;
  let allTimeRevenue = 0;
  for (const drink of drinks) {
    let i = 0;
    for (const ingredientId of drink.ingredients) {
      const ingredient = await Ingredient.findById(ingredientId);
      if (ingredient) {
        allTimeExpenses += ingredient.price * drink.ingredientCounts[i];
      }
      i++;
    }

    allTimeRevenue += drink.price;
  }

  // get individual costs for the last 50 drinks
  drinks.reverse().slice(0, 50);
  const drinkExpenses = [];
  for (const drink of drinks) {
    let totalCost = 0;
    let i = 0;
    for (const ingredientId of drink.ingredients) {
      const ingredient = await Ingredient.findById(ingredientId);
      if (ingredient) {
        totalCost += ingredient.price * drink.ingredientCounts[i];
      }
      i++;
    }
    drinkExpenses.push(totalCost);
  }

  res.render("inventoryManager", {
    ingredients,
    dailyConsumptionAvgs,
    menuItems,
    menuItemExpenses,
    drinks,
    drinkExpenses,
    allTimeExpenses,
    allTimeRevenue,
  });
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
  const ingredients = await Ingredient.find();
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

  const ingredientNames = [];
  const ordersPerIngredient = [];
  for (const ingredient of ingredients) {
    let ordersOfIngredient = 0;
    for (const drink of drinks) {
      if (
        drink.completed === true &&
        drink.ingredients.includes(ingredient.id)
      ) {
        ordersOfIngredient++;
      }
    }

    ingredientNames.push(ingredient.name);
    ordersPerIngredient.push(ordersOfIngredient);
  }

  res.render("metrics", {
    userEmails,
    ordersPerUser,
    revenuePerUser,
    menuItemNames,
    ordersPerMenuItem,
    revenuePerMenuItem,
    ingredientNames,
    ordersPerIngredient,
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
  await Order.deleteMany();
  await Drink.deleteMany();

  const users = await User.find({});
  for (const user of users) {
    user.orderHistory = [];
    user.favoriteDrinks = [];
    user.currentOrder = null;
    await user.save();
  }

  const deliveryPersons = await DeliveryPerson.find({});
  for (const deliveryPerson of deliveryPersons) {
    deliveryPerson.currentOrder = null;
    await deliveryPerson.save();
  }

  res.end();
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

  const users = await User.find({ email: { $in: devEmails } });
  for (const user of users) {
    user.orderHistory = [];
    user.favoriteDrinks = [];
    user.currentOrder = null;
    await user.save();
  }

  res.status(200).send("Deleted all dev orders");
});

route.get("/addIngredient", async (req, res) => {
  res.render("addIngredient");
});

route.post("/addIngredient", async (req, res) => {
  const ingredient = new Ingredient({
    name: req.body.name,
    quantity: req.body.quantity,
    orderThreshold: req.body.orderThreshold,
    unit: req.body.unit,
    price: req.body.price,
    type: req.body.type,
  });
  await ingredient.save();
  res.status(201).end();
});

route.get("/editIngredient", async (req, res) => {
  const ingredients = await Ingredient.find();
  // Determine the selected ingredient if an id query parameter is provided
  const { id } = req.query;
  let selectedIngredient = null;
  if (id != null) {
    selectedIngredient = await Ingredient.findById(id);
  } else if (ingredients[0] !== null && ingredients[0] !== undefined) {
    selectedIngredient = ingredients[0];
  } else {
    selectedIngredient = undefined;
  }
  res.render("editIngredient", { ingredients, selectedIngredient });
});

route.post("/editIngredient/:id", async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);
  ingredient.name = req.body.name;
  ingredient.quantity = req.body.quantity;
  ingredient.orderThreshold = req.body.orderThreshold;
  ingredient.unit = req.body.unit;
  ingredient.price = req.body.price;
  ingredient.type = req.body.type;
  await ingredient.save();
  res.status(201).end();
});

route.get("/deleteIngredient", async (req, res) => {
  const ingredients = await Ingredient.find();
  res.render("deleteIngredient", { ingredients });
});

route.delete("/deleteIngredient/:id", async (req, res) => {
  const ingredientId = req.params.id;
  await Ingredient.findByIdAndRemove(ingredientId);
  res.end();
});

route.get("/deliveryPersonManager", async (req, res) => {
  const deliveryPersons = await DeliveryPerson.find();
  res.render("deliveryPersonManager", { deliveryPersons });
});

route.post("/addDeliveryPerson", async (req, res) => {
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

route.get("/sendAnnouncement", async (req, res) => {
  const announcements = await Announcement.find().sort({ Date: -1 });
  res.render("sendAnnouncement", { announcements });
});

route.post("/sendAnnouncement", async (req, res) => {
  try {
    const users = await User.find({
      subscription: { $exists: true, $ne: null },
    });
    for (const user of users) {
      if (user.subscription && user.subscription.length) {
        const payload = JSON.stringify({
          title: req.body.subject,
          options: {
            body: req.body.message,
            icon: "../img/Half_Caf_Logo_(1).png",
          },
        });
        for (const sub of user.subscription) {
          try {
            await webPush.sendNotification(sub, payload);
          } catch (error) {
            console.error(
              "Push notification failed for user:",
              user.email,
              error
            );
          }
        }
      }
    }
    const announcement = new Announcement({
      subject: req.body.subject,
      message: req.body.message,
      Date: new Date(),
    });
    await announcement.save();
    res.status(200).send("Mobile notifications sent.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending notifications.");
  }
});

module.exports = route;
