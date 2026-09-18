const conciergeService = require('./conciergeService');
const itineraryService = require('./itineraryService');

class ClaudeAdapter {
  isLive() {
    return conciergeService.isLive();
  }

  getMode() {
    return conciergeService.getMode();
  }

  async generateItinerary(bookingContext) {
    return itineraryService.generateItinerary(bookingContext);
  }

  async generateChatResponse(userMessage, bookingContext, conversationHistory = [], currentItinerary = null) {
    return conciergeService.generateResponse(userMessage, bookingContext, conversationHistory, currentItinerary);
  }
}

module.exports = new ClaudeAdapter();
