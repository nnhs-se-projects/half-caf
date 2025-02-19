/**
 * main Javascript file for the application
 *  this file is executed by the Node server
 */

// import the express module, which exports the express function
const express = require("express");
const path = require("path");

// invoke the express function to create an Express
const app = express();

// load environment variables from the .env file into process.env
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

// connect to the database
const connectDB = require("./server/database/connection");
connectDB();

// import the express-session module, which is used to manage sessions
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// add middleware to handle JSON in HTTP request bodies (used with POST commands)
app.use(express.json());

// set the template engine to EJS, which generates HTML with embedded JavaScript
app.set("view engine", "ejs");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// load assets
app.use("/css", express.static("assets/css"));
app.use("/img", express.static("assets/img"));
app.use("/js", express.static("assets/js"));
app.use("/models", express.static("assets/models")); // Ensure this line is added to serve the GLB model

// helper function to detect mobile user agents
function isMobile(userAgent) {
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent);
}

app.get("/", (req, res) => {
  if (isMobile(req.headers["user-agent"])) {
    res.sendFile(path.join(__dirname, "public", "add-to-home.html"));
  } else {
    res.render("auth");
  }
});

// app.use takes a function that is added to the chain of a request.
//  when we call next(), it goes to the next function in the chain.
app.use(async (req, res, next) => {
  if (
    req.path === "/homePopularDrinks" ||
    req.path === "/homeMenu" ||
    req.path === "/deliveryLogin" ||
    req.path.indexOf("/deliveryHome") !== -1
  ) {
    return next(); // allow access to index without authentication
  }
  // if the student is already logged in, fetch the student object from the database
  else if (req.session.email === undefined && !req.path.startsWith("/auth")) {
    res.redirect("/auth");
    return;
  }
  next();
});

// import the http module, which provides an HTTP server
const http = require("http");
const server = http.createServer(app);
const { createSocketServer } = require("./server/socket/socket");
createSocketServer(server);

// to keep this file manageable, we will move the routes to a separate file
//  the exported router object is an example of middleware
app.use("/", require("./server/routes/router"));

// start the server on port PORT_NUM from .env file
server.listen(process.env.PORT_NUM, () => {
  console.log(
    "server is listening on http://localhost:" + process.env.PORT_NUM
  );
});
