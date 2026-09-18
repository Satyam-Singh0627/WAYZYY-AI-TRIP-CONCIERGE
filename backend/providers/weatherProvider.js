/**
 * ============================================================
 * PROVIDER: weatherProvider.js
 * Open-Meteo live weather provider with WMO code translation,
 * caching, and coordinate-based hourly & daily forecasts.
 * Documentation: https://open-meteo.com/en/docs
 * ============================================================
 */

const axios = require('axios');

class WeatherProvider {
  constructor() {
    this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
  }

  translateWmoCode(code) {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return { condition: 'Clear', description: 'Clear sunny sky', icon: '☀️', is_raining: false };
    if (code === 1 || code === 2) return { condition: 'Partly Cloudy', description: 'Mainly clear with scattered clouds', icon: '⛅', is_raining: false };
    if (code === 3) return { condition: 'Overcast', description: 'Overcast cloud cover', icon: '☁️', is_raining: false };
    if ([45, 48].includes(code)) return { condition: 'Fog', description: 'Early morning sea fog', icon: '🌫', is_raining: false };
    if ([51, 53, 55].includes(code)) return { condition: 'Drizzle', description: 'Light coastal drizzle', icon: '🌦', is_raining: true };
    if ([61, 63, 65].includes(code)) return { condition: 'Rain', description: 'Tropical monsoon showers', icon: '🌧', is_raining: true };
    if ([80, 81, 82].includes(code)) return { condition: 'Showers', description: 'Heavy passing rain showers', icon: '🌧', is_raining: true };
    if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', description: 'Thunderstorm with heavy localized rain', icon: '⛈', is_raining: true };
    return { condition: 'Clear', description: 'Pleasant coastal weather', icon: '☀️', is_raining: false };
  }

  async fetchForecast(lat = 15.5178, lon = 73.7634) {
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      console.log(`[WeatherProvider] Fetching Open-Meteo live weather for lat=${lat}, lon=${lon}...`);
      const response = await axios.get(this.baseUrl, {
        params: {
          latitude: lat,
          longitude: lon,
          current_weather: true,
          hourly: 'temperature_2m,precipitation_probability,precipitation,weathercode,windspeed_10m,relativehumidity_2m,visibility',
          daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
          timezone: 'auto'
        },
        timeout: 6000
      });

      const d = response.data;
      const cur = d.current_weather || {};
      const wmo = this.translateWmoCode(cur.weathercode || 0);

      // Hourly slice: next 8 points (every 3 hours)
      const hourly = [];
      if (d.hourly && Array.isArray(d.hourly.time)) {
        for (let i = 0; i < Math.min(24, d.hourly.time.length); i += 3) {
          const tIso = d.hourly.time[i];
          const timeStr = tIso ? tIso.split('T')[1].slice(0, 5) : `${i}:00`;
          const code = d.hourly.weathercode?.[i] || 0;
          const translated = this.translateWmoCode(code);

          hourly.push({
            time: timeStr,
            temp: Math.round(d.hourly.temperature_2m?.[i] || cur.temperature || 29),
            condition: translated.condition,
            rain_probability: d.hourly.precipitation_probability?.[i] || (translated.is_raining ? 85 : 10),
            icon: translated.icon
          });
        }
      }

      // Daily slice: 5 days
      const daily = [];
      if (d.daily && Array.isArray(d.daily.time)) {
        const dayNames = ['Day 1 (Today)', 'Day 2 (Tomorrow)', 'Day 3', 'Day 4', 'Day 5'];
        for (let i = 0; i < Math.min(5, d.daily.time.length); i++) {
          const code = d.daily.weathercode?.[i] || 0;
          const translated = this.translateWmoCode(code);
          const maxT = Math.round(d.daily.temperature_2m_max?.[i] || 31);
          const minT = Math.round(d.daily.temperature_2m_min?.[i] || 24);
          const rainProb = d.daily.precipitation_probability_max?.[i] || (translated.is_raining ? 85 : 10);

          daily.push({
            day: dayNames[i] || `Day ${i + 1}`,
            date: d.daily.time[i],
            temp_max: maxT,
            temp_min: minT,
            condition: translated.description,
            rain_probability: rainProb,
            icon: translated.icon,
            suitability: rainProb > 60 ? 'High rain probability — sheltered venues advised' : 'Great for outdoor beach activities'
          });
        }
      }

      const result = {
        is_live: true,
        provider: 'Open-Meteo (Live)',
        condition: wmo.condition,
        description: wmo.description,
        temp: Math.round(cur.temperature || 29),
        wind_speed_kmh: Math.round(cur.windspeed || 14),
        humidity: Math.round(d.hourly?.relativehumidity_2m?.[0] || 68),
        rain_probability: d.hourly?.precipitation_probability?.[0] || (wmo.is_raining ? 85 : 10),
        precipitation: cur.precipitation || 0,
        is_raining: wmo.is_raining,
        hourly,
        daily,
        last_updated: new Date().toISOString()
      };

      this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err) {
      console.warn(`[WeatherProvider] Open-Meteo call failed (${err.message}). Using fallback.`);
      return null;
    }
  }
}

module.exports = new WeatherProvider();
