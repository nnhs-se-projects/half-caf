/**
 * helpers for the "7:05 AM" strings used to store period start and end times
 */

/**
 * converts a stored period time into minutes since midnight, so periods can be
 *  compared and sorted. returns null if the string isn't in the expected shape.
 */
function parseTimeToMinutes(timeString) {
  if (typeof timeString !== "string") {
    return null;
  }

  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes > 59) {
    return null;
  }

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }
  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * true if the string is a period time this app can store and parse
 */
function isValidPeriodTime(timeString) {
  return parseTimeToMinutes(timeString) !== null;
}

module.exports = { parseTimeToMinutes, isValidPeriodTime };
