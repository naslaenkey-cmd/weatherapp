// ========================================
// API KEY
// ========================================

// Replace this with your OpenWeatherMap API key

const API_KEY = "71e3b6c5cb83a4bec0b51082e9650c5c";


// ========================================
// DOM ELEMENTS
// ========================================

const cityInput = document.getElementById("cityInput");

const searchBtn = document.getElementById("searchBtn");

const weatherCard = document.getElementById("weatherCard");

const forecastSection =
    document.getElementById("forecastSection");

const forecastContainer =
    document.getElementById("forecastContainer");

const loading =
    document.getElementById("loading");

const errorMsg =
    document.getElementById("errorMsg");

const favoritesList =
    document.getElementById("favoritesList");

const themeBtn =
    document.getElementById("themeBtn");

const suggestions =
    document.getElementById("suggestions");


// ========================================
// GET CURRENT WEATHER
// ========================================

async function getWeather(city) {

    const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;


    const response = await fetch(url);


    // Check HTTP error

    if (!response.ok) {

        if (response.status === 404) {

            throw new Error("City not found.");

        }


        if (response.status === 401) {

            throw new Error("Invalid API key.");

        }


        throw new Error(
            "Something went wrong while fetching weather."
        );

    }


    const data = await response.json();


    // Return only the information we need

    return {

        city: data.name,

        temp: Math.round(data.main.temp),

        feelsLike:
            Math.round(data.main.feels_like),

        description:
            data.weather[0].description,

        humidity:
            data.main.humidity,

        windSpeed:
            data.wind.speed,

        icon:
            data.weather[0].icon

    };

}


// ========================================
// GET 5-DAY FORECAST
// ========================================

async function getForecast(city) {

    const url =
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;


    const response = await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Unable to load forecast."
        );

    }


    const data = await response.json();


    const dailyForecasts = [];


    /*
        OpenWeatherMap returns forecast
        data every 3 hours.

        8 × 3 hours = 24 hours.

        So we take approximately
        one forecast per day.
    */

    for (
        let i = 0;
        i < data.list.length;
        i += 8
    ) {

        if (dailyForecasts.length === 5) {

            break;

        }


        const item = data.list[i];


        dailyForecasts.push({

            date: item.dt_txt,

            temp:
                Math.round(item.main.temp),

            description:
                item.weather[0].description,

            icon:
                item.weather[0].icon

        });

    }


    return dailyForecasts;

}


// ========================================
// SEARCH WEATHER
// ========================================

async function searchWeather(city) {

    city = city.trim();


    // Check empty input

    if (!city) {

        showError(
            "Please enter a city name."
        );

        return;

    }


    // Show loading

    showLoading();

    hideError();

    hideSuggestions();


    try {

        /*
            Both API requests are executed
            together.

            Promise.all waits for both.
        */

        const [weather, forecast] =
            await Promise.all([

                getWeather(city),

                getForecast(city)

            ]);


        // Display current weather

        displayWeather(weather);


        // Display forecast

        displayForecast(forecast);


        // Update input

        cityInput.value = weather.city;


    } catch (error) {

        // Handle error

        showError(error.message);


        weatherCard.style.display = "none";

        forecastSection.style.display = "none";


    } finally {

        // Always hide loading

        hideLoading();

    }

}


// ========================================
// DISPLAY CURRENT WEATHER
// ========================================

function displayWeather(weather) {

    weatherCard.style.display = "block";


    weatherCard.innerHTML = `

        <div class="weather-top">

            <div>

                <h2 class="weather-city">
                    ${weather.city}
                </h2>

                <p class="description">
                    ${weather.description}
                </p>

            </div>


            <div>

                <img
                    class="weather-icon"
                    src="https://openweathermap.org/img/wn/${weather.icon}@2x.png"
                    alt="${weather.description}"
                >

                <div class="temperature">
                    ${weather.temp}°C
                </div>

            </div>

        </div>


        <div class="weather-details">

            <div class="detail">

                <span>🌡️ Feels Like</span>

                <strong>
                    ${weather.feelsLike}°C
                </strong>

            </div>


            <div class="detail">

                <span>💧 Humidity</span>

                <strong>
                    ${weather.humidity}%
                </strong>

            </div>


            <div class="detail">

                <span>💨 Wind Speed</span>

                <strong>
                    ${weather.windSpeed} m/s
                </strong>

            </div>

        </div>


        <button
            class="favorite-btn"
            onclick="addFavorite('${weather.city}')"
        >
            ⭐ Add to Favorites
        </button>

    `;

}


// ========================================
// DISPLAY 5-DAY FORECAST
// ========================================

function displayForecast(forecasts) {

    forecastSection.style.display = "block";


    forecastContainer.innerHTML = "";


    forecasts.forEach(forecast => {

        const date =
            new Date(forecast.date);


        const day =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );


        forecastContainer.innerHTML += `

            <div class="forecast-card">

                <h3>
                    ${day}
                </h3>


                <img
                    class="forecast-icon"
                    src="https://openweathermap.org/img/wn/${forecast.icon}@2x.png"
                    alt="${forecast.description}"
                >


                <p class="forecast-temp">
                    ${forecast.temp}°C
                </p>


                <p class="forecast-description">
                    ${forecast.description}
                </p>

            </div>

        `;

    });

}


// ========================================
// ADD FAVORITE
// ========================================

function addFavorite(city) {

    // Get existing favorites

    let favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];


    // Check duplicate

    const exists =
        favorites.some(
            favorite =>
                favorite.toLowerCase() ===
                city.toLowerCase()
        );


    if (exists) {

        alert(
            "This city is already in favorites."
        );

        return;

    }


    // Add city

    favorites.push(city);


    // Save to localStorage

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );


    // Refresh favorites

    loadFavorites();

}


// ========================================
// LOAD FAVORITES
// ========================================

function loadFavorites() {

    const favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];


    favoritesList.innerHTML = "";


    if (favorites.length === 0) {

        favoritesList.innerHTML =
            "<p>No favorite cities yet.</p>";

        return;

    }


    favorites.forEach(city => {

        const favoriteItem =
            document.createElement("div");


        favoriteItem.className =
            "favorite-item";


        favoriteItem.innerHTML = `

            <span
                class="favorite-city"
                onclick="searchWeather('${city}')"
            >
                📍 ${city}
            </span>


            <button
                class="remove-btn"
                onclick="removeFavorite('${city}')"
            >
                Remove
            </button>

        `;


        favoritesList.appendChild(
            favoriteItem
        );

    });

}


// ========================================
// REMOVE FAVORITE
// ========================================

function removeFavorite(city) {

    let favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];


    favorites =
        favorites.filter(
            favorite =>
                favorite.toLowerCase() !==
                city.toLowerCase()
        );


    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );


    loadFavorites();

}


// ========================================
// DEBOUNCING
// ========================================

let debounceTimer;


function debounceSearch() {

    clearTimeout(debounceTimer);


    debounceTimer =
        setTimeout(() => {

            const city =
                cityInput.value.trim();


            if (city.length >= 3) {

                searchWeather(city);

            }

        }, 500);

}


// ========================================
// LOADING FUNCTIONS
// ========================================

function showLoading() {

    loading.style.display = "block";

}


function hideLoading() {

    loading.style.display = "none";

}


// ========================================
// ERROR FUNCTIONS
// ========================================

function showError(message) {

    errorMsg.textContent = message;

    errorMsg.style.display = "block";

}


function hideError() {

    errorMsg.style.display = "none";

}


// ========================================
// SUGGESTIONS
// ========================================

const popularCities = [

    "Kochi",
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Hyderabad",
    "Kolkata",
    "Pune",
    "London",
    "Dubai",
    "New York",
    "Tokyo"

];


function showSuggestions(value) {

    const searchValue =
        value.toLowerCase().trim();


    if (!searchValue) {

        hideSuggestions();

        return;

    }


    const matches =
        popularCities.filter(city =>
            city.toLowerCase().includes(
                searchValue
            )
        );


    if (matches.length === 0) {

        hideSuggestions();

        return;

    }


    suggestions.innerHTML = "";


    matches.forEach(city => {

        const item =
            document.createElement("div");


        item.className =
            "suggestion-item";


        item.textContent = city;


        item.addEventListener(
            "click",
            () => {

                cityInput.value = city;

                hideSuggestions();

                searchWeather(city);

            }
        );


        suggestions.appendChild(item);

    });


    suggestions.style.display = "block";

}


function hideSuggestions() {

    suggestions.style.display = "none";

}


// ========================================
// THEME TOGGLE
// ========================================

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        const isDark =
            document.body.classList.contains(
                "dark"
            );


        if (isDark) {

            themeBtn.textContent =
                "☀️ Light";

        } else {

            themeBtn.textContent =
                "🌙 Dark";

        }


        // Save theme

        localStorage.setItem(
            "theme",
            isDark ? "dark" : "light"
        );

    }
);


// ========================================
// LOAD SAVED THEME
// ========================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem("theme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        themeBtn.textContent =
            "☀️ Light";

    }

}


// ========================================
// SEARCH BUTTON
// ========================================

searchBtn.addEventListener(
    "click",
    () => {

        searchWeather(
            cityInput.value
        );

    }
);


// ========================================
// ENTER KEY
// ========================================

cityInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            searchWeather(
                cityInput.value
            );

        }

    }
);


// ========================================
// INPUT + DEBOUNCE
// ========================================

cityInput.addEventListener(
    "input",
    event => {

        showSuggestions(
            event.target.value
        );


        debounceSearch();

    }
);


// ========================================
// PAGE LOAD
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadFavorites();

        loadTheme();

    }
);


// ========================================
// MAKE FUNCTIONS AVAILABLE
// ========================================

window.searchWeather = searchWeather;

window.addFavorite = addFavorite;

window.removeFavorite = removeFavorite;