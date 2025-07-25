<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { tombolaApi } from '../api.js';
  import type { GameInfo, GameStatus } from '../types.js';
  import { getScoreText, getScoreColor } from '../scoreUtils.js';
  import { gameActions, gameState } from '../gameStore.svelte.js';
  import CardSelectionModal from './CardSelectionModal.svelte';

  interface Props {
    onGameSelected: (gameId: string) => void;
    readonly?: boolean;
    authEnabled?: boolean;
    userRegistered?: boolean;
    userName?: string;
  }

  let { onGameSelected, readonly = false, authEnabled = true, userRegistered = false, userName = '' }: Props = $props();

  let games: GameInfo[] = $state([]);
  let gameDetails = $state<Map<string, GameStatus>>(new Map());
  let gameCreators = $state<Map<string, { name: string; clientId: string }>>(new Map());
  let gameStats = $state<any>(null);
  let loading = $state(true);
  let creating = $state(false);
  let error = $state<string | null>(null);
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Dialog state - only card selection modal is used now
  let selectedGame = $state<string | null>(null);
  let selectedGameDetail = $state<GameStatus | null>(null);

  // Card selection modal state
  let showCardSelection = $state(false);

  onMount(() => {
    loadGames();

    // Start auto-refresh every 5 seconds
    refreshInterval = setInterval(() => {
      if (!loading && !creating) {
        loadGames();
      }
    }, 5000);

    // Cleanup interval on component destroy
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  function getStatusPriority(status: string): number {
    switch (status.toLowerCase()) {
      case 'new': return 1;
      case 'active': return 2;
      case 'closed': return 3;
      default: return 4;
    }
  }

  function sortGames(games: GameInfo[]): GameInfo[] {
    return games.sort((a, b) => {
      // First priority: Status (new, active, closed)
      const statusPriorityA = getStatusPriority(a.status || 'unknown');
      const statusPriorityB = getStatusPriority(b.status || 'unknown');

      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }

      // Second priority: Creation date (most recent first)
      // Get creation dates from game details if available, fallback to game data
      const detailA = gameDetails.get(a.game_id);
      const detailB = gameDetails.get(b.game_id);

      const dateA = detailA?.created_at || a.created_at;
      const dateB = detailB?.created_at || b.created_at;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put games without dates at the end
      if (!dateB) return -1;

      // Parse dates and sort newest first
      const parsedDateA = new Date(dateA).getTime();
      const parsedDateB = new Date(dateB).getTime();

      return parsedDateB - parsedDateA; // Newest first (inverted)
    });
  }

  async function loadGames() {
    try {
      loading = true;
      error = null;

      // Ensure client state is restored before making API calls
      gameActions.restoreClientState();

      const response = await tombolaApi.getGamesList();
      games = response.games;
      gameStats = null; // Statistics are not provided in the new API structure

      // Load detailed status for each game
      await loadGameDetails();

      // Sort games after loading details (so we have creation dates)
      games = sortGames(games);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load games';
    } finally {
      loading = false;
    }
  }

  async function loadGameDetails() {
    const detailsMap = new Map<string, GameStatus>();

    // Load detailed status for each game in parallel
    const statusPromises = games.map(async (game) => {
      try {
        const status = await tombolaApi.getGameStatus(game.game_id);
        detailsMap.set(game.game_id, status);

        // Try to identify the game creator (board client)
        // This is a best-effort approach since the API doesn't directly provide this
        await loadGameCreator(game.game_id);
      } catch (err) {
        // Failed to load details
      }
    });

    await Promise.all(statusPromises);
    gameDetails = detailsMap;
  }

  async function loadGameCreator(gameId: string) {
    try {
      // The board ownership system: Each game has exactly one board owner
      // who gets the special BOARD_ID card ("0000000000000000")
      // The board owner is the person who created the game and has extraction privileges

      // If we already have creator info from game creation, use it
      if (gameCreators.has(gameId)) {
        return;
      }

      // Get the game status to find the board owner
      tombolaApi.setGameId(gameId);
      const gameStatus = await tombolaApi.getStatus();

      if (gameStatus.owner) {
        // Get the client information for the board owner
        const clientInfo = await tombolaApi.getClientById(gameStatus.owner);

        gameCreators.set(gameId, {
          name: clientInfo.name,
          clientId: clientInfo.client_id
        });
      } else {
        // Fallback if no owner info is available
        gameCreators.set(gameId, {
          name: "Unknown Creator",
          clientId: "unknown"
        });
      }
    } catch (err) {
      // Fallback for existing games or API errors
      gameCreators.set(gameId, {
        name: "Unknown Creator",
        clientId: "unknown"
      });
    }
  }

  async function selectGame(gameId: string) {
    const detail = getGameDetail(gameId);
    if (!detail) return;

    try {
      // Check if user is the board owner by comparing names
      const isGameOwner = await checkIfUserIsGameOwner(detail);

      if (isGameOwner) {
        // User is the game owner - ensure proper board registration before navigation
        // Clear any existing game state to prevent conflicts
        gameActions.clearError();

        // Set the game ID first
        await gameActions.setGameId(gameId);

        // Pre-register as board to ensure board page can access immediately
        const boardRegistrationSuccess = await gameActions.registerAsBoard();

        if (boardRegistrationSuccess) {
          // Now redirect to board page
          await goto(`/board?gameId=${gameId}`);
        } else {
          // Registration failed - stay on current page and show error
          return;
        }
      } else {
        // Set the game ID for player flow
        await gameActions.setGameId(gameId);

        // User is a card player
        if (detail.status?.toLowerCase() === 'new') {
          // New game - check if user already has cards assigned
          const hasExistingCards = await checkIfUserHasCards(gameId);

          if (hasExistingCards) {
            // User already has cards - redirect directly to player page
            await goto(`/player?gameId=${gameId}`);
          } else {
            // User doesn't have cards - show card selection modal for card count
            selectedGame = gameId;
            selectedGameDetail = detail;
            showCardSelection = true;
          }
        } else {
          // Active game - redirect directly to player page (may already have cards)
          const success = await gameActions.register(userName, 0); // 0 cards for existing game
          if (success) {
            await goto(`/player?gameId=${gameId}`);
          }
        }
      }

      // Notify parent that game was selected
      onGameSelected(gameId);
    } catch (error) {
      // Failed to process game selection
    }
  }

  async function checkIfUserIsGameOwner(gameDetail: GameStatus): Promise<boolean> {
    if (!gameDetail.owner || !userName) {
      return false;
    }

    try {
      // Get the owner's client info from the server
      const ownerInfo = await tombolaApi.getClientById(gameDetail.owner);
      return ownerInfo.name === userName;
    } catch (error) {
      return false;
    }
  }

  async function checkIfUserHasCards(gameId: string): Promise<boolean> {
    try {
      // First ensure we're registered to this game and get our client ID
      const success = await gameActions.register(userName, 0); // Register with 0 cards (won't generate cards if already registered)
      if (!success) {
        return false;
      }

      // Set the game ID and check for existing cards
      await gameActions.setGameId(gameId);
      const cardsResponse = await tombolaApi.listAssignedCards();

      // Check if user has any cards assigned
      return cardsResponse.cards && cardsResponse.cards.length > 0;
    } catch (error) {
      // If we can't check, assume they don't have cards to be safe
      return false;
    }
  }

  function closeCardSelection() {
    showCardSelection = false;
    selectedGame = null;
    selectedGameDetail = null;
  }

  async function handleCardSelectionJoin(event: CustomEvent) {
    try {
      const { cardCount } = event.detail;

      if (!selectedGame) {
        return;
      }

      if (!userName || userName.trim() === '') {
        return;
      }

      // First, set the game ID in the game store
      const gameIdSuccess = await gameActions.setGameId(selectedGame);
      if (!gameIdSuccess) {
        return;
      }

      // Step 1: Register with 0 cards (just join the game)
      const joinSuccess = await gameActions.register(userName, 0);
      if (!joinSuccess) {
        return;
      }

      // Step 2: Generate the requested number of cards
      const cardsSuccess = await gameActions.generateCards(cardCount);
      if (!cardsSuccess) {
        return;
      }

      // Navigate to player page
      await goto(`/player?gameId=${selectedGame}`);

      // Close the card selection dialog
      closeCardSelection();
    } catch (error) {
      // Failed to join game with cards
    }
  }

  async function createNewGame() {
    try {
      creating = true;
      error = null;

      // Validate user name
      if (!userName || userName.trim() === '') {
        error = 'Please enter your name in the registration form above before creating a game';
        return;
      }

      // Ensure client state is restored before creating game
      gameActions.restoreClientState();

      // Check if we have a client ID, if not, register globally first
      let hasClientId = !!tombolaApi.getCurrentClientId();

      if (!hasClientId) {
        // Need to register globally as a board client first
        try {
          const success = await gameActions.registerGlobally(userName, 'board');
          if (!success) {
            error = 'Failed to register as board client';
            return;
          }
          hasClientId = true;
        } catch (regError) {
          error = regError instanceof Error ? regError.message : 'Failed to register as board client';
          return;
        }
      }

      // Now create the new game
      const response = await tombolaApi.createNewGame();

      // If we have creator info from the response, store it
      if (response.board_owner && userName) {
        gameCreators.set(response.game_id, {
          name: userName,
          clientId: response.board_owner
        });
      }

      // Refresh the games list to include the new game
      await loadGames();

      // Automatically select the new game
      onGameSelected(response.game_id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create new game';
    } finally {
      creating = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'new': return '#4a90e2';
      case 'active': return '#28a745';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'new': return '🆕';
      case 'active': return '🎯';
      case 'closed': return '✅';
      default: return '❓';
    }
  }

  function getProgressPercentage(numbersExtracted: number): number {
    return Math.round((numbersExtracted / 90) * 100);
  }

  function getGameDetail(gameId: string): GameStatus | null {
    return gameDetails.get(gameId) || null;
  }

  function formatDate(dateStr: string): string {
    try {
      if (!dateStr) return 'Not set';

      // Handle different possible date formats
      let date: Date;
      if (dateStr.includes('UTC')) {
        // Parse UTC timestamp format: "2025-07-22 08:51:49 UTC"
        date = new Date(dateStr);
      } else {
        // Try parsing as ISO string
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) {
        return dateStr;
      }

      return date.toLocaleString();
    } catch (err) {
      return dateStr || 'Invalid Date';
    }
  }
</script>

<div class="game-selector">
  <div class="header">
    <h2>Select a Game</h2>
    <div class="header-actions">
      {#if gameStats}
        <div class="stats">
          <span class="stat total">📊 Total: {gameStats.active_games + gameStats.new_games + gameStats.closed_games}</span>
          <span class="stat new">🆕 New: {gameStats.new_games}</span>
          <span class="stat active">🎯 Active: {gameStats.active_games}</span>
          <span class="stat closed">✅ Closed: {gameStats.closed_games}</span>
        </div>
      {/if}
      {#if !readonly}
        <button class="create-btn" onclick={createNewGame} disabled={creating || loading || (!userRegistered && !readonly)}>
          {creating ? '🔄 Creating...' : '🆕 Create New Game'}
        </button>
      {/if}
    </div>
  </div>

  {#if error}
    <div class="error">
      <p>❌ {error}</p>
      <button onclick={loadGames}>Try Again</button>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <p>🔄 Loading games...</p>
    </div>
  {:else if games.length === 0}
    <div class="no-games">
      <p>🎯 No games available</p>
      {#if readonly}
        <p>Check back later for available games!</p>
      {:else}
        <p>Create a new game to get started!</p>
      {/if}
    </div>
  {:else}
    <div class="games-grid">
      {#each games as game (game.game_id)}
        {@const detail = getGameDetail(game.game_id)}
        <div
          class="game-card"
          onclick={() => userRegistered || readonly ? selectGame(game.game_id) : null}
          role="button"
          tabindex="0"
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (userRegistered || readonly) ? selectGame(game.game_id) : null}
          class:clickable={userRegistered || readonly}
        >
          <div class="game-header">
            <div class="game-status" style="color: {getStatusColor(game.status || 'unknown')}">
              {getStatusIcon(game.status || 'unknown')} {game.status || 'Unknown'}
            </div>
            <div class="game-id">{game.game_id || 'No ID'}</div>
          </div>

          <div class="game-info">
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">{formatDate(detail?.created_at || game.created_at)}</span>
            </div>
            <div class="info-row">
              <span class="label">Created by:</span>
              <span class="value">
                👤 {gameCreators.get(game.game_id)?.name || 'Game Creator'}
                {#if gameCreators.get(game.game_id)?.clientId && gameCreators.get(game.game_id)?.clientId !== 'unknown'}
                  <span class="creator-id">({gameCreators.get(game.game_id)?.clientId})</span>
                {/if}
              </span>
            </div>
            {#if detail}
              <div class="info-row">
                <span class="label">Players:</span>
                <span class="value">👥 {detail.players}</span>
              </div>
              <div class="info-row">
                <span class="label">Cards:</span>
                <span class="value">🎯 {detail.cards}</span>
              </div>
              <div class="info-row">
                <span class="label">Numbers:</span>
                <span class="value">🔢 {detail.numbers_extracted}/90</span>
              </div>
              {#if detail.numbers_extracted > 0}
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {getProgressPercentage(detail.numbers_extracted)}%"></div>
                  <span class="progress-text">{getProgressPercentage(detail.numbers_extracted)}% complete</span>
                </div>
              {/if}
              {#if detail.scorecard > 0}
                <div class="info-row">
                  <span class="label">Best Score:</span>
                  <span class="value" style="color: {getScoreColor(detail.scorecard)}">{getScoreText(detail.scorecard)}</span>
                </div>
              {/if}
            {:else}
              <div class="info-row">
                <span class="label">Players:</span>
                <span class="value">👥 {game.client_count || 0}</span>
              </div>
              <div class="info-row">
                <span class="label">Numbers:</span>
                <span class="value">🔢 {game.extracted_numbers || 0}/90</span>
              </div>
            {/if}
            {#if detail && detail.closed_at}
              <div class="info-row">
                <span class="label">Closed:</span>
                <span class="value">{formatDate(detail.closed_at)}</span>
              </div>
            {/if}
          </div>

          <button class="select-btn" class:disabled={!userRegistered && !readonly}>
            {#if !userRegistered && !readonly}
              Register to Join
            {:else}
              {game.status?.toLowerCase() === 'new' ? 'Join Game' : game.status?.toLowerCase() === 'active' ? 'Join Active Game' : 'View Game'}
            {/if}
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Card Selection Modal for new games -->
  {#if showCardSelection && selectedGameDetail}
    <CardSelectionModal
      bind:isOpen={showCardSelection}
      gameTitle={selectedGameDetail.game_id || ''}
      on:join={handleCardSelectionJoin}
      on:close={closeCardSelection}
    />
  {/if}
</div>

<style>
  .game-selector {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header h2 {
    margin: 0;
    color: #333;
    font-size: 1.8em;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .stats {
    display: flex;
    gap: 12px;
    font-size: 0.9em;
    flex-wrap: wrap;
  }

  .stat {
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    color: #495057;
    font-weight: 500;
  }

  .stat.total {
    background: #e3f2fd;
    color: #1565c0;
  }

  .stat.new {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .stat.active {
    background: #fff3e0;
    color: #ef6c00;
  }

  .stat.closed {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  .create-btn {
    background: #28a745;
    color: white;
    border: 2px solid #28a745;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: bold;
  }

  .create-btn:hover:not(:disabled) {
    background: #218838;
    border-color: #1e7e34;
    transform: translateY(-1px);
  }

  .create-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    text-align: center;
  }

  .error p {
    margin: 0 0 12px 0;
    color: #721c24;
  }

  .error button {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .loading, .no-games {
    text-align: center;
    padding: 40px 20px;
    color: #495057;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    border: 2px solid #e9ecef;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .loading p, .no-games p {
    margin: 0 0 10px 0;
    font-size: 1.2em;
    font-weight: 500;
    color: #343a40;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .no-games p:first-child {
    font-size: 1.4em;
    color: #495057;
    margin-bottom: 15px;
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .game-card {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-height: 280px;
    display: flex;
    flex-direction: column;
  }

  .game-card.clickable {
    cursor: pointer;
  }

  .game-card.clickable:hover {
    border-color: #4a90e2;
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .game-card.clickable:focus {
    outline: 3px solid #4a90e2;
    outline-offset: 2px;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .game-status {
    font-weight: bold;
    font-size: 1.1em;
  }

  .game-id {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #6c757d;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .game-info {
    margin-bottom: 16px;
    flex-grow: 1;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    align-items: center;
  }

  .label {
    color: #6c757d;
    font-weight: 500;
  }

  .value {
    color: #333;
    font-weight: bold;
  }

  .creator-id {
    color: #6c757d;
    font-size: 0.8rem;
    font-family: 'Courier New', monospace;
    font-weight: normal;
    margin-left: 0.5rem;
  }

  .progress-bar {
    position: relative;
    background: #e9ecef;
    border-radius: 8px;
    height: 20px;
    margin: 8px 0;
    overflow: hidden;
  }

  .progress-fill {
    background: var(--success-gradient);
    height: 100%;
    border-radius: 8px;
    transition: width 0.3s ease;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8em;
    font-weight: bold;
    color: #333;
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
  }

  .select-btn {
    width: 100%;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s ease;
    margin-top: auto;
  }

  .select-btn:hover {
    background: #357abd;
  }

  .select-btn.disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .select-btn.disabled:hover {
    background: #6c757d;
  }

  @media (max-width: 768px) {
    .game-selector {
      padding: 16px;
    }

    .header {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .games-grid {
      grid-template-columns: 1fr;
    }

    .game-header {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
  }
</style>
