// eslint-disable-next-line no-unused-vars
function changeLocation(page) {
  // You can update these URLs to match your actual page URLs
  if (page === "popularDrinks") {
    window.location.href = "popularDrinks.ejs";
  } else if (page === "about") {
    window.location.href = "about.html";
  } else if (page === "myOrder") {
    window.location.href = "myOrder.ejs";
  }
}
