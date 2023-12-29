/**
 * Sends the credentials from the Google Sign-In popup to the server for authentication
 *
 * @param {Object} res - the response object from the Google Sign-In popup
 */

// eslint-disable-next-line no-unused-vars
async function handleCredentialResponse(res) {
  await fetch("/auth", {
    // send the googleUser's id_token which has all the data we want to the server with a POST request
    method: "POST",
    body: JSON.stringify({
      token: res.credential,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  // redirect to the index page
  window.location = "/";
}
