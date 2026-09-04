const searchBox = document.querySelector('.search input');
const searchBtn = document.querySelector('.search button');
const searchForm = document.querySelector('.search');
const weatherIcon = document.querySelector('.weather-icon');
const weather = document.querySelector('.weather');
const error = document.querySelector('.error');

const weatherCodes = {
  0: ['Clear sky', 'clear.png'],
  1: ['Mainly clear', 'clear.png'], 2: ['Partly cloudy', 'clouds.png'], 3: ['Overcast', 'clouds.png'],
  45: ['Fog', 'mist.png'], 48: ['Rime fog', 'mist.png'],
  51: ['Light drizzle', 'drizzle.png'], 53: ['Drizzle', 'drizzle.png'], 55: ['Heavy drizzle', 'drizzle.png'],
  61: ['Light rain', 'rain.png'], 63: ['Rain', 'rain.png'], 65: ['Heavy rain', 'rain.png'],
  71: ['Light snow', 'snow.png'], 73: ['Snow', 'snow.png'], 75: ['Heavy snow', 'snow.png'],
  80: ['Rain showers', 'rain.png'], 81: ['Rain showers', 'rain.png'], 82: ['Heavy showers', 'rain.png'],
  95: ['Thunderstorm', 'rain.png'], 96: ['Thunderstorm with hail', 'rain.png'], 99: ['Thunderstorm with hail', 'rain.png']
};

function showError(message = 'City not found') {
  error.textContent = message;
  error.style.display = 'block';
  weather.style.display = 'none';
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkWeather(city) {
  const name = city.trim();
  if (!name) return showError('Please enter a city name');

  searchBtn.disabled = true;
  searchBtn.setAttribute('aria-busy', 'true');

  try {
    const geoResponse = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
    if (!geoResponse.ok) throw new Error('Geocoding request failed');
    const geo = await geoResponse.json();
    const location = geo.results?.[0];
    if (!location) return showError('City not found');

    const weatherResponse = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`);
    if (!weatherResponse.ok) throw new Error('Weather request failed');
    const data = await weatherResponse.json();
    const current = data.current;
    const [description, icon] = weatherCodes[current.weather_code] || ['Current conditions', 'clouds.png'];

    document.querySelector('.city').textContent = location.country ? `${location.name}, ${location.country}` : location.name;
    document.querySelector('.temp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.querySelector('.humidity').textContent = `${current.relative_humidity_2m}%`;
    document.querySelector('.wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.querySelector('.condition').textContent = description;
    weatherIcon.src = icon;
    weatherIcon.alt = description;
    weather.style.display = 'block';
    error.style.display = 'none';
  } catch (err) {
    console.error(err);
    showError(err.name === 'AbortError' ? 'Weather request timed out. Please try again.' : 'Unable to load weather. Please try again.');
  } finally {
    searchBtn.disabled = false;
    searchBtn.removeAttribute('aria-busy');
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  checkWeather(searchBox.value);
});

checkWeather('Meerut');
