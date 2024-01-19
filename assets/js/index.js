/**
 * contains client-side JavaScript function
 *  (primarily event handlers to fetch data from the Node server)
 */
function handleSelectChange() {
  const selectedValue = document.getElementById("filter").value;

  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("habit", selectedValue);

  // Create the updated URL with the new query parameter
  const updatedURL = `${window.location.origin}${
    window.location.pathname
  }?${urlParams.toString()}`;

  window.location = updatedURL;
  console.log(updatedURL);
}

document
  .getElementById("filter")
  .addEventListener("change", handleSelectChange);
