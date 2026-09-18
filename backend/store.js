class Store {
  constructor() {
    this.bookings = new Map();
    this.itineraries = new Map();
    this.conversations = new Map(); // booking_id -> array of { sender, message, timestamp, type }
    this.notifications = new Map(); // booking_id -> array of notifications
    this.currentWeather = {
      condition: 'Clear',
      description: 'Clear sunny sky',
      temp: 29,
      rain_probability: 5,
      area: 'Candolim, Goa',
      is_simulated: true,
      last_updated: new Date().toISOString()
    };
  }

  createBooking(bookingData) {
    const bookingId = bookingData.booking_id || `BK-${Date.now().toString(36).toUpperCase()}`;
    const record = {
      ...bookingData,
      booking_id: bookingId,
      created_at: new Date().toISOString(),
      status: 'confirmed'
    };
    this.bookings.set(bookingId, record);
    if (!this.conversations.has(bookingId)) {
      this.conversations.set(bookingId, []);
    }
    if (!this.notifications.has(bookingId)) {
      this.notifications.set(bookingId, []);
    }
    return record;
  }

  saveBooking(bookingData) {
    return this.createBooking(bookingData);
  }

  getBooking(bookingId) {
    return this.bookings.get(bookingId) || null;
  }

  getAllActiveBookings() {
    return Array.from(this.bookings.values());
  }

  saveItinerary(bookingId, itinerary) {
    this.itineraries.set(bookingId, itinerary);
    return itinerary;
  }

  getItinerary(bookingId) {
    return this.itineraries.get(bookingId) || null;
  }

  addMessage(bookingId, messageObj) {
    if (!this.conversations.has(bookingId)) {
      this.conversations.set(bookingId, []);
    }
    const entry = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...messageObj
    };
    this.conversations.get(bookingId).push(entry);
    return entry;
  }

  getConversation(bookingId) {
    return this.conversations.get(bookingId) || [];
  }

  addNotification(bookingId, notificationObj) {
    if (!this.notifications.has(bookingId)) {
      this.notifications.set(bookingId, []);
    }
    const entry = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...notificationObj
    };
    this.notifications.get(bookingId).push(entry);
    return entry;
  }

  getNotifications(bookingId) {
    return this.notifications.get(bookingId) || [];
  }

  setWeather(weatherData) {
    this.currentWeather = {
      ...this.currentWeather,
      ...weatherData,
      last_updated: new Date().toISOString()
    };
    return this.currentWeather;
  }

  getWeather() {
    return this.currentWeather;
  }
}

module.exports = new Store();
