# Tombola Web Client

A modern, responsive web interface for the Tombola game, built with **SvelteKit 5** and **TypeScript**. This client provides separate interfaces for card players and board operators, with real-time game state synchronization.

## 🎯 Features

### For Card Players (`/player`)
- 🎫 **Multi-Card Management**: Generate and manage up to 6 tombola cards simultaneously
- 📊 **Real-time Scoring**: Live tracking of lines completed and BINGO achievements
- 🏆 **Achievement Notifications**: Visual feedback for completed lines and special achievements
- 📱 **Mobile Optimized**: Responsive design perfect for mobile gameplay
- ⚡ **Auto-sync**: Automatic updates every 3 seconds to stay synchronized with the game

### For Board Operators (`/board`)
- 🎲 **Number Extraction**: Extract numbers with visual confirmation and remaining count
- 📋 **Large Board Display**: Enhanced 100% larger board matrix with improved visibility
- 🔄 **Game Management**: Start new games and dump current game data
- 📊 **Live Leaderboard**: Real-time player rankings and scores
- 🎯 **Visual Separators**: Clear section divisions with horizontal and vertical separators
- 📈 **Recent Extractions**: Prominent display of recently drawn numbers

### Universal Features
- 🌐 **Real-time Connectivity**: WebSocket-like API communication with Rust backend
- 🎨 **Modern UI**: Clean, accessible interface with smooth transitions
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ♿ **Accessibility**: Keyboard navigation and screen reader support
- 🔄 **Auto-reconnection**: Robust connection handling with automatic recovery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust Tombola API Server running on `localhost:3000`

### 1. Start the Tombola API Server
From the main tombola directory:
```bash
cargo run --bin tombola-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
- **Main Menu**: http://localhost:5173
- **Card Player Interface**: http://localhost:5173/player
- **Board Operator Interface**: http://localhost:5173/board

## 🏗️ Architecture

### Route Structure
```
/                 - Landing page with mode selection
/player          - Card player interface
/board           - Board operator interface
```

### Key Components
- **`Board.svelte`**: Configurable board component with `normal`/`large` size variants
- **`Card.svelte`**: Individual tombola card with number tracking
- **`GameFooter.svelte`**: Connection status and game information
- **`LeaderboardSidebar.svelte`**: Real-time player rankings
- **`gameStore.svelte.ts`**: Centralized game state management with Svelte 5 runes

### Technology Stack
- **Frontend**: SvelteKit 5, TypeScript, Vite
- **Styling**: CSS with CSS Grid and Flexbox
- **State Management**: Svelte 5 runes (`$state`, `$effect`)
- **API Communication**: REST API with automatic polling
- **Backend**: Rust Tombola API Server

## 🎮 How to Play

### For Card Players
1. **Connect**: Navigate to `/player` - the app automatically connects to the API server
2. **Register**: Enter your player name and choose number of cards (1-6)
3. **Play**: Watch for number extractions and track progress on your cards
4. **Win**: Complete lines horizontally, vertically, or diagonally for points
5. **BINGO**: Fill an entire card to achieve BINGO status!

### For Board Operators
1. **Connect**: Navigate to `/board` - automatically registers as board viewer
2. **Extract Numbers**: Click "Extract Number" to draw the next number
3. **Monitor**: Watch the large board display and recent extractions
4. **Manage**: Start new games or dump current game data as needed
5. **Track**: Monitor player leaderboard and achievements in real-time

## 🛠️ Development

### Build Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run type checking
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── routes/
│   ├── +page.svelte           # Landing page with mode selector
│   ├── player/+page.svelte    # Card player interface
│   └── board/+page.svelte     # Board operator interface
├── lib/
│   ├── components/            # Reusable Svelte components
│   ├── gameStore.svelte.ts    # Game state management
│   ├── api.ts                 # API communication layer
│   └── types.ts               # TypeScript type definitions
└── app.html                   # HTML template
```

## 📡 API Integration

The web client communicates with the Rust Tombola API server through RESTful endpoints:

- `GET /game/state` - Retrieve current game state
- `POST /game/register` - Register as player or viewer
- `POST /game/extract` - Extract next number (operators only)
- `POST /game/new` - Start new game (operators only)
- `POST /game/dump` - Dump current game (operators only)

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

---

**Built with ❤️ using SvelteKit 5 and TypeScript**

## API Server Requirements

This web client requires the Tombola API server to be running on `http://127.0.0.1:3000`. The server provides:

- Client registration and card generation
- Real-time game state (board, extractions, scores)
- Number extraction tracking
- Achievement monitoring

## Project Structure

```
src/
├── lib/
│   ├── components/          # Svelte components
│   │   ├── Board.svelte    # Number board (1-90)
│   │   ├── Card.svelte     # Individual tombola card
│   │   └── GameStatus.svelte # Game state and player stats
│   ├── api.ts              # API client for Tombola server
│   ├── gameStore.svelte.ts # Reactive game state management
│   └── types.ts            # TypeScript type definitions
├── routes/
│   └── +page.svelte        # Main application page
└── app.css                 # Global styles
```

## Technology Stack

- **Svelte 5**: Modern reactive framework with runes
- **SvelteKit**: Full-stack Svelte framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **CSS3**: Modern styling with Grid and Flexbox

## Building for Production

```bash
npm run build
```

The built files will be in the `build/` directory, ready for deployment to any static hosting service.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript checks

## Browser Support

- Modern browsers with ES2020 support
- Mobile browsers (iOS Safari, Android Chrome)
- Progressive Web App features ready for future enhancement

## Contributing

This web client is part of the larger Tombola project. See the main project README for contribution guidelines.
