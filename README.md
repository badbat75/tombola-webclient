# Tombola Web Client

A modern, responsive web interface for the Tombola game, built with **SvelteKit 5** and **TypeScript**. This client supports the **multi-game architecture** with game discovery, creation, and management capabilities for both card players and board operators.

## 🎯 Features

### 🔐 User Registration System
- 📝 **Simple Registration**: Users register with just their name via the header input
- 👤 **Global User Identity**: Registered users can join multiple games with the same identity
- 🎮 **Game Selection**: After registration, users can browse and join available games
- 🎯 **Smart Game Joining**:
  - **Game Owners**: Automatically redirected to board interface (`/board?gameId={id}`)
  - **New Games**: Direct card selection modal for choosing number of cards (1-6)
  - **Active Games**: Direct redirect to player interface (`/player?gameId={id}`) - may already have cards assigned
- 💾 **Persistent Identity**: User registration saved in localStorage for convenience
- 🔓 **Flexible Flow**: No authentication required - just enter your name and start playing
- 📊 **Status Visibility**: Registration status displayed in footer with improved "No games available" message styling

### Multi-Game Architecture Support
- 🎮 **Game Discovery**: Browse available games with detailed status information
- ✨ **Game Creation**: Create new games directly from the web interface (board clients only)
- 🔀 **Streamlined Game Access**: Intelligent routing eliminates unnecessary modals - users are directly taken to the appropriate interface based on their role
- 📊 **Detailed Game Status**: View player counts, card assignments, extraction progress, and best scores
- 📈 **Progress Visualization**: Visual progress bars showing game completion status
- 🏆 **Achievement Tracking**: Display current best scores and prize levels per game
- 🗂️ **Client Name Resolution**: Proper display of player names instead of client IDs
- 👥 **Registration State Awareness**: UI adapts based on whether user is registered or not

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
- 📊 **Status Footer**: Persistent status bar showing user registration/authentication status and game context information

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Tombola API server running on http://127.0.0.1:3000

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The client will automatically detect if authentication is configured on the server
# If no Supabase credentials are properly configured, simple registration mode is used
```

### Environment Configuration

The client supports both simple registration and full authentication modes:

**Simple Registration Mode** (default if Supabase not configured):
```env
# .env
API_HOST=127.0.0.1
API_PORT=3000
API_PROTOCOL=http
DEBUG_MODE=false

# No Supabase configuration needed for simple registration
```

**Full Authentication Mode** (requires proper Supabase configuration):
```env
# .env
API_HOST=127.0.0.1
API_PORT=3000
API_PROTOCOL=http
DEBUG_MODE=false

# Supabase configuration for full authentication
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

## 🏗️ Architecture

### Multi-Game Flow
1. **User Registration**: Register your name in the header (persistent across games)
2. **Game Selection**: Browse available games or create a new one
3. **Game Joining**: Interactive dialog with options for cards or board access
4. **Game Interaction**: Connect to the specific game with proper game ID routing

### Route Structure
```
/                           - Landing page with user registration and game selection
/player?gameId={game_id}   - Card player interface for specific game
/board?gameId={game_id}    - Board operator interface for specific game
```

### Key Components
- **`GameSelector.svelte`**: Game discovery, selection, and creation interface with enhanced score display
- **`GameJoinDialog.svelte`**: Interactive modal for joining games with board ownership verification
- **`CardSelectionModal.svelte`**: Modal for selecting number of cards when joining new games
- **`UserRegistration.svelte`**: Simple name-based registration component for persistent identity
- **`Board.svelte`**: Configurable board component with `normal`/`large` size variants
- **`Card.svelte`**: Individual tombola card with number tracking
- **`GameFooter.svelte`**: Connection status and game information
- **`LeaderboardSidebar.svelte`**: Real-time player rankings with name resolution and color-coded achievements
- **`ScoreBoard.svelte`**: Achievement display with consistent score formatting
- **`gameStore.svelte.ts`**: Centralized game state management with Svelte 5 runes and client caching
- **`userRegistration.ts`**: Store for managing user registration state across the application
- **`scoreUtils.ts`**: Centralized score mapping and formatting utilities

### Technology Stack
- **Frontend**: SvelteKit 5, TypeScript, Vite
- **Styling**: CSS with CSS Grid and Flexbox
- **State Management**: Svelte 5 runes (`$state`, `$effect`)
- **API Communication**: REST API with game-specific routing (`/{game_id}/endpoint`)
- **Backend**: Rust Tombola API Server with GameRegistry multi-game architecture

## 🎮 How to Play

### Getting Started (Simple Registration Mode)
1. **Register Your Name**: Enter your name in the input box in the header and click "Register"
2. **Browse Games**: View all available games with detailed information:
   - **Game Status**: New, Active, or Closed games with visual indicators
   - **Player Count**: Number of registered players and assigned cards
   - **Progress**: Visual progress bars showing extraction completion (0-90 numbers)
   - **Best Scores**: Current highest achievements and prize levels
   - **Creation Time**: When each game was created
3. **Join a Game**: Click on any game to open the game join dialog:
   - **New Games**: Option to join with cards (full participation) or as spectator
   - **Active Games**: Join as spectator only (no cards available)
4. **Create Game** (Board clients only): Board operators can create new games

### User Registration Flow
1. **First Visit**: Games are visible but disabled until you register
2. **Register**: Enter your name in the header - this creates a global user account
3. **Game Selection**: Once registered, you can click on games to join them
4. **Join Options**:
   - **New Games**: Choose between "Play with cards" (6 cards) or "Spectator mode"
   - **Active Games**: Automatically join as spectator (games already started)
5. **Persistent Identity**: Your registration persists across browser sessions

### For Card Players
1. **Join Game**: Select a game and choose "Play with cards" if it's new
2. **Auto-Registration**: You're automatically registered to the specific game
3. **Play**: Watch for number extractions and track progress on your cards
4. **Win**: Complete lines horizontally, vertically, or diagonally for points
5. **BINGO**: Fill an entire card to achieve BINGO status!

### For Board Operators
1. **Register**: Enter your name in the header to create persistent identity
2. **Create Game**: Create a new game to become the board owner
3. **Board Access**: Only game creators can access board mode for their games
4. **Extract Numbers**: Click "Extract Number" to draw the next number
5. **Monitor**: Watch the large board display and recent extractions
6. **Track**: Monitor player leaderboard with resolved player names in real-time

### Board Ownership System
- **Game Creator**: The person who creates a game becomes the board owner
- **Board Access**: Only the board owner can access the `/board` route for that game
- **Ownership Verification**: System compares user names to verify board ownership
- **Security**: Prevents unauthorized access to number extraction functionality

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
- `POST /register` - Global user registration with name
- `GET /clientinfo/{client_id}` - Get client info by ID (global search)

### Game-Specific Endpoints (require `/{game_id}/` routing)
- `GET /{game_id}/status` - Retrieve current game state
- `POST /{game_id}/join` - Join specific game as player or board client
- `POST /{game_id}/extract` - Extract next number (board owners only)
- `GET /{game_id}/board` - Get current board state
- `GET /{game_id}/scoremap` - Get current scores and achievements
- `POST /{game_id}/generatecards` - Generate cards for player
- `GET /{game_id}/listassignedcards` - List client's assigned cards
- `GET /{game_id}/getassignedcard/{card_id}` - Get specific card details

## 🔐 Registration & Authentication System

The Tombola Web Client implements a **flexible dual-mode system** that adapts based on server configuration, supporting both simple name-based registration and full Supabase authentication.

### Architecture Overview

#### 🎯 Dual System Design
- **Simple Registration Mode**: Default mode requiring only a name for participation
- **Full Authentication Mode**: Optional Supabase integration with magic link authentication
- **Server Detection**: Automatically detects which mode to use based on server configuration
- **Seamless Experience**: Users don't need to know which mode is active

#### 🔄 Simple Registration Flow (Default)
1. **Name Registration**: User enters their name in the header input
2. **Global Identity**: Creates a persistent user identity across all games
3. **Game Joining**: Interactive dialog for joining games with different participation options
4. **Board Ownership**: Game creators automatically become board owners
5. **Persistent State**: Registration saved in localStorage for convenience

#### � Full Authentication Flow (Optional)
1. **Email Input**: User enters email on landing page
2. **Magic Link**: Server sends magic link via Supabase API
3. **Token Verification**: Magic link processed server-side with JWT validation
4. **Session Creation**: Valid tokens stored in HTTP-only cookies
5. **Route Access**: Protected routes validate JWT server-side before rendering

### Simple Registration Mode

#### User Registration System
- **🏷️ Name-Based**: Simple name input creates global user identity
- **💾 Local Storage**: Registration persists across browser sessions
- **🎮 Game Discovery**: Browse and join available games after registration
- **🔑 Board Ownership**: Game creators automatically get board access
- **🚀 No Setup**: Works immediately without external service configuration

#### Game Joining Process
1. **Register Name**: Enter name in header to create persistent identity
2. **Browse Games**: View all available games with status indicators
3. **Join Dialog**: Interactive modal shows game details and join options:
   - **New Games**: Choose between playing with cards or spectator mode
   - **Active Games**: Join as spectator (cards may still be available)
   - **Board Access**: Available only to game creators
4. **Card Selection**: Choose number of cards (1-10) for new games

#### Board Ownership Verification
- **Creator Rights**: Only the person who creates a game can access board mode
- **Name Comparison**: System verifies board ownership using registered name
- **Access Control**: Unauthorized users redirected with clear error messages
- **Security**: Prevents unauthorized number extraction

### Full Authentication Mode

#### 🛡️ Security-First Design
- **Server-Side Rendering (SSR)**: All authentication checks happen server-side
- **JWT Token Validation**: Tokens validated against Supabase on every protected route access
- **HTTP-Only Cookies**: Session tokens stored securely, inaccessible to JavaScript
- **Zero Client Exposure**: No authentication credentials or configuration exposed to the browser
- **Route Protection**: Server-side enforcement for `/player` and `/board` routes when authentication is enabled

#### 🎯 Identity Management
The system maintains separate but coordinated identity concepts:

**� User Identity**
- **Simple Mode**: Name-based registration stored in localStorage
- **Auth Mode**: JWT-validated user sessions with Supabase integration
- **Purpose**: Controls access to games and board ownership
- **Persistence**: localStorage (simple) or HTTP-only cookies (auth)

**🎮 Game Client ID**
- **Purpose**: Game participation and state tracking
- **Implementation**: Dynamic 16-character hex IDs for players
- **Scope**: Game-specific registration and API communication
- **Storage**: Managed by API client for game functionality

### Configuration

#### Simple Registration Mode (Default)
No configuration required - works out of the box:

```env
# Simple registration mode active when Supabase not configured
# No additional environment variables needed
```

#### Full Authentication Mode
Requires Supabase configuration:

```env
# Enable full authentication mode
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development and Testing

#### Testing Simple Registration Mode
```bash
# Remove or comment out Supabase configuration
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...

npm run dev  # Simple registration mode active
```

#### Testing Full Authentication Mode
```bash
# Enable authentication with proper Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

npm run dev  # Full authentication mode active
```

### Server-Side Implementation

## 🎨 Customization

### Board Sizes
The `Board.svelte` component supports two size variants:
- `normal` - Compact view for card players (24px circles, 11px fonts)
- `large` - Enhanced view for operators (48px circles, 22px fonts, increased spacing)

### Game Access Flow
The system provides direct, intelligent routing based on user role and game state:
- **Board Owners**: Automatic redirect to board interface with extraction privileges
- **New Game Players**: Card selection modal (`CardSelectionModal.svelte`) for choosing card count (1-6)
- **Active Game Players**: Direct access to player interface, preserving existing cards
- **Ownership Verification**: Server-side validation ensures only game creators can access board controls

### User Registration Components
- **Simple Mode**: `UserRegistration.svelte` for name-based registration
- **Auth Mode**: `AuthButton.svelte` for magic link authentication
- **Persistent State**: Registration data maintained across sessions

#### Magic Link Processing
Server handles magic link verification and cookie management:

```typescript
// src/routes/api/auth/verify/+server.ts
export async function GET({ url, cookies }) {
    const accessToken = url.searchParams.get('access_token');

    // Validate token with Supabase
    const user = await getSupabaseUser(accessToken);
    if (user) {
        // Set secure HTTP-only cookie
        cookies.set('sb-access-token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });
    }

    throw redirect(302, '/');
}
```

### Security Features

#### Client-Side Protection
- **No Credential Exposure**: Vite configuration prevents leaking `SUPABASE_` environment variables
- **Cookie-Only Auth**: Authentication state synchronized via HTTP-only cookies
- **Dynamic Configuration**: Server dynamically imports credentials, never exposing them to the client

#### Server-Side Validation
- **Every Request**: JWT validation on all protected route accesses
- **Supabase Integration**: Direct validation against Supabase auth API
- **Automatic Redirects**: Unauthenticated users redirected to login page
- **Session Management**: Secure cookie handling with proper expiration

### API Integration

The system integrates with the Tombola API server using different approaches based on mode:

#### Simple Registration Mode
```typescript
// API requests with user identity
headers: {
    'X-Client-ID': globalClientId,  // Global user registration ID
    'Content-Type': 'application/json'
}
```

#### Full Authentication Mode
```typescript
// API requests with authentication
headers: {
    'Authorization': `Bearer ${jwtToken}`,  // User authentication
    'X-Client-ID': gameClientId,            // Game participation
    'Content-Type': 'application/json'
}
```

### Benefits

- **🚀 Quick Start**: Simple registration works immediately without setup
- **🔧 Flexibility**: Optional authentication for enhanced security when needed
- **🛡️ Security**: Server-side validation in auth mode prevents bypass
- **� Identity**: Persistent user identity across games and sessions
- **🎮 Ownership**: Clear board ownership model with access control
- **📱 UX**: Intuitive registration flow with minimal friction
- **🔒 Privacy**: No credentials exposed in simple mode, secure storage in auth mode

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

## 📚 Documentation

- **[FLOWS.md](docs/FLOWS.md)** - Comprehensive sequence diagrams showing all authentication, registration, and game process flows
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical architecture and component overview

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
