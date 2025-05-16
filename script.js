const header = document.querySelector('.main-header');
const trendingRow = document.getElementById('trending');
const popularRow = document.getElementById('popular');
const topRatedRow = document.getElementById('top-rated');
const actionRow = document.getElementById('action');
const searchInput = document.querySelector('.search-bar input');
const navLinks = document.querySelectorAll('.main-nav a');

const API_CONFIG = {
    baseURL: 'https://api.themoviedb.org/3',
    apiKey: 'b275e5dfba4ecdad034102f12dcac7f',
    authToken: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiMjc1ZTVkZmJhNGVjZGFkMDM0MTAyZjEyZGNhYzdmNiIsIm5iZiI6MTc0NzM3MjI0My43MTYsInN1YiI6IjY4MjZjOGQzYTAzMWU4OGNjMTVhM2Q5MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9k7HmAij9jgH1a49phmU1Eh5AyRhRSAdg_R6lGArUBU',
    imageBaseURL: 'https://image.tmdb.org/t/p/w500',
    noImageURL: 'https://via.placeholder.com/500x750?text=No+Image+Available',
    endpoints: {
        trending: '/trending/all/week',
        popular: '/movie/popular',
        topRated: '/movie/top_rated',
        action: '/discover/movie?with_genres=28',
        search: '/search/movie',
        tvShows: '/discover/tv',
        movies: '/discover/movie',
        newAndPopular: '/movie/now_playing'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', handleHeaderScroll);
    searchInput.addEventListener('keyup', handleSearch);
    setupNavigation();
    initializeApp();
});


function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const section = link.textContent.toLowerCase();
            await handleNavigation(section);
        });
    });
}

async function handleNavigation(section) {
    try {
        let movies = [];
        switch (section) {
            case 'home':
                await initializeApp();
                return;
            case 'tv shows':
                movies = await fetchMovies(API_CONFIG.endpoints.tvShows);
                break;
            case 'movies':
                movies = await fetchMovies(API_CONFIG.endpoints.movies);
                break;
            case 'new & popular':
                movies = await fetchMovies(API_CONFIG.endpoints.newAndPopular);
                break;
            default:
                return;
        }
        
        // Update UI
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <section class="movie-section">
                <div class="container">
                    <h2 class="section-title">${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
                    <div class="movie-row" id="${section.replace(/\s+/g, '-')}">
                    </div>
                </div>
            </section>
        `;
        
        const container = document.getElementById(section.replace(/\s+/g, '-'));
        if (movies.length > 0) {
            renderMovies(container, movies);
        } else {
            container.innerHTML = '<div class="no-results">No content available</div>';
        }
    } catch (error) {
        console.error('Error handling navigation:', error);
    }
}

async function initializeApp() {
    try {
        const trending = await fetchMovies(API_CONFIG.endpoints.trending);
        const popular = await fetchMovies(API_CONFIG.endpoints.popular);
        const topRated = await fetchMovies(API_CONFIG.endpoints.topRated);
        const action = await fetchMovies(API_CONFIG.endpoints.action);
        
        // Reset main content to original structure
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <section class="movie-section">
                <div class="container">
                    <h2 class="section-title">Trending Now</h2>
                    <div class="movie-row" id="trending"></div>
                </div>
            </section>
            <section class="movie-section">
                <div class="container">
                    <h2 class="section-title">Popular on Netflix</h2>
                    <div class="movie-row" id="popular"></div>
                </div>
            </section>
            <section class="movie-section">
                <div class="container">
                    <h2 class="section-title">Top Rated</h2>
                    <div class="movie-row" id="top-rated"></div>
                </div>
            </section>
            <section class="movie-section">
                <div class="container">
                    <h2 class="section-title">Action Movies</h2>
                    <div class="movie-row" id="action"></div>
                </div>
            </section>
        `;
        
        // Get fresh references to containers
        const trendingRow = document.getElementById('trending');
        const popularRow = document.getElementById('popular');
        const topRatedRow = document.getElementById('top-rated');
        const actionRow = document.getElementById('action');
        
        if (trending.length > 0) renderMovies(trendingRow, trending);
        if (popular.length > 0) renderMovies(popularRow, popular);
        if (topRated.length > 0) renderMovies(topRatedRow, topRated);
        if (action.length > 0) renderMovies(actionRow, action);
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

/**
 * Handle header background change on scroll
 */
function handleHeaderScroll() {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

/**
 * Handle search functionality
 */
async function handleSearch(e) {
    if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length > 0) {
            console.log(`Searching for: ${searchTerm}`);
            try {
                const results = await fetchSearchResults(searchTerm);
                if (results.length > 0) {
                    renderMovies(trendingRow, results);
                    document.querySelector('#trending').previousElementSibling.textContent = `Search Results: ${searchTerm}`;
                } else {
                    trendingRow.innerHTML = `<div class="no-results">No results found for "${searchTerm}"</div>`;
                    document.querySelector('#trending').previousElementSibling.textContent = `Search Results: ${searchTerm}`;
                }
            } catch (error) {
                console.error('Error searching:', error);
            }
        }
    }
}

/**
 * Fetch movies from API
 * @param {string} endpoint - API endpoint to fetch from
 * @param {string} params - Additional query parameters
 * @returns {Promise<Array>} - Promise resolving to movie data
 */
async function fetchMovies(endpoint, params = '') {
    try {
        const url = `${API_CONFIG.baseURL}${endpoint}${params ? `&${params}` : ''}`;
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.authToken}`
            }
        };
        
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.results.map(item => ({
            id: item.id,
            title: item.title || item.name,
            posterPath: item.poster_path ? `${API_CONFIG.imageBaseURL}${item.poster_path}` : API_CONFIG.noImageURL,
            rating: item.vote_average,
            genre: item.genre_ids ? getGenreName(item.genre_ids[0]) : 'Unknown',
            releaseDate: item.release_date || item.first_air_date,
            overview: item.overview
        }));
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

/**
 * Fetch search results
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Promise resolving to search results
 */
async function fetchSearchResults(query) {
    try {
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.search}?query=${encodeURIComponent(query)}`;
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.authToken}`
            }
        };
        
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.results.map(item => ({
            id: item.id,
            title: item.title || item.name,
            posterPath: item.poster_path ? `${API_CONFIG.imageBaseURL}${item.poster_path}` : API_CONFIG.noImageURL,
            rating: item.vote_average,
            genre: item.genre_ids ? getGenreName(item.genre_ids[0]) : 'Unknown',
            releaseDate: item.release_date || item.first_air_date,
            overview: item.overview
        }));
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

/**
 * Render movie cards in a container
 * @param {HTMLElement} container - Container to render movies in
 * @param {Array} movies - Array of movie data
 */
function renderMovies(container, movies) {
    container.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        container.appendChild(movieCard);
    });
}

/**
 * Create a movie card element
 * @param {Object} movie - Movie data
 * @returns {HTMLElement} - Movie card element
 */
function createMovieCard(movie) {
    const { id, title, posterPath, rating, genre } = movie;
    
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = id;
    
    card.innerHTML = `
        <img src="${posterPath || API_CONFIG.noImageURL}" alt="${title}">
        <div class="movie-card-hover">
            <h3 class="movie-title">${title}</h3>
            <div class="movie-info">
                <div class="movie-rating">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
                <div class="movie-genre">${genre}</div>
            </div>
            <div class="movie-card-buttons">
                <button class="card-btn"><i class="fas fa-play"></i></button>
                <button class="card-btn"><i class="fas fa-plus"></i></button>
                <button class="card-btn"><i class="fas fa-thumbs-up"></i></button>
                <button class="card-btn"><i class="fas fa-thumbs-down"></i></button>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showMovieDetails(movie));
    
    return card;
}

/**
 * Show movie details when a movie card is clicked
 * @param {Object} movie - Movie data
 */
function showMovieDetails(movie) {
    console.log('Movie clicked:', movie);
    // This will be implemented to show a modal or navigate to a details page
    // For now, just logging the movie data
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Get genre name from genre ID
 * @param {number} genreId - The genre ID
 * @returns {string} - The genre name
 */
function getGenreName(genreId) {
    // Simplified genre mapping based on TMDB genre IDs
    const genres = {
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Science Fiction',
        10770: 'TV Movie',
        53: 'Thriller',
        10752: 'War',
        37: 'Western'
    };
    
    return genres[genreId] || 'Unknown';
}

