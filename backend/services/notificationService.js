const store = require('../store');

class NotificationService {
  getNotifications(bookingId) {
    if (!bookingId) return [];
    return store.getNotifications(bookingId);
  }

  addNotification(bookingId, notificationData) {
    return store.addNotification(bookingId, {
      read: false,
      created_at: new Date().toISOString(),
      ...notificationData
    });
  }

  markAllAsRead(bookingId) {
    const list = store.getNotifications(bookingId);
    list.forEach(n => n.read = true);
    return list;
  }
}

module.exports = new NotificationService();
