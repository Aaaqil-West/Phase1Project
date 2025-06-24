# Free to Play Games Browser

A web application for browsing and managing your favorite free-to-play games.

## Features
- Browse a collection of free-to-play games
- Search games by title
- Filter by genre and platform
- Add games to favorites
- Remove games from favorites
- Pagination for easy browsing
- Game details view

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the JSON server:
   ```bash
   npm start
   ```

4. Open `index.html` in your browser or serve it with a local server

## Usage

- **Browse Games**: View all available games in the main grid
- **Search**: Use the search bar to find specific games
- **Filter**: Use dropdown menus to filter by genre or platform
- **Add to Favorites**: Click the "❤️ Favorite" button on any game card
- **Remove from Favorites**: Click the "🗑 Remove" button in the favorites section
- **View Details**: Click on any game card to see detailed information

## API Endpoints

The application uses json-server to provide REST API endpoints:
- `GET /games` - Get all games
- `GET /favorites` - Get favorite games
- `POST /favorites` - Add a game to favorites
- `DELETE /favorites/:id` - Remove a game from favorites

## Technologies Used

- HTML5
- CSS
- Vanilla JavaScript
- JSON Server for REST API
- Local JSON database