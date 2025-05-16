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
    searchInput.addEventListener('input', handleSearch); // Add input event for real-time search
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
        
        // Start the hero section slideshow
        startHeroSlideshow(topRated);
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// New function to start the hero slideshow
async function startHeroSlideshow(movies) {
    const heroSection = document.querySelector('.hero-content');
    let currentIndex = 0;

    async function fetchMovieImages(movieId) {
        try {
            const url = `${API_CONFIG.baseURL}/movie/${movieId}/images`;
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
            return data.backdrops[0]?.file_path || null; // Get first backdrop image
        } catch (error) {
            console.error('Error fetching movie images:', error);
            return null;
        }
    }

    async function updateHero() {
        if (movies.length === 0) return;

        const movie = movies[currentIndex];
        const backdropPath = await fetchMovieImages(movie.id);
        
        heroSection.innerHTML = `
            <div class="hero-content" style="background-image: url('${backdropPath ? `${API_CONFIG.imageBaseURL}${backdropPath}` : movie.posterPath}');">
                <div class="hero-content-overlay">
                    <h1 class="hero-title">${movie.title}</h1>
                    <p class="hero-description">${movie.overview}</p>
                    <div class="hero-buttons">
                        <button class="btn btn-play"><i class="fas fa-play"></i> Play</button>
                        <button class="btn btn-more"><i class="fas fa-info-circle"></i> More Info</button>
                    </div>
                </div>
            </div>
        `;

        currentIndex = (currentIndex + 1) % Math.min(movies.length, 4); // Loop through top 4 movies
    }

    updateHero(); // Initial call
    setInterval(updateHero, 5000); // Change every 5 seconds
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
// Debounce function to prevent excessive API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search state management
let currentSearchTerm = '';
let searchTimeout;

async function handleSearch(e) {
    const searchTerm = searchInput.value.trim();

    // Clear search results if search is empty
    if (searchTerm.length === 0) {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.remove();
            initializeApp(); // Reset to home view
        }
        return;
    }

    // Only search if Enter is pressed or if there are 3 or more characters
    if (e.key === 'Enter' || (searchTerm.length >= 3 && e.type === 'input')) {
        try {
            // Clear main content and show loading
            const mainContent = document.querySelector('.main-content');
            mainContent.innerHTML = `
                <section class="movie-section search-results">
                    <div class="container">
                        <div class="search-header">
                            <h2 class="section-title">Searching for: ${searchTerm}</h2>
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </section>
            `;

            // Fetch both movies and TV shows
            const [movieResults, tvResults] = await Promise.all([
                fetch(`${API_CONFIG.baseURL}/search/movie?query=${encodeURIComponent(searchTerm)}&include_adult=false`, {
                    headers: {
                        'Authorization': `Bearer ${API_CONFIG.authToken}`,
                        'accept': 'application/json'
                    }
                }).then(res => res.json()),
                fetch(`${API_CONFIG.baseURL}/search/tv?query=${encodeURIComponent(searchTerm)}&include_adult=false`, {
                    headers: {
                        'Authorization': `Bearer ${API_CONFIG.authToken}`,
                        'accept': 'application/json'
                    }
                }).then(res => res.json())
            ]);

            // Combine and process results
            const combinedResults = [
                ...movieResults.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    posterPath: movie.poster_path ? `${API_CONFIG.imageBaseURL}${movie.poster_path}` : API_CONFIG.noImageURL,
                    rating: movie.vote_average,
                    releaseDate: movie.release_date,
                    overview: movie.overview,
                    type: 'movie',
                    genre: movie.genre_ids ? getGenreName(movie.genre_ids[0]) : 'Unknown'
                })),
                ...tvResults.results.map(tv => ({
                    id: tv.id,
                    title: tv.name,
                    posterPath: tv.poster_path ? `${API_CONFIG.imageBaseURL}${tv.poster_path}` : API_CONFIG.noImageURL,
                    rating: tv.vote_average,
                    releaseDate: tv.first_air_date,
                    overview: tv.overview,
                    type: 'tv',
                    genre: tv.genre_ids ? getGenreName(tv.genre_ids[0]) : 'Unknown'
                }))
            ];

            // Sort by popularity (assuming higher vote_average means more popular)
            combinedResults.sort((a, b) => b.rating - a.rating);

            // Update the UI with results
            mainContent.innerHTML = `
                <section class="movie-section search-results">
                    <div class="container">
                        <div class="search-header">
                            <h2 class="section-title">Search Results: ${searchTerm}</h2>
                            <button class="clear-search">Clear Search</button>
                        </div>
                        <div class="movie-row" id="search-results">
                            ${combinedResults.length === 0 ? 
                                '<div class="no-results">No results found. Try a different search term.</div>' : 
                                ''}
                        </div>
                    </div>
                </section>
            `;

            // Render results if any found
            if (combinedResults.length > 0) {
                const searchResultsContainer = document.getElementById('search-results');
                renderMovies(searchResultsContainer, combinedResults);
            }

            // Add clear search button functionality
            const clearButton = document.querySelector('.clear-search');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    searchInput.value = '';
                    initializeApp(); // Reset to home view
                });
            }

        } catch (error) {
            console.error('Error searching:', error);
            const mainContent = document.querySelector('.main-content');
            mainContent.innerHTML = `
                <section class="movie-section search-results">
                    <div class="container">
                        <div class="search-header">
                            <h2 class="section-title">Error</h2>
                        </div>
                        <div class="error-message">
                            An error occurred while searching. Please try again.
                        </div>
                    </div>
                </section>
            `;
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

