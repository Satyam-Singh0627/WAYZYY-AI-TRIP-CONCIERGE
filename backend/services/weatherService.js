/**
 * ============================================================
 * SERVICE: weatherService.js
 * Weather service with Open-Meteo live provider, demo simulator,
 * hourly & daily forecast projections, and activity conflict detection.
 * ============================================================
 */

const store = require('../store');
const weatherProvider = require('../providers/weatherProvider');

class WeatherService {
  constructor() {
    this.providerType = process.env.WEATHER_PROVIDER || 'open_meteo';
  }

  isLive() {
    return !store.getWeather()?.is_simulated;
  }

  getMode() {
    const w = store.getWeather();
    return (w && w.is_simulated) ? 'DEMO' : 'LIVE';
  }

  /**
   * Get Current Weather (calls Open-Meteo if not in simulated demo mode)
   */
  async getCurrentWeather(lat = 15.5178, lon = 73.7634, cityName = 'Candolim, Goa') {
    const currentStored = store.getWeather();

    // If a simulation scenario is actively forced, honor it
    if (currentStored && currentStored.is_simulated) {
      return {
        ...currentStored,
        mode: 'DEMO'
      };
    }

    // Otherwise fetch live from Open-Meteo
    const liveData = await weatherProvider.fetchForecast(lat, lon);
    if (liveData) {
      const formatted = {
        condition: liveData.condition,
        description: liveData.description,
        temp: liveData.temp,
        feels_like: liveData.temp + 2,
        humidity: liveData.humidity,
        wind_speed_kmh: liveData.wind_speed_kmh,
        rain_probability: liveData.rain_probability,
        area: cityName,
        is_simulated: false,
        is_raining: liveData.is_raining,
        mode: 'LIVE',
        last_updated: liveData.last_updated
      };
      store.setWeather(formatted);
      return formatted;
    }

    // Fallback to demo weather
    return {
      ...currentStored,
      mode: 'DEMO'
    };
  }

  /**
   * 24-hour Hourly Forecast
   */
  async getHourlyForecast(cityName = 'Candolim, Goa', lat = 15.5178, lon = 73.7634) {
    const currentStored = store.getWeather();

    if (currentStored && currentStored.is_simulated) {
      return this.generateDeterministicHourly(currentStored.is_raining);
    }

    const liveData = await weatherProvider.fetchForecast(lat, lon);
    if (liveData && liveData.hourly && liveData.hourly.length > 0) {
      return liveData.hourly;
    }

    return this.generateDeterministicHourly(currentStored?.is_raining);
  }

  generateDeterministicHourly(isRaining) {
    const hours = [];
    const currentHour = new Date().getHours();

    for (let i = 0; i < 8; i++) {
      const h = (currentHour + i * 3) % 24;
      const timeStr = `${h.toString().padStart(2, '0')}:00`;

      if (isRaining) {
        if (h >= 11 && h <= 18) {
          hours.push({ time: timeStr, temp: 24, condition: 'Heavy Showers', rain_probability: 95, icon: '🌧' });
        } else {
          hours.push({ time: timeStr, temp: 26, condition: 'Passing Drizzle', rain_probability: 65, icon: '🌦' });
        }
      } else {
        if (h >= 12 && h <= 15) {
          hours.push({ time: timeStr, temp: 31, condition: 'Clear & Warm', rain_probability: 5, icon: '☀️' });
        } else if (h >= 18 || h < 6) {
          hours.push({ time: timeStr, temp: 26, condition: 'Pleasant Breeze', rain_probability: 5, icon: '🌙' });
        } else {
          hours.push({ time: timeStr, temp: 29, condition: 'Sunny', rain_probability: 5, icon: '☀️' });
        }
      }
    }
    return hours;
  }

  /**
   * 5-Day Daily Forecast
   */
  async getDailyForecast(cityName = 'Candolim, Goa', lat = 15.5178, lon = 73.7634) {
    const currentStored = store.getWeather();

    if (currentStored && currentStored.is_simulated) {
      return this.generateDeterministicDaily(currentStored.is_raining);
    }

    const liveData = await weatherProvider.fetchForecast(lat, lon);
    if (liveData && liveData.daily && liveData.daily.length > 0) {
      return liveData.daily;
    }

    return this.generateDeterministicDaily(currentStored?.is_raining);
  }

  generateDeterministicDaily(isRaining) {
    return [
      {
        day: 'Day 1 (Today)',
        date: '15 Oct',
        temp_max: 31,
        temp_min: 25,
        condition: 'Clear & Coastal Sun',
        rain_probability: 10,
        icon: '☀️',
        suitability: 'Ideal for shoreline walks & beach shacks'
      },
      {
        day: 'Day 2 (Tomorrow)',
        date: '16 Oct',
        temp_max: isRaining ? 24 : 30,
        temp_min: 23,
        condition: isRaining ? 'Monsoon Showers & Sea Winds' : 'Partly Cloudy & Warm',
        rain_probability: isRaining ? 95 : 15,
        icon: isRaining ? '🌧' : '⛅',
        suitability: isRaining ? 'High rain risk — indoor cultural activities advised' : 'Great for outdoor activities'
      },
      {
        day: 'Day 3',
        date: '17 Oct',
        temp_max: 29,
        temp_min: 24,
        condition: 'Passing Morning Drizzle',
        rain_probability: 30,
        icon: '🌦',
        suitability: 'Good for covered Latin Quarter walks & cafes'
      },
      {
        day: 'Day 4',
        date: '18 Oct',
        temp_max: 30,
        temp_min: 24,
        condition: 'Sunny & Pleasant',
        rain_probability: 10,
        icon: '☀️',
        suitability: 'Ideal for riverside dining & fort ramparts'
      },
      {
        day: 'Day 5',
        date: '19 Oct',
        temp_max: 31,
        temp_min: 25,
        condition: 'Clear Departure Skies',
        rain_probability: 5,
        icon: '☀️',
        suitability: 'Clear weather for airport travel & souvenirs'
      }
    ];
  }

  /**
   * Detect Activity Conflicts with Weather
   */
  detectWeatherRisk(itinerary, weatherData = null) {
    const current = weatherData || store.getWeather();
    const conflicts = [];

    if (!itinerary || !itinerary.days) {
      return conflicts;
    }

    const isHighRainRisk = current.is_raining || current.rain_probability >= 60;

    if (isHighRainRisk) {
      itinerary.days.forEach(day => {
        if (day.day_number === 2 || isHighRainRisk) {
          day.items.forEach(item => {
            if ((item.indoor_outdoor === 'outdoor' || item.weather_fit === 'dry_only') && !item.is_adapted) {
              conflicts.push({
                day_number: day.day_number,
                date: day.date,
                time: item.time,
                activity: item.place_name || item.activity,
                conflict_reason: `High rain risk (${current.rain_probability}%) makes outdoor coastal activity unsuitable.`,
                suggested_action: 'Move outdoor activity or replace with sheltered Goan museum / heritage experience.',
                is_outdoor: true
              });
            }
          });
        }
      });
    }

    return conflicts;
  }

  /**
   * Simulate a specific scenario (rain, clear, storm)
   */
  simulateCondition(scenario = 'rain') {
    let simulated;
    if (scenario === 'rain' || scenario === 'heavy_rain') {
      simulated = {
        condition: 'Rain',
        description: 'Heavy tropical monsoon showers and gusty sea winds',
        temp: 24,
        feels_like: 26,
        humidity: 88,
        wind_speed_kmh: 28,
        rain_probability: 95,
        area: 'Candolim, Goa',
        is_simulated: true,
        is_raining: true,
        mode: 'DEMO',
        affected_activities: ['beach', 'water sports', 'outdoor ramparts'],
        last_updated: new Date().toISOString()
      };
    } else if (scenario === 'storm') {
      simulated = {
        condition: 'Thunderstorm',
        description: 'Thunderstorm with heavy localized rain & coastal squalls',
        temp: 23,
        feels_like: 25,
        humidity: 92,
        wind_speed_kmh: 38,
        rain_probability: 98,
        area: 'Candolim, Goa',
        is_simulated: true,
        is_raining: true,
        mode: 'DEMO',
        affected_activities: ['beach', 'water sports', 'clifftop dining'],
        last_updated: new Date().toISOString()
      };
    } else {
      simulated = {
        condition: 'Clear',
        description: 'Sunny skies with gentle sea breeze',
        temp: 30,
        feels_like: 32,
        humidity: 65,
        wind_speed_kmh: 12,
        rain_probability: 5,
        area: 'Candolim, Goa',
        is_simulated: true,
        is_raining: false,
        mode: 'DEMO',
        affected_activities: [],
        last_updated: new Date().toISOString()
      };
    }

    store.setWeather(simulated);
    return simulated;
  }
}

module.exports = new WeatherService();
