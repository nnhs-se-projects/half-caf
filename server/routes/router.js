const express = require("express");
const route = express.Router();
const path = require("path");
const User = require("../model/user");
const MenuItem = require("../model/menuItem");
const Schedule = require("../model/schedule");
const Period = require("../model/period");
const Enabled = require("../model/enabled");
const Weekday = require("../model/weekdays");

const { emitToggleChange } = require("../socket/socket");

// Helper: convert an image Buffer to a data URL (tries to detect mime type)
function bufferToDataUrl(buffer) {
  if (!buffer) return null;
  // buffer may be a Mongoose Buffer object
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  // Detect common image signatures
  if (
    buf
      .slice(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return `data:image/png;base64,${buf.toString("base64")}`;
  }
  if (buf.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  }
  if (buf.slice(0, 4).toString() === "GIF8") {
    return `data:image/gif;base64,${buf.toString("base64")}`;
  }
  // Fallback to png
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function convertMenuItemsImageData(menuItems) {
  if (!menuItems) return menuItems;
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    if (item && item.imageData) {
      try {
        item.imageData = bufferToDataUrl(item.imageData);
      } catch (err) {
        console.error(
          "Failed to convert imageData for menu item",
          item._id || item.id,
          err,
        );
        item.imageData = null;
      }
    }
  }
  return menuItems;
}

async function getUserRoles(email) {
  try {
    const user = await User.findOne({ email }, "userType");
    if (user === null) {
      return null;
    }

    return user.userType;
  } catch (error) {
    console.error(error);
  }
}

const timeBeforeEnd = 10; // 10 minutes before end of period, ordering will be automatically disabled
async function checkTime() {
  const currentTimeDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
  );
  const currentTimeMs = Date.parse(currentTimeDate);
  let currentSchedule;
  try {
    const currentWeekDay = await Weekday.findOne({
      day: currentTimeDate.getDay() - 1,
    });
    if (currentWeekDay) {
      currentSchedule = await Schedule.findById(currentWeekDay.schedule);
    }
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
      period.end.substring(period.end.indexOf(":") + 1, period.end.length - 3),
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
      periodEndMin,
    );

    let periodStartHr = Number(
      period.start.substring(0, period.start.indexOf(":")),
    );
    const periodStartMin = Number(
      period.start.substring(
        period.start.indexOf(":") + 1,
        period.start.length - 3,
      ),
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
      periodStartMin,
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

// helper function to detect mobile user agents
function isMobile(userAgent) {
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent);
}

route.get("/", (req, res) => {
  if (isMobile(req.headers["user-agent"])) {
    const currentFilePath = __filename;
    const parentDirectory = path.dirname(path.dirname(currentFilePath));
    const addToHomePath = parentDirectory.substring(
      0,
      parentDirectory.lastIndexOf("/"),
    );
    res.sendFile(path.join(addToHomePath, "public/add-to-home.html"));
  } else {
    res.redirect("/auth");
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

route.get("/redirectUser", async (req, res) => {
  try {
    const role = await getUserRoles(req.session.email);
    if (role === "admin") {
      res.redirect("/admin/users");
    } else if (role === "barista") {
      res.redirect("/barista/orders");
    } else if (role === "teacher") {
      res.redirect("/teacher/popularDrinks");
    } else {
      // role is invalid or user is not logged in
      res.redirect("/auth");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
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

  convertMenuItemsImageData(popularMenu);
  res.render("homePopularDrinks", { menuItems: popularMenu });
});

route.get("/homeMenu", async (req, res) => {
  const menu = await MenuItem.find();
  convertMenuItemsImageData(menu);
  res.render("homeMenu", { menuItems: menu });
});

// Add route to handle push subscriptions for mobile web notifications
route.post("/subscribe", async (req, res) => {
  const subscription = req.body;
  console.log("Received push subscription:", subscription);
  const user = await User.findOne({ email: req.session.email });
  // now push sub into array.
  if (
    !user.subscription.find(
      (sub) => JSON.stringify(sub) === JSON.stringify(subscription),
    )
  ) {
    user.subscription.push(subscription);
  }
  await user.save();
  // TODO: Store the subscription information in your database for later use with web-push
  res.status(201).json({ message: "Subscription received" });
});

route.use("/auth", require("./auth"));
route.use("/admin", require("./admin"));
route.use("/barista", require("./barista"));
route.use("/teacher", require("./teacher"));
route.use("/delivery", require("./delivery"));

module.exports = route;
