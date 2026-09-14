/**
 * shared formatting for menu item and drink images
 */

/**
 * menu images are stored as a Buffer that may hold either raw image bytes or
 *  an already-encoded data URL. this normalises both into a data URL the
 *  templates can drop straight into a src attribute.
 */
function formatImageData(drink) {
  if (drink && drink.imageData && drink.imageData.buffer) {
    const buffer = drink.imageData.buffer;
    const potentialDataUrl = buffer.toString("utf8");

    if (potentialDataUrl.startsWith("data:image")) {
      drink.imageData = potentialDataUrl;
    } else {
      drink.imageData = `data:image/png;base64,${buffer.toString("base64")}`;
    }
  }

  return drink;
}

module.exports = { formatImageData };
