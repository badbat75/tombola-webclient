# Tombola Web Client - Architecture Documentation

## Overview

The Tombola Web Client is a modern, responsive web application built with **SvelteKit 5** and **TypeScript**. It serves as the frontend interface for the Tombola/Bingo game system, communicating with a Rust-based backend API server. The architecture is designed for flexibility, supporting both simple name-based registration and full authentication workflows.

## Technology Stack

### Frontend Framework
- **SvelteKit 5**: Full-stack web framework with SSR/CSR capabilities
- **TypeScript**: Type-safe development with comprehensive type definitions
- **Vite**: Modern build tool and development server
- **CSS Custom Properties**: Design system with consistent styling variables

### Deployment & Hosting
- **Adapter Auto**: Automatic deployment adapter selection
- **Service Worker**: Basic caching for static assets (`static/sw.js`)
- **Progressive Web App**: Manifest configuration for PWA capabilities

## Project Structure

```
src/
├── lib/                          # Shared libraries and utilities
│   ├── components/              # Reusable Svelte components
│   │   ├── Board.svelte        # Game board display component
│   │   ├── Card.svelte         # Individual tombola card component
│   │   ├── GameSelector.svelte # Game selection and creation
│   │   ├── GameInfoSidebar.svelte # Player information display
│   │   ├── LeaderboardSidebar.svelte # Achievement rankings
│   │   └── ...                 # Additional UI components
│   ├── stores/                 # Svelte stores for state management
│   │   ├── auth.ts            # Authentication state management
│   │   └── userRegistration.ts # User registration state
│   ├── api.ts                 # API client for backend communication
│   ├── auth-client.ts         # Authentication client utilities
│   ├── gameStore.svelte.ts    # Game state management (reactive)
│   └── types.ts               # TypeScript type definitions
├── routes/                     # SvelteKit routing system
│   ├── +layout.svelte         # Root layout component
│   ├── +layout.server.ts      # Server-side layout configuration
│   ├── +page.svelte           # Home page (game selection)
│   ├── api/                   # API endpoints (SSR)
│   │   └── auth/              # Authentication endpoints
│   ├── board/                 # Board operator interface
│   ├── player/                # Card player interface
│   └── magic-link/            # Authentication callback
└── app.css                    # Global styles and CSS custom properties
```

## Rendering Strategy (SSR/CSR)

### Server-Side Rendering (SSR)
The application uses SvelteKit's hybrid rendering approach:

#### Layout Server Functions
- **`+layout.server.ts`**: Determines authentication configuration server-side
- **Purpose**: Checks environment variables to enable/disable auth features
- **Security**: Prevents credential exposure to client-side code

#### Page Server Functions
- **`+page.server.ts`** files in `/board` and `/player` routes
- **Authentication Enforcement**: Server-side JWT validation for protected routes
- **Route Protection**: Redirects unauthenticated users when auth is enabled
- **Token Validation**: Direct Supabase API validation before page rendering

#### API Endpoints (`src/routes/api/`)
- **Magic Link**: `/api/auth/magic-link/+server.ts` - Sends authentication emails
- **Token Verification**: `/api/auth/verify/+server.ts` - Validates JWT tokens
- **Configuration**: `/api/auth/config/+server.ts` - Exposes auth configuration
- **Logout**: `/api/auth/logout/+server.ts` - Handles session termination

### Client-Side Rendering (CSR)
Interactive features and real-time updates:

#### Component Interactivity
- **Game State Management**: Reactive stores with `$state()` runes
- **Real-time Updates**: Auto-refresh intervals for game synchronization
- **Local Storage Integration**: Persistent user preferences and session data
- **Dynamic Routing**: Client-side navigation between game modes

#### Progressive Enhancement
- **Works Without JavaScript**: Basic functionality available with SSR
- **Enhanced Experience**: Full interactivity when JavaScript is enabled
- **Offline Capability**: Service worker caching for static assets

## Page Architecture

### Home Page (`/`)
- **Purpose**: Game discovery and mode selection
- **Authentication**: Adaptive UI based on server configuration
- **Components**: GameSelector, UserRegistration/AuthButton, HomeFooter
- **Routing Logic**: Intelligent game joining with owner detection

### Player Interface (`/player?gameId={id}`)
- **Purpose**: Card-based gameplay for regular players
- **Protection**: Optional authentication enforcement (server-configured)
- **Features**: Multi-card management, real-time scoring, achievement tracking
- **Layout**: Two-column design (cards + board/leaderboard)

### Board Interface (`/board?gameId={id}`)
- **Purpose**: Number extraction and game management
- **Authorization**: Game creator/owner privileges required
- **Features**: Large board display, extraction controls, player monitoring
- **Real-time**: Live updates for all connected players

### Magic Link Handler (`/magic-link`)
- **Purpose**: Authentication callback processing
- **Flow**: Token extraction → server validation → redirect
- **Security**: Server-side token verification before client access

### Authentication Flow
- **Entry Point**: Email input on home page
- **Process**: Magic link → server validation → cookie storage → access granted
- **Fallback**: Simple name-based registration when auth is disabled

## API Integration

### Backend Communication
The client communicates with a Rust-based API server through a centralized API client:

#### API Client (`src/lib/api.ts`)
```typescript
class TombolaApiClient {
  // Environment-based configuration
  private baseUrl: string = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

  // Authentication headers
  private addAuthHeaders(headers: Record<string, string>): void {
    // JWT token integration for authenticated requests
    // Client ID management for game-specific operations
  }
}
```

#### Endpoint Categories

**Global Endpoints**
- `/register` - Global user registration
- `/gameslist` - Available games discovery
- `/newgame` - Game creation (board owners)
- `/clientinfo/{id}` - Client information lookup

**Game-Specific Endpoints**
- `/{gameId}/join` - Join specific game
- `/{gameId}/status` - Game status and metadata
- `/{gameId}/players` - Player information
- `/{gameId}/board` - Current board state
- `/{gameId}/extract` - Number extraction (board only)
- `/{gameId}/generatecards` - Card generation
- `/{gameId}/scoremap` - Achievement tracking

### Environment Configuration
```typescript
// Vite configuration exposes safe variables to client
define: {
  'import.meta.env.API_HOST': JSON.stringify(env.API_HOST),
  'import.meta.env.API_PORT': JSON.stringify(env.API_PORT),
  'import.meta.env.API_PROTOCOL': JSON.stringify(env.API_PROTOCOL),
}
```

## State Management

### Game State (`src/lib/gameStore.svelte.ts`)
Reactive state management using Svelte 5's runes system:

```typescript
interface GameState {
  isConnected: boolean;      // API server connection status
  isRegistered: boolean;     // Game registration status
  clientId: string | null;   // Game-specific client identifier
  playerName: string;        // User display name
  cards: Card[];            // Player's assigned cards
  board: Board;             // Current game board state
  pouch: Pouch;             // Remaining numbers
  scoreCard: ScoreCard;     // Achievements and scores
  gameStatus: GameStatus;   // Game metadata
  gameId: string | null;    // Current game identifier
  error: string | null;     // Error state
}
```

#### State Synchronization
- **Auto-refresh**: Periodic API calls to maintain consistency
- **Error Handling**: Automatic reconnection on connection loss
- **Persistence**: localStorage integration for session continuity
- **Reactivity**: Automatic UI updates on state changes

### Authentication State (`src/lib/stores/auth.ts`)
Manages user authentication and session state:

```typescript
interface AuthState {
  state: 'loading' | 'authenticated' | 'unauthenticated' | 'magic-link-sent';
  user: AuthUser | null;
  token: string | null;
}
```

### User Registration State (`src/lib/stores/userRegistration.ts`)
Handles simple registration mode:

```typescript
interface UserRegistrationState {
  isRegistered: boolean;
  userName: string | null;
  clientId: string | null;
}
```

## Security Architecture

### Authentication Modes

#### Simple Registration Mode (Default)
- **Client-side**: Name-based registration with localStorage persistence
- **Server Requirements**: None - works out of the box
- **Security Level**: Basic identification, suitable for casual gaming
- **Implementation**: Direct API communication with name as identifier

#### Full Authentication Mode (Optional)
- **Server-side**: JWT validation with Supabase integration
- **Client Protection**: No credentials exposed to browser
- **Session Management**: HTTP-only cookies with secure storage
- **Route Protection**: Server-side enforcement on protected routes

### Security Measures

#### Server-Side Protection
```typescript
// Page server load functions validate tokens
export const load: PageServerLoad = async ({ cookies }) => {
  const authToken = cookies.get('supabase-auth-token');
  if (!authToken) {
    throw redirect(302, '/?error=auth_required');
  }

  // Validate with Supabase API
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};
```

#### Client-Side Protection
- **Environment Variables**: Vite configuration prevents credential leakage
- **Cookie Security**: HTTP-only, SameSite, secure flags
- **Token Handling**: Automatic refresh and secure storage
- **CORS Configuration**: Proper API endpoint protection

## Component Architecture

### Design System
CSS custom properties provide consistent styling:

```css
:root {
  /* Brand colors and gradients */
  --primary-gradient: linear-gradient(135deg, #4a90e2 0%, #2c5aa0 100%);
  --success-gradient: linear-gradient(135deg, #10b981, #059669);

  /* Typography system */
  --font-family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-base: 1rem;
  --font-weight-semibold: 600;

  /* Spacing and layout */
  --spacing-base: 1rem;
  --border-radius: 6px;
  --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```

### Component Hierarchy

#### Layout Components
- **`+layout.svelte`**: Root layout with header and navigation
- **`AuthButton.svelte`**: Authentication controls
- **`UserRegistration.svelte`**: Simple registration form
- **`HomeFooter.svelte`**: Status information footer

#### Game Components
- **`GameSelector.svelte`**: Game discovery and joining
- **`Board.svelte`**: Number display with extraction highlighting
- **`Card.svelte`**: Individual tombola card with achievement tracking
- **`GameInfoSidebar.svelte`**: Real-time player and game information
- **`LeaderboardSidebar.svelte`**: Achievement rankings and scores

#### Utility Components
- **`CardSelectionModal.svelte`**: Card count selection for new games
- **`GameFooter.svelte`**: Game state and connection information
- **`ScoreBoard.svelte`**: Achievement tracking and scoring display

## Performance Considerations

### Optimization Strategies
- **Component Lazy Loading**: Dynamic imports for large components
- **API Batching**: Efficient request grouping for related data
- **State Optimization**: Minimal reactive updates with targeted subscriptions
- **Asset Optimization**: Service worker caching for static resources

### Real-time Updates
- **Polling Strategy**: Configurable intervals (2-5 seconds) based on context
- **Error Recovery**: Automatic reconnection with exponential backoff
- **Bandwidth Management**: Efficient payload sizes with focused data requests

### Mobile Responsiveness
- **Responsive Grids**: CSS Grid and Flexbox for adaptive layouts
- **Touch Optimization**: Proper touch targets and gesture support
- **Performance**: Optimized for mobile networks and devices

## Development Workflow

### Build System
```bash
npm run dev      # Development server with HMR
npm run build    # Production build with optimization
npm run preview  # Preview production build locally
npm run check    # TypeScript and Svelte validation
```

### Environment Configuration
```env
# API Configuration
API_HOST=127.0.0.1
API_PORT=3000
API_PROTOCOL=http
DEBUG_MODE=true

# Authentication (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Development Tools
- **TypeScript**: Comprehensive type checking and IntelliSense
- **Svelte Check**: Component validation and error detection
- **Vite HMR**: Hot module replacement for rapid development
- **ESLint Integration**: Code quality and consistency enforcement

## Deployment Architecture

### Build Output
- **Static Assets**: Optimized CSS, JavaScript, and images
- **Server Functions**: SSR endpoints for authentication and API proxying
- **Service Worker**: Offline capability and caching strategy
- **Progressive Enhancement**: Graceful degradation for limited environments

### Hosting Considerations
- **Adapter Auto**: Automatic platform detection and optimization
- **Environment Variables**: Secure server-side configuration
- **CORS Configuration**: Proper API communication setup
- **SSL/HTTPS**: Required for authentication and secure communication

This architecture provides a robust, scalable foundation for the Tombola web client while maintaining flexibility for different deployment scenarios and authentication requirements.
