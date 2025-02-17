/**
 * Sends the credentials from the Google Sign-In popup to the server for authentication
 *
 * @param {Object} res - the response object from the Google Sign-In popup
 */

// const UserInfo = require("../server/model/User");

// eslint-disable-next-line no-unused-vars
async function handleCredentialResponse(res) {
  const userAgent = navigator.userAgent.toLowerCase();
  const isFirefox = userAgent.includes("firefox");
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  if (isFirefox && isStandalone) {
    // In Firefox standalone PWAs, popups may fail.
    // Open a new tab to process sign-in.
    const authUrl = "/auth?token=" + encodeURIComponent(res.credential);
    window.open(authUrl, "_blank");
  } else {
    await fetch("/auth", {
      method: "POST",
      body: JSON.stringify({ token: res.credential }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Save a flag so returning mobile users can bypass login
    localStorage.setItem("authenticated", "true");
    window.location = "/redirectUser";
  }
}
