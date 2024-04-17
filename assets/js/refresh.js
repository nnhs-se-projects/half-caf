// Client-side code
const ws = new WebSocket("localhost:8080/addUser");

ws.onmessage = function (event) {
  // Handle message from server
  if (event.data === "Data updated") {
    // Reload the page if data has been updated
    console.log("reload page");
    location.reload();
  }
};

/* // refresh.js

// Function to check for updates
function checkForUpdates() {
  // Create a new XMLHttpRequest object
  const xhr = new XMLHttpRequest();

  // Configure the AJAX request
  xhr.open("GET", "/checkForUpdates");

  // Set up the callback function
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        // Parse the response JSON
        const response = JSON.parse(xhr.responseText);
        if (response.updated) {
          // Reload the page if data has been updated
          location.reload();
        }
      }
    }
  };

  // Send the AJAX request
  xhr.send();
}

// Call checkForUpdates() every 5 seconds (adjust as needed)
setInterval(checkForUpdates, 5000);
 */
