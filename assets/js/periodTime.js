/**
 * Period start and end times are stored as display strings like "7:05 AM",
 *  but <input type="time"> works in 24 hour "HH:MM" values. These helpers
 *  convert between the two so the create-schedule and scheduler pages agree
 *  on the stored format.
 */

// "07:05" -> "7:05 AM"
function convertTimeToAmPm(timeStr) {
  if (!timeStr) {
    return "";
  }

  const timeSplit = timeStr.split(":");
  let hours = Number(timeSplit[0]);
  let meridian;

  if (hours > 12) {
    meridian = "PM";
    hours -= 12;
  } else if (hours < 12) {
    meridian = "AM";
    if (hours === 0) {
      hours = 12;
    }
  } else {
    meridian = "PM";
  }

  return hours + ":" + timeSplit[1] + " " + meridian;
}

// "7:05 AM" -> "07:05"
function convertAmPmToTime(amPmStr) {
  if (!amPmStr) {
    return "";
  }

  const match = amPmStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return "";
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridian = match[3].toUpperCase();

  if (meridian === "PM" && hours !== 12) {
    hours += 12;
  }
  if (meridian === "AM" && hours === 12) {
    hours = 0;
  }

  return String(hours).padStart(2, "0") + ":" + minutes;
}

// these are plain browser scripts rather than modules, so the helpers are
//  shared by attaching them to window. see the "globals" entry in .eslintrc.json
window.convertTimeToAmPm = convertTimeToAmPm;
window.convertAmPmToTime = convertAmPmToTime;
