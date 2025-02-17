if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", function (event) {
    if (event.data && event.data.type === "NEW_VERSION_AVAILABLE") {
      window.location.reload();
    }
  });
}
