const placeOrderButton = document.querySelector("input.placeOrder");
console.log(placeOrderButton);
placeOrderButton.addEventListener("click", async () => {
  const roomNum = document.getElementById("rm").value;
  const time = new Date();
  // time.toLocaleDateString();

  const year = time.getFullYear();
  const month = (time.getMonth() + 1).toString().padStart(2, "0"); // getMonth() is zero-based
  const day = time.getDate().toString().padStart(2, "0");
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  const formattedTime = `${year}-${month}-${day} at ${hours}:${minutes}`;

  const ordering = {
    rm: roomNum,
    timestamp: formattedTime,
  };

  const response = await fetch("/teacherMyOrder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ordering),
  });
  if (response.ok) {
    window.location = "/orderConfirmation";
  } else {
    console.log("error adding drink");
  }
});
