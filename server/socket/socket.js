const { Server } = require("socket.io");

let io;
function createSocketServer(httpServer) {
  if (!io) {
    io = new Server(httpServer, {
      pollingDuration: 1000,
      connectionStateRecovery: {},
      connectTimeout: 1000,
    });

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

function emitOrderCancelled(data) {
  if (io) {
    io.emit("Order cancelled", data);
  }
}

function emitOrderFinished(data) {
  if (io) {
    io.emit("Order finished", data);
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
  emitOrderCancelled,
  emitOrderFinished,
  emitNewOrderPlaced,
};
