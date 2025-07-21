import type {
  Client,
  Card,
  CardAssignment,
  ScoreCard,
  GameStatus,
  Board,
  Pouch,
  RegistrationResponse,
  GenerateCardsResponse,
  ExtractionResponse,
  ApiError
} from './types.js';

const API_BASE_URL = 'http://127.0.0.1:3000';

class TombolaApiClient {
  private clientId: string | null = null;

  setClientId(clientId: string) {
    this.clientId = clientId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

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

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error JSON, use the default message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Make sure the Tombola API server is running on http://127.0.0.1:3000');
      }
      throw error;
    }
  }  // Client Registration
  async register(name: string, clientType: 'player' | 'admin' | 'viewer' = 'player', nocard?: number): Promise<RegistrationResponse> {
    const body: any = { name, client_type: clientType };
    if (nocard !== undefined) {
      body.nocard = nocard;
    }

    return this.request<RegistrationResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async getClientByName(name: string): Promise<Client> {
    return this.request<Client>(`/client/${encodeURIComponent(name)}`);
  }

  async getClientById(clientId: string): Promise<Client> {
    return this.request<Client>(`/clientinfo/${encodeURIComponent(clientId)}`);
  }

  // Card Management
  async generateCards(count: number = 6): Promise<GenerateCardsResponse> {
    return this.request<GenerateCardsResponse>('/generatecardsforme', {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  }

  async listAssignedCards(): Promise<{ cards: CardAssignment[] }> {
    return this.request<{ cards: CardAssignment[] }>('/listassignedcards');
  }

  async getAssignedCard(cardId: string): Promise<Card> {
    return this.request<Card>(`/getassignedcard/${encodeURIComponent(cardId)}`);
  }

  // Game State
  async getBoard(): Promise<Board> {
    return this.request<Board>('/board');
  }

  async getPouch(): Promise<Pouch> {
    return this.request<Pouch>('/pouch');
  }

  async getScoreMap(): Promise<ScoreCard> {
    return this.request<ScoreCard>('/scoremap');
  }

  async getStatus(): Promise<GameStatus> {
    return this.request<GameStatus>('/status');
  }

  async getRunningGameId(): Promise<{ game_id: string; created_at: string; created_at_timestamp: any }> {
    return this.request<{ game_id: string; created_at: string; created_at_timestamp: any }>('/runninggameid');
  }

  // Board Client Operations (only for authorized clients)
  async extractNumber(): Promise<ExtractionResponse> {
    return this.request<ExtractionResponse>('/extract', {
      method: 'POST',
      headers: {
        'X-Client-ID': '0000000000000000' // Board client ID
      }
    });
  }

  async newGame(): Promise<any> {
    return this.request<any>('/newgame', {
      method: 'POST',
      headers: {
        'X-Client-ID': '0000000000000000' // Board client ID
      }
    });
  }

  async dumpGame(): Promise<any> {
    return this.request<any>('/dumpgame', {
      method: 'POST',
      headers: {
        'X-Client-ID': '0000000000000000' // Board client ID
      }
    });
  }
}

export const tombolaApi = new TombolaApiClient();
