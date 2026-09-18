const weatherService = require('./weatherService');
const store = require('../store');

class WeatherAdapter {
  isLive() {
    return weatherService.isLive();
  }

  getMode() {
    return weatherService.getMode();
  }

  async getWeather(lat = 15.5178, lon = 73.7634, cityName = 'Candolim, Goa') {
    return weatherService.getCurrentWeather(lat, lon, cityName);
  }

  simulateCondition(scenario = 'rain') {
    return weatherService.simulateCondition(scenario);
  }
}

module.exports = new WeatherAdapter();
