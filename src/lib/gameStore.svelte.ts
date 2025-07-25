import { tombolaApi } from './api.js';
import type { GameState, Card, Board, Pouch, ScoreCard, GameStatus } from './types.js';

// Initial game state
const initialState: GameState = {
  isConnected: false,
  isRegistered: false,
  clientId: null,
  playerName: '',
  cards: [],
  board: { numbers: [], marked_numbers: [] },
  pouch: { numbers: [] },
  scoreCard: { published_score: 0, score_map: {} },
  gameStatus: null,
  gameId: null,
  error: null
};

// Store previous session data for re-registration
let previousPlayerName = '';

// Client name cache - maps client_id to player name
const clientNameCache = new Map<string, string>();

// Sequential player numbering for board view (when names aren't available)
const clientNumberCache = new Map<string, number>();
let nextPlayerNumber = 1;

// Create reactive state
export const gameState = $state<GameState>({ ...initialState });

// Initialize the API client with stored state
function initializeApiClient() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedClientId = localStorage.getItem('tombola-client-id');
    const storedGameId = localStorage.getItem('tombola-game-id');

    if (storedClientId) {
      tombolaApi.setClientId(storedClientId);
      gameState.clientId = storedClientId;

      const storedPlayerName = localStorage.getItem('tombola-user-name');
      if (storedPlayerName) {
        gameState.playerName = storedPlayerName;
        gameState.isRegistered = true;
      }
    }

    if (storedGameId) {
      tombolaApi.setGameId(storedGameId);
      gameState.gameId = storedGameId;
    }
  }
}

// Initialize on module load
initializeApiClient();

// Game actions
export const gameActions = {
  async setGameId(gameId: string): Promise<boolean> {
    try {
      tombolaApi.setGameId(gameId);
      gameState.gameId = gameId;
      gameState.error = null;

      // Clear client name cache when switching games
      clientNameCache.clear();
      clientNumberCache.clear();
      nextPlayerNumber = 1;

      return true;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Failed to set game ID';
      return false;
    }
  },

  async connect(): Promise<boolean> {
    try {
      if (!gameState.gameId) {
        throw new Error('Game ID must be set before connecting');
      }

      const status = await tombolaApi.getStatus();
      gameState.gameStatus = status;
      gameState.isConnected = true;
      gameState.error = null;
      return true;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Failed to connect';
      gameState.isConnected = false;
      return false;
    }
  },

  async register(playerName: string, cardCount: number = 6): Promise<boolean> {
    try {
      const response = await tombolaApi.joinGame(playerName, 'player', cardCount);

      gameState.clientId = response.client_id;
      gameState.playerName = playerName;
      gameState.isRegistered = true;
      gameState.error = null;

      // Store player name for future re-registration
      previousPlayerName = playerName;

      // Store registration info in localStorage for persistence across page loads
      localStorage.setItem('tombola-client-id', response.client_id);
      localStorage.setItem('tombola-user-name', playerName);

      // Cache the client name for leaderboard display
      clientNameCache.set(response.client_id, playerName);

      // Set client ID in API client (this will also persist to localStorage)
      tombolaApi.setClientId(response.client_id);

      // Load assigned cards
      await gameActions.loadCards();

      return true;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Registration failed';
      return false;
    }
  },

  async registerGlobally(playerName: string, clientType: 'player' | 'board' = 'player'): Promise<boolean> {
    try {
      const response = await tombolaApi.globalRegister(playerName, clientType);

      gameState.clientId = response.client_id;
      gameState.playerName = playerName;
      gameState.isRegistered = true;
      gameState.error = null;

      // Store player name for future re-registration
      previousPlayerName = playerName;

      // Store registration info in localStorage for persistence across page loads
      localStorage.setItem('tombola-client-id', response.client_id);
      localStorage.setItem('tombola-user-name', playerName);

      // Cache the client name for leaderboard display
      clientNameCache.set(response.client_id, playerName);

      // Set client ID in API client (this will also persist to localStorage)
      tombolaApi.setClientId(response.client_id);

      return true;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Global registration failed';
      return false;
    }
  },

  async registerAsBoard(): Promise<boolean> {
    try {
      // Clear game-specific API state but keep client ID
      tombolaApi.clearGameState();

      // Ensure the API client has the correct game ID
      if (!gameState.gameId) {
        throw new Error('Game ID must be set before board registration');
      }

      tombolaApi.setGameId(gameState.gameId);

      // Check if we have an existing user registration - no caching, always fetch fresh
      const existingClientId = localStorage.getItem('tombola-client-id');
      const existingUserName = localStorage.getItem('tombola-user-name');

      if (existingClientId && existingUserName) {
        // Ensure the API client has the client ID
        tombolaApi.setClientId(existingClientId);

        // Check if this user is the board owner of the current game - fresh API call, no cache
        try {
          const gameStatus = await tombolaApi.getStatus();

          if (gameStatus.owner === existingClientId) {
            // Use the existing user's registration but set them up for board operations
            gameState.clientId = existingClientId;
            gameState.playerName = existingUserName;
            gameState.isRegistered = true;
            gameState.error = null;

            // Load initial game state with fresh data
            await this.refreshGameState();

            return true;
          } else {
            // Provide a clear error message
            gameState.error = `Access denied: Only the game creator can access board mode. Game owner: ${gameStatus.owner}, Your ID: ${existingClientId}`;
            return false;
          }
        } catch (statusError) {
          const errorMessage = statusError instanceof Error ? statusError.message : 'Unknown error';
          gameState.error = `Unable to verify board ownership: ${errorMessage}`;
          return false;
        }
      } else {
        gameState.error = 'You must be registered to access board mode';
        return false;
      }

      // This point should not be reached, but add a fallback just in case
      gameState.error = 'Unexpected error during board registration';
      return false;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Board registration failed';
      return false;
    }
  },

  async loadCards(): Promise<void> {
    if (!gameState.isRegistered) {
      return;
    }

    try {
      const assignments = await tombolaApi.listAssignedCards();

      const cards: Card[] = [];

      for (const assignment of assignments.cards) {
        const card = await tombolaApi.getAssignedCard(assignment.card_id);
        cards.push(card);
      }

      gameState.cards = cards;
      gameState.error = null;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Failed to load cards';
    }
  },

  async generateCards(count: number): Promise<boolean> {
    if (!gameState.isRegistered) return false;

    try {
      const response = await tombolaApi.generateCards(count);
      gameState.cards = response.cards;
      gameState.error = null;
      return true;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Failed to generate cards';
      return false;
    }
  },

  async refreshGameState(): Promise<void> {
    if (!gameState.isConnected || !gameState.gameId) return;

    try {
      const [status, board, pouch, scoreCard] = await Promise.all([
        tombolaApi.getStatus(),
        tombolaApi.getBoard(),
        tombolaApi.getPouch(),
        tombolaApi.getScoreMap()
      ]);

      // Check if we're still connected to the same game
      if (status.game_id !== gameState.gameId) {
        // Game ID mismatch, need to handle game change
        gameActions.handleGameChange(status);
        return;
      }

      gameState.gameStatus = status;
      gameState.board = board;
      gameState.pouch = pouch;
      gameState.scoreCard = scoreCard;
      gameState.error = null;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Failed to refresh game state';
    }
  },

  async startAutoRefresh(intervalMs: number = 2000): Promise<void> {
    const refresh = async () => {
      if (gameState.isConnected) {
        await gameActions.refreshGameState();
      }
    };

    // Initial refresh
    await refresh();

    // Set up interval
    setInterval(refresh, intervalMs);
  },

  clearError(): void {
    gameState.error = null;
  },

  clearGameSpecificState(): void {
    // Clear only game-specific state, preserve global registration
    gameState.isConnected = false;
    gameState.gameId = null;
    gameState.cards = [];
    gameState.board = { numbers: [], marked_numbers: [] };
    gameState.pouch = { numbers: [] };
    gameState.scoreCard = { published_score: 0, score_map: {} };
    gameState.gameStatus = null;
    gameState.error = null;

    // Clear API game state but preserve global client info in API
    tombolaApi.clearGameState();
  },  handleGameChange(newStatus: GameStatus): void {
    // Game ID changed, reset registration but keep connection
    gameState.isRegistered = false;
    gameState.clientId = null;
    gameState.cards = [];
    gameState.board = { numbers: [], marked_numbers: [] };
    gameState.pouch = { numbers: [] };
    gameState.scoreCard = { published_score: 0, score_map: {} };

    // Update to new game status
    gameState.gameStatus = newStatus;

    // Clear the client ID from API client but don't clear localStorage
    tombolaApi.clearGameState();

    gameState.error = 'New game started. Please register again to continue playing.';
  },

  reset(): void {
    Object.assign(gameState, { ...initialState });

    // Clear all API state and localStorage (complete logout)
    tombolaApi.clearState();
  },

  getPreviousPlayerName(): string {
    return previousPlayerName;
  },

  // Ensure client state is properly restored from localStorage
  restoreClientState(): boolean {
    if (typeof window === 'undefined') return false;

    const storedClientId = localStorage.getItem('tombola-client-id');
    const storedUserName = localStorage.getItem('tombola-user-name');
    const storedGameId = localStorage.getItem('tombola-game-id');

    let restored = false;

    if (storedClientId && storedUserName) {
      gameState.clientId = storedClientId;
      gameState.playerName = storedUserName;
      gameState.isRegistered = true;

      // Ensure API client has the client ID
      tombolaApi.setClientId(storedClientId);

      restored = true;
    }

    if (storedGameId) {
      gameState.gameId = storedGameId;
      tombolaApi.setGameId(storedGameId);
      restored = true;
    }

    return restored;
  },

  // Restore only global user registration, not game-specific state
  restoreGlobalRegistration(): boolean {
    if (typeof window === 'undefined') return false;

    const storedClientId = localStorage.getItem('tombola-client-id');
    const storedUserName = localStorage.getItem('tombola-user-name');

    if (storedClientId && storedUserName) {
      gameState.clientId = storedClientId;
      gameState.playerName = storedUserName;
      gameState.isRegistered = true;

      // Ensure API client has the client ID
      tombolaApi.setClientId(storedClientId);

      return true;
    }

    return false;
  }
};

// Utility functions
export const gameUtils = {
  isNumberMarked(number: number): boolean {
    return gameState.board.marked_numbers.includes(number);
  },

  isNumberExtracted(number: number): boolean {
    return gameState.board.numbers.includes(number);
  },

  getCardScore(card: Card): number {
    let score = 0;
    for (const row of card.card_data) {
      for (const cell of row) {
        if (cell !== null && gameUtils.isNumberExtracted(cell)) {
          score++;
        }
      }
    }
    return score;
  },

  getCardLines(card: Card): number[] {
    const lines: number[] = [];

    // Check each row for complete lines
    for (let rowIndex = 0; rowIndex < card.card_data.length; rowIndex++) {
      const row = card.card_data[rowIndex];
      const extractedCount = row.filter(cell => cell !== null && gameUtils.isNumberExtracted(cell)).length;
      const totalCount = row.filter(cell => cell !== null).length;

      if (extractedCount === totalCount && totalCount > 0) {
        lines.push(rowIndex + 1); // Return 1-based row numbers
      }
    }

    return lines;
  },

  isBingo(card: Card): boolean {
    const totalNumbers = card.card_data.flat().filter(cell => cell !== null).length;
    const extractedNumbers = card.card_data.flat().filter(cell => cell !== null && gameUtils.isNumberExtracted(cell)).length;
    return extractedNumbers === totalNumbers && totalNumbers === 15;
  },

  // Get the numbers that contributed to the latest achievement for a specific card
  getHighestScoreNumbers(cardId: string): number[] {
    // Only highlight achievements for the current published score level
    const currentPublishedScore = gameState.scoreCard.published_score;

    // If no published score yet, don't highlight anything
    if (currentPublishedScore < 2) {
      return [];
    }

    // Look for this card's achievements at the current published score level
    const achievements = gameState.scoreCard.score_map[currentPublishedScore.toString()];
    if (!achievements) {
      return [];
    }

    // Find achievement for this specific card at the current published score
    for (const achievement of achievements) {
      if (achievement.card_id === cardId) {
        return achievement.numbers || [];
      }
    }

    return [];
  },

  // Get the numbers for card line completions (separate from board achievements)
  getCardLineNumbers(cardId: string): number[] {
    const card = gameState.cards.find(c => c.card_id === cardId);
    if (!card) {
      return [];
    }

    const lineNumbers: number[] = [];

    // Check each row for complete lines
    for (let rowIndex = 0; rowIndex < card.card_data.length; rowIndex++) {
      const row = card.card_data[rowIndex];
      const nonNullCells = row.filter(cell => cell !== null);
      const extractedCells = row.filter(cell => cell !== null && gameUtils.isNumberExtracted(cell));

      // If this row is complete, add all its numbers
      if (extractedCells.length === nonNullCells.length && nonNullCells.length > 0) {
        lineNumbers.push(...extractedCells.filter((cell): cell is number => cell !== null));
      }
    }

    // Check each column for complete lines
    for (let colIndex = 0; colIndex < 5; colIndex++) {
      const columnNumbers: number[] = [];
      const columnExtractedNumbers: number[] = [];

      for (let rowIndex = 0; rowIndex < card.card_data.length; rowIndex++) {
        const cell = card.card_data[rowIndex][colIndex];
        if (cell !== null) {
          columnNumbers.push(cell);
          if (gameUtils.isNumberExtracted(cell)) {
            columnExtractedNumbers.push(cell);
          }
        }
      }

      // If this column is complete, add all its numbers
      if (columnExtractedNumbers.length === columnNumbers.length && columnNumbers.length > 0) {
        lineNumbers.push(...columnExtractedNumbers);
      }
    }

    // Remove duplicates and return
    return [...new Set(lineNumbers)];
  },

  // Get the latest achievement for a specific card (only show current published score level)
  getCardAchievement(cardId: string): { score: number; text: string } | null {
    const currentPublishedScore = gameState.scoreCard.published_score;

    // If no published score yet, no achievement to show
    if (currentPublishedScore < 2) {
      return null;
    }

    // Check if this card has an achievement at the current published score level
    const achievements = gameState.scoreCard.score_map[currentPublishedScore.toString()];
    if (!achievements) {
      return null;
    }

    // Find achievement for this specific card at the current published score
    for (const achievement of achievements) {
      if (achievement.card_id === cardId) {
        let achievementText = '';
        switch (currentPublishedScore) {
          case 2:
            achievementText = '2 in line';
            break;
          case 3:
            achievementText = '3 in line';
            break;
          case 4:
            achievementText = '4 in line';
            break;
          case 5:
            achievementText = '5 in line';
            break;
          case 15:
            achievementText = 'BINGO';
            break;
          default:
            achievementText = `${currentPublishedScore} in line`;
        }

        return { score: currentPublishedScore, text: achievementText };
      }
    }

    return null;
  },

  // Get number highlighting type for display
  getNumberHighlight(number: number, cardId: string): 'none' | 'extracted' | 'achievement' | 'latest' | 'achievement-latest' {
    if (!gameUtils.isNumberExtracted(number)) {
      return 'none';
    }

    const isAchievement = gameUtils.getHighestScoreNumbers(cardId).includes(number);
    const isLatest = gameUtils.isLatestExtracted(number);

    // If it's both achievement and latest, return combined type
    if (isAchievement && isLatest) {
      return 'achievement-latest';
    }

    // Check if this number is part of a scored achievement (from board score map)
    if (isAchievement) {
      return 'achievement'; // Green highlight for numbers that contributed to scores
    }

    // Check if this is the latest extracted number
    if (isLatest) {
      return 'latest'; // Special highlight for latest number (same gray but emphasized)
    }

    return 'extracted'; // Grey highlight for other extracted numbers
  },

  // Check if a number is the latest extracted number
  isLatestExtracted(number: number): boolean {
    if (gameState.board.numbers.length === 0) return false;
    return gameState.board.numbers[gameState.board.numbers.length - 1] === number;
  },

  getPlayerAchievements(): { score: number; lines: number[]; bingo: boolean } {
    if (gameState.cards.length === 0) {
      return { score: 0, lines: [], bingo: false };
    }

    let maxScore = 0;
    let allLines: number[] = [];
    let hasBingo = false;

    for (const card of gameState.cards) {
      const score = gameUtils.getCardScore(card);
      const lines = gameUtils.getCardLines(card);
      const bingo = gameUtils.isBingo(card);

      maxScore = Math.max(maxScore, score);
      allLines = [...allLines, ...lines];
      if (bingo) hasBingo = true;
    }

    return { score: maxScore, lines: allLines, bingo: hasBingo };
  }
};

// Client name utilities
export const clientUtils = {
  // Get cached client name by ID
  getClientName(clientId: string): string | null {
    // Special case for board client
    if (clientId === "0000000000000000") {
      return "Board";
    }

    return clientNameCache.get(clientId) || null;
  },

  // Cache a client name
  cacheClientName(clientId: string, name: string): void {
    clientNameCache.set(clientId, name);
  },

  // Get display name with intelligent fallback
  getDisplayName(clientId: string): string {
    const cachedName = clientUtils.getClientName(clientId);
    if (cachedName) {
      return cachedName;
    }

    // For unknown players, assign sequential numbers for better UX
    if (!clientNumberCache.has(clientId) && clientId !== "0000000000000000") {
      clientNumberCache.set(clientId, nextPlayerNumber++);
    }

    const playerNumber = clientNumberCache.get(clientId);
    if (playerNumber) {
      return `Player ${playerNumber}`;
    }

    // Final fallback to shortened ID
    return `Player ${clientId.slice(-4)}`;
  },

  // Clear cache (useful when switching games)
  clearCache(): void {
    clientNameCache.clear();
    clientNumberCache.clear();
    nextPlayerNumber = 1;
  }
};
