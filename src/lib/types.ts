// Tombola API Types
export type ClientType = 'player' | 'admin' | 'viewer';

export interface Client {
  client_id: string;
  name: string;
  client_type: ClientType;
  registered_at: string;
}

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
  error: string | null;
}
