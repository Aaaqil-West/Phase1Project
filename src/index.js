const API_URL = "http://localhost:3001/games";
const FAVORITES_API = "http://localhost:3001/favorites";

const gameListEl = document.getElementById("gameList");
const gameDetailsEl = document.getElementById("gameDetails");
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const platformFilter = document.getElementById("platformFilter");
const favoritesListEl = document.getElementById("favoritesList");

let games = [];
let currentPage = 1;
const pageSize = 12;

// Fetch and initialize game data
fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    games = data;
    populateFilters(data);
    displayGames(getCurrentPageData());
    renderPagination();
  });

// Get games for current page
function getCurrentPageData() {
  const start = (currentPage - 1) * pageSize;
  return games.slice(start, start + pageSize);
}

// Render games
function displayGames(gameArray) {
  gameListEl.innerHTML = "";
  gameArray.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <img src="${game.thumbnail}" alt="${game.title}">
      <h3>${game.title}</h3>
      <p><strong>Genre:</strong> ${game.genre}</p>
      <p><strong>Platform:</strong> ${game.platform}</p>
      <button type="button" class="fav-btn">❤️ Favorite</button>
    `;

    card.addEventListener("click", () => showDetails(game));
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveToFavorites(game);
    });

    gameListEl.appendChild(card);
  });
}

// Show game details
function showDetails(game) {
  gameDetailsEl.classList.remove("hidden");
  gameDetailsEl.innerHTML = `
    <h3>${game.title}</h3>
    <img src="${game.thumbnail}" alt="${game.title}"/>
    <p><strong>Genre:</strong> ${game.genre}</p>
    <p><strong>Platform:</strong> ${game.platform}</p>
    <p>${game.short_description}</p>
    <a href="${game.game_url}" target="_blank">Play Now 🔗</a>
  `;
}

// Populate genre and platform filters
function populateFilters(data) {
  const genres = [...new Set(data.map(g => g.genre))];
  const platforms = [...new Set(data.map(g => g.platform))];

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

// Search functionality
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = games.filter(g => g.title.toLowerCase().includes(term));
  displayGames(filtered);
  renderPagination(filtered);
});

// Filter functionality
genreFilter.addEventListener("change", applyFilters);
platformFilter.addEventListener("change", applyFilters);

function applyFilters() {
  const genre = genreFilter.value;
  const platform = platformFilter.value;

  let filtered = [...games];
  if (genre) filtered = filtered.filter(g => g.genre === genre);
  if (platform) filtered = filtered.filter(g => g.platform === platform);

  displayGames(filtered);
  renderPagination(filtered);
}

// Save game to favorites (prevent duplicate)
function saveToFavorites(game) {
  fetch(FAVORITES_API)
    .then(res => res.json())
    .then(favs => {
      const alreadySaved = favs.some(f => f.id === game.id);
      if (!alreadySaved) {
        // Post the entire game object with same ID
        fetch(FAVORITES_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(game)
        })
        .then(res => res.json())
        .then(() => {
          loadFavorites();
          showNotification(`${game.title} added to favorites! ❤️`);
        })
        .catch(error => {
          console.error('Error adding to favorites:', error);
          showNotification('Error adding to favorites', 'error');
        });
      } else {
        showNotification("Already in favorites!", 'warning');
      }
    })
    .catch(error => {
      console.error('Error checking favorites:', error);
      showNotification('Error checking favorites', 'error');
    });
}

// Load favorites and render them
function loadFavorites() {
  fetch(FAVORITES_API)
    .then(res => res.json())
    .then(favs => {
      favoritesListEl.innerHTML = "";
      favs.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";
        card.innerHTML = `
          <img src="${game.thumbnail}" alt="${game.title}"/>
          <h3>${game.title}</h3>
          <p><strong>Genre:</strong> ${game.genre}</p>
          <p><strong>Platform:</strong> ${game.platform}</p>
          <button type="button" class="remove-btn">🗑 Remove</button>
        `;
        card.querySelector(".remove-btn").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeFavorite(game.id);
        });
        card.addEventListener("click", () => showDetails(game));
        favoritesListEl.appendChild(card);
      });
    });
}

// Remove from favorites
function removeFavorite(gameId) {
  fetch(`${FAVORITES_API}/${gameId}`, {
    method: "DELETE"
  })
  .then(res => {
    if (res.ok) {
      loadFavorites();
      showNotification('Game removed from favorites! 🗑️');
    } else {
      throw new Error('Failed to remove from favorites');
    }
  })
  .catch(error => {
    console.error('Error removing from favorites:', error);
    showNotification('Error removing from favorites', 'error');
  });
}


// Render pagination buttons
function renderPagination(filteredGames = games) {
  let totalPages = Math.ceil(filteredGames.length / pageSize);
  let paginationContainer = document.getElementById("pagination");

  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "pagination";
    paginationContainer.style.textAlign = "center";
    paginationContainer.style.margin = "20px 0";
    document.body.appendChild(paginationContainer);
  }

  paginationContainer.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn";
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      displayGames(getCurrentPageData());
      renderPagination();
    });
    paginationContainer.appendChild(btn);
  }
}

// Notification system
function showNotification(message, type = 'success') {
  // Remove existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add styles
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
  
  // Set background color based on type
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
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
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

// Initial load
loadFavorites();
