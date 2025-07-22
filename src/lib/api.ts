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
  NewGameResponse
} from './types.js';

// Build API base URL from environment variables
const API_HOST = import.meta.env.VITE_API_HOST || '127.0.0.1';
const API_PORT = import.meta.env.VITE_API_PORT || '3000';
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || 'http';
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// Debug logging helper
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[Tombola API] ${message}`, data || '');
  }
};

class TombolaApiClient {
  private clientId: string | null = null;
  private gameId: string | null = null;

  constructor() {
    console.log(`[Tombola API] Initialized with endpoint: ${API_BASE_URL}`);
    if (DEBUG_MODE) {
      console.log(`[Tombola API] Debug mode enabled`);
      console.log(`[Tombola API] Configuration:`, {
        host: API_HOST,
        port: API_PORT,
        protocol: API_PROTOCOL
      });
    }
  }

  setClientId(clientId: string) {
    this.clientId = clientId;
  }

  setGameId(gameId: string) {
    this.gameId = gameId;
  }

  getGameId(): string | null {
    return this.gameId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    debugLog(`Making ${options.method || 'GET'} request to: ${url}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.clientId && !headers['X-Client-ID']) {
      headers['X-Client-ID'] = this.clientId;
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
      method: 'POST',
      headers: {
        'X-Client-ID': '0000000000000000' // Board client ID
      }
    });
  }

  // Client Registration (Game-specific)
  async register(name: string, clientType: 'player' | 'admin' | 'viewer' = 'player', nocard?: number): Promise<RegistrationResponse> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before registering');
    }

    const body: any = { name, client_type: clientType };
    if (nocard !== undefined) {
      body.nocard = nocard;
    }

    return this.request<RegistrationResponse>(`/${this.gameId}/register`, {
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

  // Board Client Operations (Game-specific, only for authorized clients)
  async extractNumber(): Promise<ExtractionResponse> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before extracting number');
    }

    return this.request<ExtractionResponse>(`/${this.gameId}/extract`, {
      method: 'POST',
      headers: {
        'X-Client-ID': '0000000000000000' // Board client ID
      }
    });
  }

  async dumpGame(): Promise<any> {
    if (!this.gameId) {
      throw new Error('Game ID must be set before dumping game');
    }

    return this.request<any>(`/${this.gameId}/dumpgame`, {
      method: 'POST',
      headers: {
        'X-Client-ID': '0000000000000000' // Board client ID
      }
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
