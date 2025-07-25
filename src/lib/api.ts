import type {
  Card,
  CardAssignment,
  ScoreCard,
  GameStatus,
  Board,
  Pouch,
  RegistrationResponse,
  GenerateCardsResponse,
  ExtractionResponse,
  ApiError,
  GameListResponse,
  GameInfo,
  NewGameResponse,
  PlayersResponse
} from './types.js';
import { authStore } from './stores/auth.js';
import { get } from 'svelte/store';

// Build API base URL from environment variables
const API_HOST = import.meta.env.API_HOST || '127.0.0.1';
const API_PORT = import.meta.env.API_PORT || '3000';
const API_PROTOCOL = import.meta.env.API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// Debug logging helper
const DEBUG_MODE = import.meta.env.DEBUG_MODE === 'true' || true; // Enable debug for now
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    // Debug logging disabled in production
  }
};

class TombolaApiClient {
  private clientId: string | null = null;
  private gameId: string | null = null;

  constructor() {
    // Try to restore client ID from localStorage on initialization
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedClientId = localStorage.getItem('tombola-client-id');
      if (storedClientId) {
        debugLog(`Restoring client ID from localStorage: ${storedClientId}`);
        this.clientId = storedClientId;
      }
    }
  }

  setClientId(clientId: string) {
    debugLog(`Setting client ID: ${this.clientId} -> ${clientId}`);
    this.clientId = clientId;

    // Always persist to localStorage when setting client ID
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('tombola-client-id', clientId);
      debugLog(`Persisted client ID to localStorage: ${clientId}`);
    }
  }

  setGameId(gameId: string) {
    debugLog(`Setting game ID: ${this.gameId} -> ${gameId}`);
    this.gameId = gameId;
  }

  // Clear all cached state
  clearState() {
    debugLog(`Clearing API client state - ClientID: ${this.clientId}, GameID: ${this.gameId}`);
    this.clientId = null;
    this.gameId = null;

    // Only clear localStorage if explicitly requested
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('tombola-client-id');
      localStorage.removeItem('tombola-user-name');
      debugLog('Cleared client data from localStorage');
    }
  }

  // Clear only game-specific state, preserve client ID
  clearGameState() {
    debugLog(`Clearing game state - keeping ClientID: ${this.clientId}`);
    this.gameId = null;
  }

  getGameId(): string | null {
    return this.gameId;
  }

  getCurrentClientId(): string | null {
    return this.clientId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    debugLog(`Making ${options.method || 'GET'} request to: ${url}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add JWT token if authenticated
    const authState = get(authStore);
    if (authState.state === 'authenticated' && authState.token) {
      headers['Authorization'] = `Bearer ${authState.token}`;
      debugLog('Added JWT token to request headers');
    }

    // Ensure client ID is available - try to restore from localStorage if missing
    if (!this.clientId) {
      this.initializeFromStorage();
    }

    if (this.clientId && !headers['X-Client-ID']) {
      headers['X-Client-ID'] = this.clientId;
      debugLog(`Added Client-ID header: ${this.clientId}`);
    } else if (headers['X-Client-ID']) {
      debugLog(`Using existing Client-ID header: ${headers['X-Client-ID']}`);
    } else {
      debugLog('No Client-ID header available');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors'
      });

      debugLog(`Response from ${endpoint}:`, { status: response.status, ok: response.ok });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error JSON, use the default message
        }
        debugLog(`API Error for ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = `Network error: Unable to connect to server. Make sure the Tombola API server is running on ${API_BASE_URL}`;
        debugLog(`Network error for ${endpoint}:`, error);
        throw new Error(networkError);
      }
      debugLog(`Request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Game Management (Global endpoints)
  async getGamesList(): Promise<GameListResponse> {
    return this.request<GameListResponse>('/gameslist');
  }

  async createNewGame(): Promise<NewGameResponse> {
    return this.request<NewGameResponse>('/newgame', {
      method: 'POST'
    });
  }

  async getGameStatus(gameId: string): Promise<GameStatus> {
    return this.request<GameStatus>(`/${gameId}/status`);
  }

  // Global Client Registration
  async globalRegister(name: string, clientType: 'player' | 'board' = 'player'): Promise<RegistrationResponse> {
    const body = { name, client_type: clientType };

    return this.request<RegistrationResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Game-specific Client Registration (Join)
  async joinGame(name: string, clientType: 'player' | 'board' = 'player', nocard?: number, email?: string): Promise<RegistrationResponse> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before joining game');
    }

    const body: any = { name, client_type: clientType };
    if (nocard !== undefined) {
      body.nocard = nocard;
    }
    if (email !== undefined) {
      body.email = email;
    }

    return this.request<RegistrationResponse>(`/${this.gameId}/join`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Card Management (Game-specific)
  async generateCards(count: number = 6): Promise<GenerateCardsResponse> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before generating cards');
    }

    return this.request<GenerateCardsResponse>(`/${this.gameId}/generatecards`, {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  }

  async listAssignedCards(): Promise<{ cards: CardAssignment[] }> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before listing cards');
    }

    return this.request<{ cards: CardAssignment[] }>(`/${this.gameId}/listassignedcards`);
  }

  async getAssignedCard(cardId: string): Promise<Card> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before getting card');
    }

    return this.request<Card>(`/${this.gameId}/getassignedcard/${encodeURIComponent(cardId)}`);
  }

  // Game State (Game-specific)
  async getBoard(): Promise<Board> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before getting board');
    }

    return this.request<Board>(`/${this.gameId}/board`);
  }
  async getPouch(): Promise<Pouch> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before getting pouch');
    }

    return this.request<Pouch>(`/${this.gameId}/pouch`);
  }

  async getScoreMap(): Promise<ScoreCard> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before getting score map');
    }

    return this.request<ScoreCard>(`/${this.gameId}/scoremap`);
  }

  async getStatus(): Promise<GameStatus> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before getting status');
    }

    return this.request<GameStatus>(`/${this.gameId}/status`);
  }

  async getPlayers(): Promise<PlayersResponse> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before getting players');
    }

    return this.request<PlayersResponse>(`/${this.gameId}/players`);
  }

  // Board Client Operations (Game-specific, only for authorized clients)
  async extractNumber(): Promise<ExtractionResponse> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before extracting number');
    }

    return this.request<ExtractionResponse>(`/${this.gameId}/extract`, {
      method: 'POST'
    });
  }

  async dumpGame(): Promise<any> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before dumping game');
    }

    return this.request<any>(`/${this.gameId}/dumpgame`, {
      method: 'POST'
    });
  }

  // Client Information (Global endpoints - try to use documented endpoints)
  async getClientById(clientId: string): Promise<{client_id: string, name: string, client_type: string, registered_at: string}> {
    return this.request<{client_id: string, name: string, client_type: string, registered_at: string}>(`/clientinfo/${encodeURIComponent(clientId)}`);
  }

  async getClientByName(name: string): Promise<{client_id: string, name: string, client_type: string, registered_at: string}> {
    return this.request<{client_id: string, name: string, client_type: string, registered_at: string}>(`/clientinfo?name=${encodeURIComponent(name)}`);
  }
}

export const tombolaApi = new TombolaApiClient();
