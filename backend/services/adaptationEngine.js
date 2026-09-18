const adaptationService = require('./adaptationService');

class AdaptationEngine {
  async evaluateAndAdapt(bookingId, targetDayNumber = 2, forcedCondition = null) {
    return adaptationService.evaluateAndAdapt(bookingId, targetDayNumber, forcedCondition);
  }
}

module.exports = new AdaptationEngine();
