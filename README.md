# Tombola Web Client

A modern, responsive web interface for the Tombola game, built with **SvelteKit 5** and **TypeScript**. This client supports the **multi-game architecture** with game discovery, creation, and management capabilities for both card players and board operators.

## 🎯 Features

### 🔐 Advanced Authentication System
- 🪄 **Magic Link Authentication**: Passwordless login via email (no passwords required)
- 🔒 **Server-Side JWT Validation**: Secure route protection with server-side token verification
- 👤 **User Identity**: Display authenticated user's name or email in the header
- 🔄 **Persistent Sessions**: Automatic token storage and validation across browser sessions
- 📧 **Email-based Flow**: Simple authentication workflow using magic links sent to email
- ⚡ **Real-time Auth State**: Dynamic UI that adapts based on authentication status
- 🚀 **Supabase Integration**: Direct REST API integration with Supabase authentication (no SDK required)
- �️ **Route Protection**: `/player` and `/board` routes protected when authentication is enabled
- 🍪 **Cookie-based Sessions**: JWT tokens stored in HTTP cookies for server-side validation
- 🔀 **Optional Authentication**: System works seamlessly with auth enabled or completely disabled
- 🚫 **Client-Side Security**: No sensitive credentials exposed to browser (server-side only)

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

### 1. Configure Server Connection and Authentication

#### Server-Side Authentication Configuration
Copy the example configuration file and customize for your environment:
```bash
copy .env.example .env
```

Update the `.env` file with your server configuration:
```env
# Server endpoint configuration
API_HOST=127.0.0.1
API_PORT=3000
API_PROTOCOL=http

# Optional: Enable debug logging
DEBUG_MODE=false

# Supabase Configuration (for authentication)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Authentication Modes

**🔒 With Authentication (Default)**
- Uncomment the Supabase configuration lines
- `/player` and `/board` routes require valid JWT tokens
- Server-side validation protects all protected routes
- Magic link authentication via email

**🚪 Without Authentication (Optional)**
- Comment out or remove `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- All routes become publicly accessible
- No login required
- Perfect for local development or public instances

```env
# To disable authentication, comment out these lines:
#SUPABASE_URL=https://your-project-ref.supabase.co
#SUPABASE_ANON_KEY=your-supabase-anon-key
```

**🔐 Security Features:**
- 🛡️ Server-side JWT token validation for protected routes
- 🍪 HTTP-only cookies for secure session management
- 🚫 No sensitive credentials exposed to browser
- ⚡ Automatic token refresh and validation
- 🔀 Graceful degradation when authentication is disabled
**🚀 Authentication Features:**
- ✅ Magic link authentication (passwordless)
- ✅ JWT token management with automatic refresh
- ✅ User profile access
- ✅ Session management with HTTP-only cookies
- ✅ Server-side route protection
- ✅ Direct REST API calls (no Supabase SDK required)
- ✅ Complete client-side credential isolation

**🛡️ Route Protection:**
When authentication is enabled, the following routes require valid JWT tokens:
- `/player?gameId={game_id}` - Protected for authenticated card players
- `/board?gameId={game_id}` - Protected for authenticated board operators
- `/` - Always accessible (handles authentication flow)

When authentication is disabled, all routes are publicly accessible.

Edit the API configuration to match your game server setup:
```env
API_HOST=127.0.0.1
API_PORT=3000
API_PROTOCOL=http
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

## 🔐 Authentication System

The Tombola Web Client implements a **comprehensive server-side authentication system** with optional Supabase integration. The system is designed with security as a priority, featuring server-side JWT validation and zero client-side credential exposure.

### Architecture Overview

#### 🛡️ Security-First Design
- **Server-Side Rendering (SSR)**: All authentication checks happen server-side
- **JWT Token Validation**: Tokens validated against Supabase on every protected route access
- **HTTP-Only Cookies**: Session tokens stored securely, inaccessible to JavaScript
- **Zero Client Exposure**: No authentication credentials or configuration exposed to the browser
- **Route Protection**: Server-side enforcement for `/player` and `/board` routes when authentication is enabled

#### 🔄 Authentication Flow
1. **Email Input**: User enters email on landing page (server-rendered form)
2. **Magic Link**: Server sends magic link via Supabase API
3. **Token Verification**: Magic link processed server-side with JWT validation
4. **Session Creation**: Valid tokens stored in HTTP-only cookies
5. **Route Access**: Protected routes validate JWT server-side before rendering

#### 🎯 Dual Identity System
The system maintains two separate identity concepts:

**🔐 User Authentication (JWT)**
- **Purpose**: User identity and session management
- **Implementation**: Server-side JWT validation with Supabase
- **Scope**: Controls access to protected routes when authentication is enabled
- **Storage**: HTTP-only cookies for security

**🎮 Game Client ID**
- **Purpose**: Game participation and state tracking
- **Implementation**: Dynamic 16-character hex IDs for players, fixed ID for board operators
- **Scope**: Game-specific registration and API communication
- **Storage**: Client-side for game functionality

### Configuration Options

#### Optional Authentication
Authentication can be completely disabled by omitting Supabase configuration:

```env
# Authentication disabled - all routes accessible
# (no SUPABASE_ variables configured)
```

#### Supabase Authentication
```env
# Required for authentication
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - public key for client-side features (if needed)
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Server-Side Implementation

#### Protected Route Enforcement
Routes `/player` and `/board` include server-side JWT validation:

```typescript
// src/routes/player/+page.server.ts
export async function load({ cookies, url }) {
    // Check if authentication is enabled
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const token = cookies.get('sb-access-token');

        // Validate JWT with Supabase
        const user = await getSupabaseUser(token);
        if (!user) {
            throw redirect(302, '/');
        }

        return { user };
    }
    // Authentication disabled - allow access
    return {};
}
```

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

When authentication is enabled, the system integrates with the Tombola API server using dual headers:

```typescript
// Authenticated API request
headers: {
    'Authorization': `Bearer ${jwtToken}`,     // User authentication
    'X-Client-ID': clientId                   // Game participation
}
```

### Development and Testing

#### Testing Without Authentication
```bash
# Disable authentication by removing/commenting Supabase config
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

npm run dev  # All routes accessible without authentication
```

#### Testing With Authentication
```bash
# Enable authentication with proper Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

npm run dev  # Routes protected, magic link authentication required
```

### Benefits

- **🛡️ Security**: Server-side validation prevents client-side authentication bypass
- **🔒 Privacy**: Zero credential exposure to browser or client-side code
- **⚡ Performance**: Efficient JWT validation with proper caching
- **🔧 Flexibility**: Optional authentication system - can be completely disabled
- **📱 UX**: Seamless magic link flow with automatic redirects
- **🎯 Separation**: Clean separation between user identity and game participation

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
