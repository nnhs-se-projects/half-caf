const { Server } = require("socket.io");

let io;
function createSocketServer(httpServer) {
  io = new Server(httpServer, {
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

    return io;
  });
}

function emitToggleChange() {
  io.emit("Ordering toggle changed", {});
}

function emitOrderCancelled(data) {
  io.emit("Order cancelled", data);
}

function emitOrderFinished(data) {
  io.emit("Order finished", data);
}

function emitNewOrderPlaced(data) {
  io.emit("New order placed", data);
}

module.exports = {
  createSocketServer,
  emitToggleChange,
  emitOrderCancelled,
  emitOrderFinished,
  emitNewOrderPlaced,
};
