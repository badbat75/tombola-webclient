# Tombola Web Client

A modern web-based client for the Tombola game, built with Svelte 5 and TypeScript.

## Features

- 🎯 **Real-time Game Play**: Connect to the Tombola API server and play in real-time
- 🎫 **Card Management**: Generate and manage multiple tombola cards (up to 6)
- 📊 **Live Board**: Visual representation of the 1-90 number board with extraction tracking
- 🏆 **Achievement Tracking**: Real-time tracking of lines completed, scores, and BINGO status
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚡ **Auto-refresh**: Automatic updates every 3 seconds to stay synchronized
- 🎨 **Modern UI**: Clean, accessible interface with smooth animations

## Quick Start

1. **Start the Tombola API Server** (from the main tombola directory):
   ```bash
   cargo run --bin tombola-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## How to Play

1. **Connect**: The app will automatically try to connect to the API server at `http://127.0.0.1:3000`
2. **Register**: Enter your name and choose how many cards to generate (1-6)
3. **Play**: Watch the board for number extractions and track your progress on your cards
4. **Win**: Complete lines or achieve BINGO on your cards!

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
