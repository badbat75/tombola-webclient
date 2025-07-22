# Tombola Web Client

A modern, responsive web interface for the Tombola game, built with **SvelteKit 5** and **TypeScript**. This client supports the **multi-game architecture** with game discovery, creation, and management capabilities for both card players and board operators.

## 🎯 Features

### Multi-Game Architecture Support
- 🎮 **Game Discovery**: Browse available games with detailed status information
- ✨ **Game Creation**: Create new games directly from the web interface
- 🔀 **Game Selection**: Choose your preferred game with enhanced information display
- 📊 **Detailed Game Status**: View player counts, card assignments, extraction progress, and best scores
- 📈 **Progress Visualization**: Visual progress bars showing game completion status
- 🏆 **Achievement Tracking**: Display current best scores and prize levels per game
- 🗂️ **Client Name Resolution**: Proper display of player names instead of client IDs

### For Card Players (`/player?gameId={game_id}`)
- 🎫 **Multi-Card Management**: Generate and manage up to 6 tombola cards simultaneously
- 📊 **Real-time Scoring**: Live tracking of lines completed and BINGO achievements
- 🏆 **Achievement Notifications**: Visual feedback for completed lines and special achievements
- 📱 **Mobile Optimized**: Responsive design perfect for mobile gameplay
- ⚡ **Auto-sync**: Automatic updates every 3 seconds to stay synchronized with the specific game

### For Board Operators (`/board?gameId={game_id}`)
- 🎲 **Number Extraction**: Extract numbers with visual confirmation and remaining count
- 📋 **Large Board Display**: Enhanced 100% larger board matrix with improved visibility
- 📊 **Live Leaderboard**: Real-time player rankings and scores with proper name resolution
- 🎯 **Visual Separators**: Clear section divisions with horizontal and vertical separators
- 📈 **Recent Extractions**: Prominent display of recently drawn numbers
- 🔑 **Board Client Authentication**: Uses special client ID `"0000000000000000"` (no registration required)

### Universal Features
- 🌐 **Real-time Connectivity**: REST API communication with Rust backend for game-specific operations
- 🎨 **Modern UI**: Clean, accessible interface with smooth transitions
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ♿ **Accessibility**: Keyboard navigation and screen reader support
- 🔄 **Auto-reconnection**: Robust connection handling with automatic recovery
- 💾 **State Persistence**: Game and mode selection saved in localStorage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust Tombola API Server running on `localhost:3000` with multi-game support

### 1. Configure Server Connection (Optional)
Copy the example configuration file and customize if needed:
```bash
copy .env.example .env
```

Edit `.env` to match your server setup:
```env
VITE_API_HOST=127.0.0.1
VITE_API_PORT=3000
VITE_API_PROTOCOL=http
```

For detailed configuration options, see [CONFIG.md](CONFIG.md).

### 2. Start the Tombola API Server
From the main tombola directory:
```bash
cargo run --bin tombola-server
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
- **Game Selection**: http://localhost:5173 (choose game and mode)
- **Direct Card Player**: http://localhost:5173/player?gameId={game_id}
- **Direct Board Operator**: http://localhost:5173/board?gameId={game_id}

## 🏗️ Architecture

### Multi-Game Flow
1. **Game Selection**: Browse available games or create a new one
2. **Mode Selection**: Choose between Player (cards) or Board (operator) mode
3. **Game Interaction**: Connect to the specific game with proper game ID routing

### Route Structure
```
/                           - Landing page with game selection and mode selection
/player?gameId={game_id}   - Card player interface for specific game
/board?gameId={game_id}    - Board operator interface for specific game
```

### Key Components
- **`GameSelector.svelte`**: Game discovery, selection, and creation interface with enhanced score display
- **`Board.svelte`**: Configurable board component with `normal`/`large` size variants
- **`Card.svelte`**: Individual tombola card with number tracking
- **`GameFooter.svelte`**: Connection status and game information
- **`LeaderboardSidebar.svelte`**: Real-time player rankings with name resolution and color-coded achievements
- **`ScoreBoard.svelte`**: Achievement display with consistent score formatting
- **`gameStore.svelte.ts`**: Centralized game state management with Svelte 5 runes and client caching
- **`scoreUtils.ts`**: Centralized score mapping and formatting utilities

### Technology Stack
- **Frontend**: SvelteKit 5, TypeScript, Vite
- **Styling**: CSS with CSS Grid and Flexbox
- **State Management**: Svelte 5 runes (`$state`, `$effect`)
- **API Communication**: REST API with game-specific routing (`/{game_id}/endpoint`)
- **Backend**: Rust Tombola API Server with GameRegistry multi-game architecture

## 🎮 How to Play

### Getting Started
1. **Select Game**: Navigate to http://localhost:5173 and browse available games with detailed information:
   - **Game Status**: New, Active, or Closed games with visual indicators
   - **Player Count**: Number of registered players and assigned cards
   - **Progress**: Visual progress bars showing extraction completion (0-90 numbers)
   - **Best Scores**: Current highest achievements and prize levels
   - **Creation Time**: When each game was created
2. **Create Game** (Optional): Click "Create New Game" to start a fresh game
3. **Choose Mode**: Select either "Player (Cards)" or "Board (Operator)" mode

### For Card Players
1. **Connect**: The app automatically connects to your selected game
2. **Register**: Enter your player name and choose number of cards (1-6)
3. **Play**: Watch for number extractions and track progress on your cards
4. **Win**: Complete lines horizontally, vertically, or diagonally for points
5. **BINGO**: Fill an entire card to achieve BINGO status!

### For Board Operators
1. **Connect**: Automatically registers as board viewer for the selected game
2. **Extract Numbers**: Click "Extract Number" to draw the next number
3. **Monitor**: Watch the large board display and recent extractions
4. **Track**: Monitor player leaderboard with resolved player names in real-time

### Multi-Game Benefits
- **Parallel Games**: Multiple games can run simultaneously without interference
- **Game Discovery**: Easy browsing of active games with player counts and status
- **Flexible Participation**: Join any available game or create your own
- **Isolated State**: Each game maintains completely separate state and progress

### 🏆 Score System
The game uses a standardized scoring system with consistent visual representation:

- **📍 2 in Line** - Two numbers marked in a line (blue theme)
- **📌 3 in Line** - Three numbers marked in a line (green theme)
- **🎯 4 in Line** - Four numbers marked in a line (yellow theme)
- **🏆 5 in Line** - Full line completion (orange theme)
- **🎉 BINGO!!!** - Complete card filled (red theme)

All components use the centralized `scoreUtils.ts` for consistent score display, colors, and messaging across the entire application.

## 🛠️ Development

### Build Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run type checking
npm run lint         # Run ESLint
```

### Key Features Implementation

#### Game Selection Flow
1. **Game Discovery**: `GameSelector.svelte` fetches and displays available games
2. **Game Creation**: Users can create new games with automatic selection
3. **Mode Selection**: Choose between Player (cards) or Board (operator) modes
4. **State Persistence**: Game and mode choices saved in localStorage

#### Client Name Resolution
- **Global Resolution**: Names resolved across all games via `/clientinfo/{client_id}`
- **Caching System**: Client names cached in `gameStore.svelte.ts` for performance
- **Fallback Display**: Graceful degradation to client IDs when names unavailable
- **Real-time Updates**: Names refresh automatically with leaderboard updates

#### Multi-Game Architecture Benefits
- **Concurrent Games**: Multiple independent games running simultaneously
- **Game Isolation**: Complete separation of game state, cards, and progress
- **Flexible Access**: Players can join any available game or create new ones
- **Scalable Design**: Server handles multiple games with thread-safe GameRegistry
- **Easy Discovery**: Web interface provides intuitive game browsing and selection

## 📡 API Integration

The web client communicates with the Rust Tombola API server through RESTful endpoints using the multi-game architecture:

### Global Endpoints
- `GET /gameslist` - List all available games with status
- `POST /newgame` - Create a new game (returns game ID)
- `GET /clientinfo/{client_id}` - Get client info by ID (global search)

### Game-Specific Endpoints (require `/{game_id}/` routing)
- `GET /{game_id}/status` - Retrieve current game state
- `POST /{game_id}/register` - Register as player or viewer
- `POST /{game_id}/extract` - Extract next number (operators only)
- `GET /{game_id}/board` - Get current board state
- `GET /{game_id}/scoremap` - Get current scores and achievements
- `GET /{game_id}/listassignedcards` - List client's assigned cards
- `GET /{game_id}/getassignedcard/{card_id}` - Get specific card details

### Authentication
- Uses `X-Client-ID` header for authenticated endpoints
- Board operators use special client ID `"0000000000000000"`
- Player clients receive dynamically generated 16-character hex IDs

## 🎨 Customization

### Board Sizes
The `Board.svelte` component supports two size variants:
- `normal` - Compact view for card players (24px circles, 11px fonts)
- `large` - Enhanced view for operators (48px circles, 22px fonts, increased spacing)

### Responsive Breakpoints
- **Mobile**: < 768px (single column layout, smaller controls)
- **Tablet**: 768px - 1024px (adaptive grid layouts)
- **Desktop**: > 1024px (full two-column layout)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[Tombola Backend](https://github.com/badbat75/tombola)** - Rust API server and game engine
- **Tombola Terminal Client** - Console-based client (part of main repo)

## 🛠️ Advanced Configuration

### Server Connection Configuration
The web client can be easily configured to connect to different server endpoints using a simple `.env` file in the project root:

```env
# Server endpoint configuration
VITE_API_HOST=127.0.0.1      # Server hostname or IP
VITE_API_PORT=3000           # Server port
VITE_API_PROTOCOL=http       # http or https

# Enable debug logging (optional)
VITE_DEBUG_MODE=true         # Shows API requests in console
```

**Quick setup:**
1. Copy `.env.example` to `.env`
2. Modify the values as needed
3. Restart the development server

See [CONFIG.md](CONFIG.md) for detailed configuration options and examples.

### Environment Variables (Legacy)
You can also set environment variables directly:
```bash
# Windows (PowerShell)
$env:VITE_API_HOST="192.168.1.100"
$env:VITE_API_PORT="8080"
npm run dev

# Linux/macOS
VITE_API_HOST=192.168.1.100 VITE_API_PORT=8080 npm run dev
```

### Custom Game Selection
The web client automatically discovers available games, but you can also:
- Create new games directly from the interface
- Join specific games via URL parameters
- Bookmark specific game URLs for quick access

## 🌐 Browser Support

- Modern browsers with ES2020 support
- Mobile browsers (iOS Safari, Android Chrome)
- Progressive Web App features ready for future enhancement

## 🤝 Contributing

This web client is part of the larger Tombola project. See the main project README for contribution guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[Tombola Backend](https://github.com/badbat75/tombola)** - Rust API server and game engine
- **Tombola Terminal Client** - Console-based client (part of main repo)

---

**Built with ❤️ using SvelteKit 5 and TypeScript**
