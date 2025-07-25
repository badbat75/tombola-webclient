// Tombola API Types
export type ClientType = 'player' | 'board';

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
  closed_at?: string;
  owner: string;
  players: string;
  cards: string;
  numbers_extracted: number;
  scorecard: number;
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
  created_at: string;
  client_count: number;
  extracted_numbers: number;
}

export interface GameListResponse {
  games: GameInfo[];
}

export interface NewGameResponse {
  message: string;
  game_id: string;
  created_at: string;
  board_owner?: string; // Client ID of the game creator
}

// Players types
export interface Player {
  client_id: string;
  client_type: string;
  card_count: number;
}

export interface PlayersResponse {
  game_id: string;
  total_players: number;
  total_cards: number;
  players: Player[];
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
