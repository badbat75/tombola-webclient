// Tombola API Types
export type ClientType = 'player' | 'admin' | 'viewer';

export interface Card {
  card_id: string;
  card_data: (number | null)[][];
}

export interface CardAssignment {
  card_id: string;
  assigned_to: string;
}

export interface ScoreAchievement {
  client_id: string;
  card_id: string;
  numbers: number[];
}

export interface ScoreCard {
  published_score: number;
  score_map: Record<string, ScoreAchievement[]>;
}

export interface GameStatus {
  status: string;
  game_id: string;
  created_at: string;
  numbers_extracted: number;
  scorecard: number;
  server: string;
}

export interface Board {
  numbers: number[];
  marked_numbers: number[];
}

export interface Pouch {
  numbers: number[];
}

export interface RegistrationResponse {
  client_id: string;
  message: string;
}

export interface GenerateCardsResponse {
  cards: Card[];
  message: string;
}

export interface ExtractionResponse {
  success: boolean;
  extracted_number: number;
  numbers_remaining: number;
  total_extracted: number;
  message: string;
}

export interface ApiError {
  error: string;
}

// Multi-game types
export interface GameInfo {
  game_id: string;
  status: string;
  start_date: string;
  close_date: string | null;
}

export interface GameListResponse {
  games: GameInfo[];
  statistics: {
    active_games: number;
    closed_games: number;
    new_games: number;
  };
  success: boolean;
  total_games: number;
}

export interface NewGameResponse {
  message: string;
  game_id: string;
  created_at: string;
}

// Game state
export interface GameState {
  isConnected: boolean;
  isRegistered: boolean;
  clientId: string | null;
  playerName: string;
  cards: Card[];
  board: Board;
  pouch: Pouch;
  scoreCard: ScoreCard;
  gameStatus: GameStatus | null;
  gameId: string | null;
  error: string | null;
}
