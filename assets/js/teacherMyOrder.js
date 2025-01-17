const removeButton = document.querySelectorAll("button.remove");
for (let button of removeButton) {
  button.addEventListener("click", async () => {
    const itemIndex = button.getAttribute("drink-index");

    const response = await fetch("/updateCart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ index: itemIndex }),
    });
    if (response.ok) {
      window.location = "/teacherMyOrder";
    } else {
      console.log("error removing drink from cart");
    }
  });
}

const placeOrderButton = document.querySelector("input.placeOrder");
placeOrderButton.addEventListener("click", async () => {
  const roomNum = document.getElementById("rm").value;
  const time = new Date();

  if (roomNum === "") {
    alert("Please enter a room number.");
    return;
  }

  // formatting time
  const year = time.getFullYear();
  const month = (time.getMonth() + 1).toString().padStart(2, "0");
  const day = time.getDate().toString().padStart(2, "0");
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const formattedTime = `${year}-${month}-${day} at ${hours}:${minutes}`;

  const response = await fetch("/teacherMyOrder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rm: roomNum, timestamp: formattedTime }),
  });
  if (response.ok) {
    window.location = "/orderConfirmation";
  } else {
    console.log("error adding drink");
  }
});
