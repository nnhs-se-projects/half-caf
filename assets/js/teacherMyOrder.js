const placeOrderButton = document.querySelector("input.placeOrder");
console.log(placeOrderButton);
placeOrderButton.addEventListener("click", async () => {
  const roomNum = document.getElementById("rm").value;
  const time = new Date();

  const ordering = {
    room: roomNum,
    timestamp: time,
  };

  const response = await fetch("/teacherMyOrder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ordering),
  });
  //console.log("######" + response.tostring());
  if (response.ok) {
    window.location = "/orderConfirmation";
  } else {
    console.log("error adding drink");
  }
});
