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

      // Cache the client name for leaderboard display
      clientNameCache.set(response.client_id, playerName);

      tombolaApi.setClientId(response.client_id);

      // Load assigned cards
      await gameActions.loadCards();

      return true;
    } catch (error) {
      gameState.error = error instanceof Error ? error.message : 'Registration failed';
      return false;
    }
  },

  async registerAsBoard(): Promise<boolean> {
    try {
      console.log('Starting board registration process...');

      // Clear any existing API state to prevent cached client IDs
      console.log('Clearing API client state...');
      tombolaApi.clearState();

      // Ensure the API client has the correct game ID
      if (!gameState.gameId) {
        throw new Error('Game ID must be set before board registration');
      }

      console.log('Setting API game ID to:', gameState.gameId);
      tombolaApi.setGameId(gameState.gameId);

      // Check if we have an existing user registration - no caching, always fetch fresh
      const existingClientId = localStorage.getItem('tombola-client-id');
      const existingUserName = localStorage.getItem('tombola-user-name');

      console.log('LocalStorage check - Raw values:', {
        clientIdKey: 'tombola-client-id',
        clientIdValue: existingClientId,
        userNameKey: 'tombola-user-name',
        userNameValue: existingUserName,
        clientIdType: typeof existingClientId,
        userNameType: typeof existingUserName
      });

      if (existingClientId && existingUserName) {
        console.log('Found existing user registration:', { clientId: existingClientId, userName: existingUserName });

        // Check if this user is the board owner of the current game - fresh API call, no cache
        try {
          console.log('Checking game ownership with fresh API call...');
          const gameStatus = await tombolaApi.getStatus();
          console.log('Current game status:', gameStatus);
          console.log('Comparing owner ID:', gameStatus.owner, 'with user ID:', existingClientId);

          if (gameStatus.owner === existingClientId) {
            console.log('✅ User IS the board owner, using existing registration');

            // Use the existing user's registration but set them up for board operations
            gameState.clientId = existingClientId;
            gameState.playerName = existingUserName;
            gameState.isRegistered = true;
            gameState.error = null;

            // Set the client ID in the API client AFTER clearing state
            console.log('Setting API client ID to:', existingClientId);
            tombolaApi.setClientId(existingClientId);

            console.log('Board registration complete using existing user. Client ID:', existingClientId);

            // Verify the API client state
            console.log('API client state verification:', {
              gameId: gameState.gameId,
              clientId: gameState.clientId,
              playerName: gameState.playerName,
              apiClientId: tombolaApi.getCurrentClientId()
            });

            // Load initial game state with fresh data
            await this.refreshGameState();
            console.log('Initial game state loaded:', {
              boardNumbers: gameState.board.numbers.length,
              pouchNumbers: gameState.pouch.numbers.length,
              gameStatus: gameState.gameStatus?.status
            });

            return true;
          } else {
            console.log('❌ User is NOT the board owner. Current owner:', gameStatus.owner, 'User:', existingClientId);
            console.log('❌ This user cannot access board mode for this game. They should create their own game.');

            // Provide a clear error message
            gameState.error = `Access denied: Only the game creator can access board mode. Game owner: ${gameStatus.owner}, Your ID: ${existingClientId}`;
            return false;
          }
        } catch (statusError) {
          console.error('❌ Could not check game owner status:', statusError);
          const errorMessage = statusError instanceof Error ? statusError.message : 'Unknown error';
          gameState.error = `Unable to verify board ownership: ${errorMessage}`;
          return false;
        }
      } else {
        console.log('❌ No existing user registration found in localStorage');
        gameState.error = 'You must be registered to access board mode';
        return false;
      }

      // This point should not be reached, but add a fallback just in case
      console.error('❌ Unexpected state in registerAsBoard');
      gameState.error = 'Unexpected error during board registration';
      return false;
    } catch (error) {
      console.error('Board registration failed:', error);
      gameState.error = error instanceof Error ? error.message : 'Board registration failed';
      return false;
    }
  },

  async loadCards(): Promise<void> {
    if (!gameState.isRegistered) return;

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

  handleGameChange(newStatus: GameStatus): void {
    // Game ID changed, reset registration but keep connection
    gameState.isRegistered = false;
    gameState.clientId = null;
    gameState.cards = [];
    gameState.board = { numbers: [], marked_numbers: [] };
    gameState.pouch = { numbers: [] };
    gameState.scoreCard = { published_score: 0, score_map: {} };

    // Update to new game status
    gameState.gameStatus = newStatus;

    // Clear the client ID from API client
    tombolaApi.setClientId('');

    gameState.error = 'New game started. Please register again to continue playing.';
  },

  reset(): void {
    Object.assign(gameState, { ...initialState });
    tombolaApi.setGameId('');
  },

  getPreviousPlayerName(): string {
    return previousPlayerName;
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

  // Get the numbers that contributed to the highest published score for a specific card
  getHighestScoreNumbers(cardId: string): number[] {
    const publishedScore = gameState.scoreCard.published_score;

    if (publishedScore === 0) {
      return [];
    }

    // Look for this card in the score map for the published score
    const achievements = gameState.scoreCard.score_map[publishedScore];
    if (achievements) {
      for (const achievement of achievements) {
        if (achievement.card_id === cardId) {
          return achievement.numbers;
        }
      }
    }

    return [];
  },

  // Get the highest achievement for a specific card
  getCardAchievement(cardId: string): { score: number; text: string } | null {
    let highestScore = 0;
    let achievementText = '';

    // Check all scores in the scorecard for this card and find the highest
    for (const [scoreStr, achievements] of Object.entries(gameState.scoreCard.score_map)) {
      const score = parseInt(scoreStr);
      for (const achievement of achievements) {
        if (achievement.card_id === cardId && score > highestScore) {
          highestScore = score;

          switch (score) {
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
              achievementText = `${score} in line`;
          }
        }
      }
    }

    // Only show achievements if they are relevant to the current published score
    // Don't show obsolete achievements (e.g., don't show "2 in line" if published score is 4)
    const publishedScore = gameState.scoreCard.published_score;
    if (highestScore > 0 && publishedScore > 0 && highestScore < publishedScore) {
      return null; // Clear obsolete achievements
    }

    return highestScore > 0 ? { score: highestScore, text: achievementText } : null;
  },

  // Get number highlighting type for display
  getNumberHighlight(number: number, cardId: string): 'none' | 'extracted' | 'achievement' {
    if (!gameUtils.isNumberExtracted(number)) {
      return 'none';
    }

    const highestScoreNumbers = gameUtils.getHighestScoreNumbers(cardId);
    if (highestScoreNumbers.includes(number)) {
      return 'achievement'; // Yellow highlight for achievement numbers
    }

    return 'extracted'; // Green highlight for other extracted numbers
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
