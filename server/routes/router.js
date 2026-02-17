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

function formatMenuImageData(drink) {
  if (drink && drink.imageData && drink.imageData.buffer) {
    const buffer = drink.imageData.buffer;
    const potentialDataUrl = buffer.toString("utf8");

    if (potentialDataUrl.startsWith("data:image")) {
      drink.imageData = potentialDataUrl;
    } else {
      drink.imageData = `data:image/png;base64,${buffer.toString("base64")}`;
    }
  }

  return drink;
}

const timeBeforeEnd = 5; // 5 minutes before end of period, ordering will be automatically disabled
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
  let menuItems = await MenuItem.find().lean();
  menuItems = menuItems.map(formatMenuImageData);
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
  let menu = await MenuItem.find().lean();
  menu = menu.map(formatMenuImageData);
  res.render("homeMenu", {
    menuItems: menu,
  });
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

// API endpoint to get current period information
route.get("/api/current-period", async (req, res) => {
  try {
    const currentTimeDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const currentTimeMs = Date.parse(currentTimeDate);

    const currentWeekDay = await Weekday.findOne({
      day: currentTimeDate.getDay() - 1,
    });

    if (!currentWeekDay) {
      return res.json({ period: null });
    }

    const currentSchedule = await Schedule.findById(
      currentWeekDay.schedule,
    ).populate("periods");

    if (!currentSchedule) {
      return res.json({ period: null });
    }

    // Find the current period
    for (const period of currentSchedule.periods) {
      let periodEndHr = Number(
        period.end.substring(0, period.end.indexOf(":")),
      );
      const periodEndMin = Number(
        period.end.substring(
          period.end.indexOf(":") + 1,
          period.end.length - 3,
        ),
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

      // If during period
      if (currentTimeMs > startDateMs && currentTimeMs < endDateMs) {
        return res.json({
          period: {
            name: period.name,
            start: period.start,
            end: period.end,
          },
        });
      }
    }

    // No active period found
    res.json({ period: null });
  } catch (error) {
    console.error("Error fetching current period:", error);
    res.status(500).json({ error: "Failed to fetch current period" });
  }
});

route.use("/auth", require("./auth"));
route.use("/admin", require("./admin"));
route.use("/barista", require("./barista"));
route.use("/teacher", require("./teacher"));
route.use("/delivery", require("./delivery"));

module.exports = route;
