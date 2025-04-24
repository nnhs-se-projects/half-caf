const { Server } = require("socket.io");

let io;
function createSocketServer(httpServer) {
  if (!io) {
    io = new Server(httpServer, {
      connectionStateRecovery: {},
    });

    // io.engine.on("connection_error", (err) => {
    //   console.log(err.req); // the request object
    //   console.log(err.code); // the error code, for example 1
    //   console.log(err.message); // the error message, for example "Session ID unknown"
    //   console.log(err.context); // some additional error context
    // });

    io.on("connection", (socket) => {
      // console.log("a user connected");

      // add additional socket.on code here to handle incoming events
      //  from the client

      socket.on("disconnect", () => {
        // console.log("user disconnected");
      });
    });
  }

  return io;
}

function emitToggleChange() {
  if (io) {
    io.emit("Ordering toggle changed", {});
  }
}

function emitOrderCompleted(data) {
  if (io) {
    io.emit("Order completed", data);
  }
}

function emitOrderCancelled(data) {
  if (io) {
    io.emit("Order cancelled", data);
  }
}

function emitOrderClaimed(data) {
  if (io) {
    io.emit("Order claimed", data);
  }
}

function emitNewOrderPlaced(data) {
  if (io) {
    io.emit("New order placed", data);
  }
}

module.exports = {
  createSocketServer,
  emitToggleChange,
  emitOrderCompleted,
  emitOrderCancelled,
  emitOrderClaimed,
  emitNewOrderPlaced,
};
