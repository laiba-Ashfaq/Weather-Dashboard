// Selecting DOM elements
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const weatherCardsDiv = document.querySelector(".weather-cards");
const currentWeatherDiv = document.querySelector(".current-weather");
const loadingDiv = document.querySelector(".loading");

// API key for OpenWeatherMap
const API_KEY = "2e9bdded2bb7f0b73279f7c5e6880348";

// Function to create weather cards based on data
const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) { // Main weather card for current day
        return `
            <div class="details">
                <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                <h4>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}ºC</h4>
                <h4>Wind Speed: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </div>
            <div class="icon">
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="weather-icon">
                <h4>${weatherItem.weather[0].description}</h4>
            </div>`;
    } else { // Forecast cards for next 5 days
        return `
            <li class="cards">
                <h2>${weatherItem.dt_txt.split(" ")[0]}</h2>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="weather-icon">
                <h4>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}ºC</h4>
                <h4>Wind Speed: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </li>`;
    }
}

// Function to display loading indicator
const showLoading = () => {
    loadingDiv.style.display = "block";
};

// Function to hide loading indicator
const hideLoading = () => {
    loadingDiv.style.display = "none";
};

// Function to fetch weather details based on city name and coordinates
const getWeatherDetails = (cityName, lon, lat) => {
    const Weather_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    showLoading();

    fetch(Weather_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            hideLoading();

            const currentDate = new Date().toISOString().split("T")[0];

            const latestForecastForEachDay = [];
            const forecastMap = new Map();

            // Filtering forecast data for each day
            data.list.forEach(forecast => {
                const forecastDate = forecast.dt_txt.split(" ")[0];
                if (forecastDate >= currentDate) {
                    forecastMap.set(forecastDate, forecast);
                }
            });

            forecastMap.forEach(value => latestForecastForEachDay.push(value));

            // Clear previous data and update with latest forecast
            cityInput.value = "";
            weatherCardsDiv.innerHTML = "";
            currentWeatherDiv.innerHTML = "";

            latestForecastForEachDay.forEach((weatherItem, index) => {
                if (index === 0) {
                    currentWeatherDiv.innerHTML = createWeatherCard(cityName, weatherItem, index);
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });
        })
        .catch(error => {
            hideLoading();
            console.error('Error fetching weather data:', error);
            alert("An error occurred while fetching the Weather forecast coordinates!");
        });
}

// Function to fetch city coordinates based on user input
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    showLoading();

    fetch(GEOCODING_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (!data.length) {
                throw new Error(`No coordinate found for ${cityName}!`);
            }
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lon, lat);
        })
        .catch(error => {
            hideLoading();
            console.error('Error fetching city coordinates:', error);
            alert("An error occurred while fetching the coordinates!");
        });
}

// Function to fetch user coordinates and fetch weather details
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            
            showLoading();

            fetch(REVERSE_GEOCODING_URL)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, longitude, latitude);
                })
                .catch(error => {
                    hideLoading();
                    console.error('Error fetching city coordinates:', error);
                    alert("An error occurred while fetching the city!");
                });
        },
        error => {
            hideLoading();
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location Permission to grant access again");
            }
        }
    );
}

// Event listeners for search and location buttons, and Enter key on input
searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getUserCoordinates);
cityInput.addEventListener("keyup", e => {
    if (e.key === "Enter") {
        getCityCoordinates();
    }
});
