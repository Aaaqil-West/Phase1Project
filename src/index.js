const API_URL = "http://localhost:3001/games";
const FAVORITES_API = "http://localhost:3001/favorites";

const gameListEl = document.getElementById("gameList");
const gameDetailsEl = document.getElementById("gameDetails");
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const platformFilter = document.getElementById("platformFilter");
const sortFilter = document.getElementById("sortFilter");
let favoritesListEl = document.getElementById("favoritesList");
let recentListEl = document.getElementById("recentList");
const loadingSpinner = document.getElementById("loadingSpinner");
const themeToggle = document.getElementById("themeToggle");
const clearSearch = document.getElementById("clearSearch");
const resetFilters = document.getElementById("resetFilters");
const gridView = document.getElementById("gridView");
const listView = document.getElementById("listView");
const ratingModal = document.getElementById("ratingModal");

let games = [];
let filteredGames = [];
let currentPage = 1;
let currentRatingGame = null;
const pageSize = 12;
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
let gameRatings = JSON.parse(localStorage.getItem('gameRatings') || '{}');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  loadGames();
  setupEventListeners();
});

// Theme management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
}

// Event listeners
function setupEventListeners() {
  themeToggle.addEventListener('click', toggleTheme);
  
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  clearSearch.addEventListener('click', clearSearchInput);
  
  genreFilter.addEventListener('change', applyFilters);
  platformFilter.addEventListener('change', applyFilters);
  sortFilter.addEventListener('change', applyFilters);
  resetFilters.addEventListener('click', resetAllFilters);
  
  gridView.addEventListener('click', () => setViewMode('grid'));
  listView.addEventListener('click', () => setViewMode('list'));
  
  // Tab navigation
  document.getElementById('allGamesTab').addEventListener('click', () => showSection('games'));
  document.getElementById('favoritesTab').addEventListener('click', () => showSection('favorites'));
  document.getElementById('recentTab').addEventListener('click', () => showSection('recent'));
  
  // Rating modal events
  document.querySelector('.close').addEventListener('click', closeRatingModal);
  document.getElementById('submitRating').addEventListener('click', submitRating);
  
  // Star rating events
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', selectRating);
    star.addEventListener('mouseover', hoverRating);
  });
  
  document.querySelector('.star-rating').addEventListener('mouseleave', resetStarHover);
}

// Debounce function for search
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

// Load games with loading spinner
async function loadGames() {
  try {
    showLoadingSpinner();
    
    // Add timeout for better UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    games = data;
    filteredGames = [...games];
    
    populateFilters(data);
    displayGames(getCurrentPageData());
    renderPagination();
    loadFavorites();
    displayRecentlyViewed();
    
    hideLoadingSpinner();
    showNotification('Games loaded successfully!', 'success');
  } catch (error) {
    console.error('Error loading games:', error);
    hideLoadingSpinner();
    // Auto-load demo data instead of showing error
    loadDemoData();
  }
}

// Show error state with retry option
function showErrorState(error) {
  const gameListEl = document.getElementById('gameList');
  let errorMessage = 'Failed to load games. ';
  
  if (error.name === 'AbortError') {
    errorMessage += 'Request timed out.';
  } else if (error.message.includes('Failed to fetch')) {
    errorMessage += 'Please make sure the JSON server is running on port 3001.';
  } else {
    errorMessage += error.message;
  }
  
  gameListEl.innerHTML = `
    <div class="error-state">
      <h3>⚠️ ${errorMessage}</h3>
      <p>To start the server, run: <code>npx json-server --watch db.json --port 3001</code></p>
      <div class="error-actions">
        <button id="retryBtn" class="retry-btn">🔄 Retry</button>
        <button id="demoBtn" class="demo-btn">🎮 Load Demo Data</button>
      </div>
    </div>
  `;
  
  document.getElementById('retryBtn').addEventListener('click', loadGames);
  document.getElementById('demoBtn').addEventListener('click', loadDemoData);
  showNotification(errorMessage, 'error');
}

// Load demo data when server is not available
function loadDemoData() {
  const demoGames = [
    {
      id: 1,
      title: "Fortnite",
      thumbnail: "https://www.freetogame.com/g/57/thumbnail.jpg",
      short_description: "A free-to-play battle royale game with building mechanics.",
      game_url: "https://www.freetogame.com/open/fortnite-battle-royale",
      genre: "Battle Royale",
      platform: "PC (Windows)",
      publisher: "Epic Games",
      developer: "Epic Games",
      release_date: "2017-09-26"
    },
    {
      id: 2,
      title: "League of Legends",
      thumbnail: "https://www.freetogame.com/g/286/thumbnail.jpg",
      short_description: "A free-to-play MOBA game, and one of the most played pc games in the world.",
      game_url: "https://www.freetogame.com/open/league-of-legends",
      genre: "MOBA",
      platform: "PC (Windows)",
      publisher: "Riot Games",
      developer: "Riot Games",
      release_date: "2009-10-27"
    },
    {
      id: 3,
      title: "Valorant",
      thumbnail: "https://www.freetogame.com/g/466/thumbnail.jpg",
      short_description: "Test your mettle in Riot Games' character-based FPS shooter Valorant.",
      game_url: "https://www.freetogame.com/open/valorant",
      genre: "Shooter",
      platform: "PC (Windows)",
      publisher: "Riot Games",
      developer: "Riot Games",
      release_date: "2020-06-02"
    }
  ];
  
  games = demoGames;
  filteredGames = [...games];
  
  populateFilters(games);
  displayGames(getCurrentPageData());
  renderPagination();
  displayRecentlyViewed();
  
  showNotification('Demo data loaded! Start the JSON server for full functionality.', 'warning');
}

function showLoadingSpinner() {
  loadingSpinner.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent scrolling while loading
}

function hideLoadingSpinner() {
  loadingSpinner.classList.add('hidden');
  document.body.style.overflow = 'auto'; // Restore scrolling
}

// Search functionality
function handleSearch() {
  applyFilters();
}

function clearSearchInput() {
  searchInput.value = '';
  applyFilters();
}

// Advanced filtering and sorting with loading state
function applyFilters() {
  // Show mini loading state for filters
  const filterSection = document.querySelector('.filter-section');
  filterSection.style.opacity = '0.7';
  
  setTimeout(() => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGenre = genreFilter.value;
    const selectedPlatform = platformFilter.value;
    const sortBy = sortFilter.value;

    filteredGames = games.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchTerm) ||
                           game.short_description.toLowerCase().includes(searchTerm);
      const matchesGenre = !selectedGenre || game.genre === selectedGenre;
      const matchesPlatform = !selectedPlatform || game.platform === selectedPlatform;
      
      return matchesSearch && matchesGenre && matchesPlatform;
    });

    // Apply sorting
    if (sortBy) {
      filteredGames.sort((a, b) => {
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'genre':
            return a.genre.localeCompare(b.genre);
          case 'platform':
            return a.platform.localeCompare(b.platform);
          default:
            return 0;
        }
      });
    }

    currentPage = 1;
    displayGames(getCurrentPageData());
    renderPagination();
    
    // Restore filter section opacity
    filterSection.style.opacity = '1';
    
    // Show results count
    updateResultsCount();
  }, 100);
}

// Update results count
function updateResultsCount() {
  const existingCount = document.querySelector('.results-count');
  if (existingCount) existingCount.remove();
  
  const count = document.createElement('div');
  count.className = 'results-count';
  count.textContent = `Showing ${filteredGames.length} game${filteredGames.length !== 1 ? 's' : ''}`;
  
  const sectionHeader = document.querySelector('.section-header');
  sectionHeader.appendChild(count);
}

function resetAllFilters() {
  searchInput.value = '';
  genreFilter.value = '';
  platformFilter.value = '';
  sortFilter.value = '';
  applyFilters();
}

// View mode management
function setViewMode(mode) {
  gameListEl.className = mode === 'list' ? 'game-list list-view' : 'game-list';
  gridView.classList.toggle('active', mode === 'grid');
  listView.classList.toggle('active', mode === 'list');
  localStorage.setItem('viewMode', mode);
}

// Show different sections
function showSection(section) {
  const gameList = document.getElementById('gameList');
  const favoritesList = document.getElementById('favoritesList');
  const recentList = document.getElementById('recentList');
  const pagination = document.getElementById('pagination');
  
  // Hide all sections
  gameList.style.display = 'none';
  favoritesList.style.display = 'none';
  recentList.style.display = 'none';
  pagination.style.display = 'none';
  
  // Remove active class from all tabs
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  
  // Show selected section
  switch(section) {
    case 'games':
      gameList.style.display = 'grid';
      pagination.style.display = 'block';
      document.getElementById('allGamesTab').classList.add('active');
      break;
    case 'favorites':
      favoritesList.style.display = 'grid';
      document.getElementById('favoritesTab').classList.add('active');
      loadFavorites();
      break;
    case 'recent':
      recentList.style.display = 'grid';
      document.getElementById('recentTab').classList.add('active');
      displayRecentlyViewed();
      break;
  }
}

// Get games for current page
function getCurrentPageData() {
  const start = (currentPage - 1) * pageSize;
  return filteredGames.slice(start, start + pageSize);
}

// Enhanced game display with ratings
function displayGames(gameArray) {
  if (gameArray.length === 0) {
    gameListEl.innerHTML = `
      <div class="no-results">
        <h3>🔍 No games found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }
  
  gameListEl.innerHTML = "";
  
  // Add staggered animation delay
  gameArray.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "game-card fade-in";
    card.style.animationDelay = `${index * 0.1}s`;
    
    const rating = gameRatings[game.id] || 0;
    const stars = generateStars(rating);
    
    card.innerHTML = `
      <div class="card-image">
        <img src="${game.thumbnail}" alt="${game.title}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
        <div class="card-overlay">
          <span class="play-icon">▶️</span>
        </div>
      </div>
      <div class="card-content">
        <h3>${game.title}</h3>
        <p><strong>Genre:</strong> ${game.genre}</p>
        <p><strong>Platform:</strong> ${game.platform}</p>
        <div class="game-rating">
          <span class="stars">${stars}</span>
          <span class="rating-text">(${rating}/5)</span>
        </div>
        <div class="card-actions">
          <button type="button" class="fav-btn">❤️ Favorite</button>
          <button type="button" class="rate-btn">⭐ Rate</button>
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (!e.target.closest('button')) {
        showDetails(game);
        addToRecentlyViewed(game);
      }
    });
    
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      saveToFavorites(game);
    });
    
    card.querySelector(".rate-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openRatingModal(game);
    });

    gameListEl.appendChild(card);
  });
}

// Generate star display
function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? '★' : '☆';
  }
  return stars;
}

// Rating system
function openRatingModal(game) {
  currentRatingGame = game;
  ratingModal.classList.remove('hidden');
  
  // Reset stars
  document.querySelectorAll('.star').forEach(star => {
    star.classList.remove('active');
  });
  
  // Show current rating
  const currentRating = gameRatings[game.id] || 0;
  document.querySelectorAll('.star').forEach((star, index) => {
    if (index < currentRating) {
      star.classList.add('active');
    }
  });
}

function closeRatingModal() {
  ratingModal.classList.add('hidden');
  currentRatingGame = null;
}

function selectRating(e) {
  const rating = parseInt(e.target.dataset.rating);
  document.querySelectorAll('.star').forEach((star, index) => {
    star.classList.toggle('active', index < rating);
  });
}

function hoverRating(e) {
  const rating = parseInt(e.target.dataset.rating);
  document.querySelectorAll('.star').forEach((star, index) => {
    star.style.color = index < rating ? '#ffd700' : '#ddd';
  });
}

function resetStarHover() {
  document.querySelectorAll('.star').forEach(star => {
    star.style.color = star.classList.contains('active') ? '#ffd700' : '#ddd';
  });
}

function submitRating() {
  if (!currentRatingGame) return;
  
  const selectedStars = document.querySelectorAll('.star.active').length;
  if (selectedStars === 0) {
    showNotification('Please select a rating', 'warning');
    return;
  }
  
  gameRatings[currentRatingGame.id] = selectedStars;
  localStorage.setItem('gameRatings', JSON.stringify(gameRatings));
  
  showNotification(`Rated ${currentRatingGame.title} ${selectedStars}/5 stars!`, 'success');
  closeRatingModal();
  
  // Refresh display to show new rating
  displayGames(getCurrentPageData());
}

// Recently viewed games
function addToRecentlyViewed(game) {
  recentlyViewed = recentlyViewed.filter(g => g.id !== game.id);
  recentlyViewed.unshift(game);
  recentlyViewed = recentlyViewed.slice(0, 6);
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  displayRecentlyViewed();
}

function displayRecentlyViewed() {
  recentListEl = document.getElementById("recentList");
  
  if (recentlyViewed.length === 0) {
    recentListEl.innerHTML = '<div class="no-results"><h3>No recent games</h3><p>Games you view will appear here</p></div>';
    return;
  }
  
  recentListEl.innerHTML = "";
  recentlyViewed.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";
    const rating = gameRatings[game.id] || 0;
    const stars = generateStars(rating);
    
    card.innerHTML = `
      <img src="${game.thumbnail}" alt="${game.title}" loading="lazy">
      <h3>${game.title}</h3>
      <p><strong>Genre:</strong> ${game.genre}</p>
      <div class="game-rating">
        <span class="stars">${stars}</span>
        <span class="rating-text">(${rating}/5)</span>
      </div>
    `;
    card.addEventListener("click", () => showDetails(game));
    recentListEl.appendChild(card);
  });
}

// Enhanced game details with screenshots carousel
function showDetails(game) {
  gameDetailsEl.classList.remove("hidden");
  const rating = gameRatings[game.id] || 0;
  const stars = generateStars(rating);
  
  gameDetailsEl.innerHTML = `
    <div class="details-header">
      <h3>${game.title}</h3>
      <button class="close-details">✕</button>
    </div>
    <img src="${game.thumbnail}" alt="${game.title}"/>
    <div class="game-rating">
      <span class="stars">${stars}</span>
      <span class="rating-text">(${rating}/5)</span>
    </div>
    <p><strong>Genre:</strong> ${game.genre}</p>
    <p><strong>Platform:</strong> ${game.platform}</p>
    <p><strong>Developer:</strong> ${game.developer || 'Unknown'}</p>
    <p><strong>Release Date:</strong> ${game.release_date || 'Unknown'}</p>
    <p>${game.short_description}</p>
    <a href="${game.game_url}" target="_blank">Play Now 🔗</a>
  `;
  
  // Add close functionality
  gameDetailsEl.querySelector('.close-details').addEventListener('click', () => {
    gameDetailsEl.classList.add('hidden');
  });
  
  // Scroll to details
  gameDetailsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Populate filters with unique values
function populateFilters(data) {
  const genres = [...new Set(data.map(g => g.genre))].sort();
  const platforms = [...new Set(data.map(g => g.platform))].sort();

  genres.forEach(genre => {
    const opt = document.createElement("option");
    opt.value = genre;
    opt.textContent = genre;
    genreFilter.appendChild(opt);
  });

  platforms.forEach(platform => {
    const opt = document.createElement("option");
    opt.value = platform;
    opt.textContent = platform;
    platformFilter.appendChild(opt);
  });
}

// Enhanced favorites management
async function saveToFavorites(game) {
  try {
    const response = await fetch(FAVORITES_API);
    const favs = await response.json();
    const alreadySaved = favs.some(f => f.id === game.id);
    
    if (!alreadySaved) {
      await fetch(FAVORITES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(game)
      });
      
      loadFavorites();
      showNotification(`${game.title} added to favorites! ❤️`);
    } else {
      showNotification("Already in favorites!", 'warning');
    }
  } catch (error) {
    // Fallback to localStorage if server not available
    let localFavs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    const alreadySaved = localFavs.some(f => f.id === game.id);
    
    if (!alreadySaved) {
      localFavs.push(game);
      localStorage.setItem('localFavorites', JSON.stringify(localFavs));
      showNotification(`${game.title} added to local favorites! ❤️`, 'warning');
    } else {
      showNotification("Already in favorites!", 'warning');
    }
  }
}

// Load and display favorites
async function loadFavorites() {
  favoritesListEl = document.getElementById("favoritesList");
  
  try {
    const response = await fetch(FAVORITES_API);
    const favs = await response.json();
    
    if (favs.length === 0) {
      favoritesListEl.innerHTML = '<div class="no-results"><h3>No favorites yet</h3><p>Add games to favorites to see them here</p></div>';
      return;
    }
    
    favoritesListEl.innerHTML = "";
    favs.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";
      const rating = gameRatings[game.id] || 0;
      const stars = generateStars(rating);
      
      card.innerHTML = `
        <img src="${game.thumbnail}" alt="${game.title}" loading="lazy"/>
        <h3>${game.title}</h3>
        <p><strong>Genre:</strong> ${game.genre}</p>
        <p><strong>Platform:</strong> ${game.platform}</p>
        <div class="game-rating">
          <span class="stars">${stars}</span>
          <span class="rating-text">(${rating}/5)</span>
        </div>
        <div class="card-actions">
          <button type="button" class="remove-btn">🗑 Remove</button>
        </div>
      `;
      
      card.querySelector(".remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        removeFavorite(game.id);
      });
      
      card.addEventListener("click", () => {
        showDetails(game);
        addToRecentlyViewed(game);
      });
      
      favoritesListEl.appendChild(card);
    });
  } catch (error) {
    // Fallback to localStorage
    const localFavs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
    
    if (localFavs.length === 0) {
      favoritesListEl.innerHTML = '<div class="no-results"><h3>No favorites yet</h3><p>Add games to favorites to see them here</p></div>';
      return;
    }
    
    favoritesListEl.innerHTML = "";
    localFavs.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";
      const rating = gameRatings[game.id] || 0;
      const stars = generateStars(rating);
      
      card.innerHTML = `
        <img src="${game.thumbnail}" alt="${game.title}" loading="lazy"/>
        <h3>${game.title}</h3>
        <p><strong>Genre:</strong> ${game.genre}</p>
        <p><strong>Platform:</strong> ${game.platform}</p>
        <div class="game-rating">
          <span class="stars">${stars}</span>
          <span class="rating-text">(${rating}/5)</span>
        </div>
        <div class="card-actions">
          <button type="button" class="remove-btn">🗑 Remove</button>
        </div>
      `;
      
      card.querySelector(".remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        removeLocalFavorite(game.id);
      });
      
      card.addEventListener("click", () => {
        showDetails(game);
        addToRecentlyViewed(game);
      });
      
      favoritesListEl.appendChild(card);
    });
  }
}

// Remove from local favorites
function removeLocalFavorite(gameId) {
  let localFavs = JSON.parse(localStorage.getItem('localFavorites') || '[]');
  localFavs = localFavs.filter(game => game.id !== gameId);
  localStorage.setItem('localFavorites', JSON.stringify(localFavs));
  loadFavorites();
  showNotification('Game removed from favorites! 🗑️');
}
}

// Remove from favorites
async function removeFavorite(gameId) {
  try {
    const response = await fetch(`${FAVORITES_API}/${gameId}`, {
      method: "DELETE"
    });
    
    if (response.ok) {
      loadFavorites();
      showNotification('Game removed from favorites! 🗑️');
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    showNotification('Error removing from favorites', 'error');
  }
}

// Enhanced pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredGames.length / pageSize);
  let paginationContainer = document.getElementById("pagination");

  paginationContainer.innerHTML = "";
  
  if (totalPages <= 1) return;

  // Previous button
  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "‹";
    prevBtn.className = "page-btn";
    prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
    paginationContainer.appendChild(prevBtn);
  }

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.textContent = "1";
    firstBtn.className = "page-btn";
    firstBtn.addEventListener("click", () => goToPage(1));
    paginationContainer.appendChild(firstBtn);
    
    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.style.padding = "0 10px";
      paginationContainer.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn";
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => goToPage(i));
    paginationContainer.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.style.padding = "0 10px";
      paginationContainer.appendChild(dots);
    }
    
    const lastBtn = document.createElement("button");
    lastBtn.textContent = totalPages;
    lastBtn.className = "page-btn";
    lastBtn.addEventListener("click", () => goToPage(totalPages));
    paginationContainer.appendChild(lastBtn);
  }

  // Next button
  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "›";
    nextBtn.className = "page-btn";
    nextBtn.addEventListener("click", () => goToPage(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }
}

function goToPage(page) {
  currentPage = page;
  showLoadingSpinner();
  
  // Add small delay to show loading state
  setTimeout(() => {
    displayGames(getCurrentPageData());
    renderPagination();
    hideLoadingSpinner();
    
    // Smooth scroll to top of game list
    const gameSection = document.querySelector('.games-section');
    if (gameSection) {
      gameSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 200);
}

// Enhanced notification system
function showNotification(message, type = 'success') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  
  switch(type) {
    case 'success':
      notification.style.background = 'linear-gradient(45deg, #00ff88, #00cc66)';
      break;
    case 'error':
      notification.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
      break;
    case 'warning':
      notification.style.background = 'linear-gradient(45deg, #ffaa00, #ff8800)';
      break;
    default:
      notification.style.background = 'linear-gradient(45deg, #7f00ff, #e100ff)';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);