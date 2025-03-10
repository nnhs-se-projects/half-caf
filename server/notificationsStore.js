const pendingNotifications = {};

function addNotification(email, notification) {
  if (!pendingNotifications[email]) {
    pendingNotifications[email] = [];
  }
  pendingNotifications[email].push(notification);
}

function getNotifications(email) {
  const notifications = pendingNotifications[email] || [];
  // Clear notifications once fetched
  pendingNotifications[email] = [];
  return notifications;
}

module.exports = { addNotification, getNotifications };
