<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { gameState, gameActions } from '$lib/gameStore.svelte.js';
  import Card from '$lib/components/Card.svelte';
  import Board from '$lib/components/Board.svelte';
  import GameFooter from '$lib/components/GameFooter.svelte';
  import LeaderboardSidebar from '$lib/components/LeaderboardSidebar.svelte';
  import ScoreBoard from '$lib/components/ScoreBoard.svelte';

  let playerName = $state('');
  let cardCount = $state(6);
  let isConnecting = $state(false);
  let isRegistering = $state(false);
  let gameIdSet = $state(false);

  // Watch for registration state changes to auto-fill name
  $effect(() => {
    if (!gameState.isRegistered && !playerName) {
      // Auto-fill from previous session if available
      const previousName = gameActions.getPreviousPlayerName();
      if (previousName) {
        playerName = previousName;
      }
    }
  });

  // Try to connect on mount
  onMount(async () => {
    // Check for gameId in URL parameters or localStorage
    const urlGameId = $page.url.searchParams.get('gameId');
    const storedGameId = localStorage.getItem('tombola-game-id');
    const gameId = urlGameId || storedGameId;

    if (!gameId) {
      // No game ID available, redirect to landing page
      goto('/');
      return;
    }

    // Set the game ID
    const gameIdSuccess = await gameActions.setGameId(gameId);
    if (!gameIdSuccess) {
      goto('/');
      return;
    }

    gameIdSet = true;

    // Store game ID for future use
    if (urlGameId) {
      localStorage.setItem('tombola-game-id', urlGameId);
    }

    await gameActions.connect();
    if (gameState.isConnected) {
      // Start auto-refresh
      gameActions.startAutoRefresh(3000);
    }
  });

  async function handleConnect() {
    if (!gameIdSet) return;

    isConnecting = true;
    const success = await gameActions.connect();
    if (success) {
      gameActions.startAutoRefresh(3000);
    }
    isConnecting = false;
  }

  async function handleRegister() {
    if (!playerName.trim()) return;

    // Clear any existing errors when starting registration
    gameActions.clearError();

    isRegistering = true;
    await gameActions.register(playerName.trim(), cardCount);
    isRegistering = false;
  }
</script>

<div class="app">
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1>🎯 Tombola Player</h1>
        <p class="subtitle">Card Player Interface</p>
      </div>
      {#if gameState.isRegistered}
        <div class="header-right">
          <div class="player-name-display">{gameState.playerName}</div>
        </div>
      {/if}
    </div>
  </header>

  <main class="app-main">
    <!-- Connection Section -->
    {#if !gameState.isConnected}
      <div class="connection-section">
        <h2>Connect to Game Server</h2>
        <p>Server: <code>http://127.0.0.1:3000</code></p>
        <button onclick={handleConnect} disabled={isConnecting} class="primary-button">
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    {:else}
      <!-- Registration Section -->
      {#if !gameState.isRegistered}
        <div class="registration-section">
          <h2>
            {gameActions.getPreviousPlayerName() ? 'Re-register for New Game' : 'Register as Player'}
          </h2>

          {#if gameActions.getPreviousPlayerName()}
            <div class="game-change-notice">
              <p>🎯 A new game has started! Please register again to continue playing.</p>
            </div>
          {/if}

          {#if gameState.error}
            <div class="error-message">
              <p>{gameState.error}</p>
            </div>
          {/if}

          <div class="form-group">
            <label for="playerName">Your Name:</label>
            <input
              type="text"
              id="playerName"
              bind:value={playerName}
              placeholder="Enter your name"
              disabled={isRegistering}
            />
          </div>
          <div class="form-group">
            <label for="cardCount">Number of Cards (1-6):</label>
            <input
              type="number"
              id="cardCount"
              bind:value={cardCount}
              min="1"
              max="6"
              disabled={isRegistering}
            />
          </div>
          <button onclick={handleRegister} disabled={isRegistering} class="primary-button">
            {isRegistering ? 'Registering...' : 'Register & Generate Cards'}
          </button>
        </div>
      {:else}
        <!-- Game Interface -->
        <div class="game-interface">
          <!-- Main Content Area -->
          <div class="main-content">
            <!-- Left Column: Cards -->
            <div class="cards-column">
              {#if gameState.cards.length > 0}
                <div class="section cards-section">
                  <h2>Your Cards ({gameState.cards.length})</h2>
                  <div class="cards-grid">
                    {#each gameState.cards as card (card.card_id)}
                      <Card {card} showCardId={true} />
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            <!-- Right Column: Board and Leaderboard -->
            <div class="right-column">
              <div class="section board-section">
                <Board />
              </div>
              <LeaderboardSidebar />
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </main>

  <!-- Game Footer (only show when connected and registered) -->
  {#if gameState.isConnected && gameState.isRegistered}
    <GameFooter />
  {:else}
    <footer class="app-footer">
      <p>Tombola Web Client • Connected to Rust API Server</p>
    </footer>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: rgba(255, 255, 255, 0.95);
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    gap: 20px;
  }

  .header-left {
    text-align: left;
    flex: 1;
  }

  .header-right {
    text-align: right;
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .header-left h1 {
    margin: 0;
    color: #333;
    font-size: 2.5em;
  }

  .subtitle {
    margin: 5px 0 0 0;
    color: #666;
    font-size: 1.1em;
    font-weight: 500;
  }

  .player-name-display {
    font-weight: bold;
    color: #1976d2;
    font-size: 1.1em;
    padding: 8px 16px;
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 20px;
  }

  .app-main {
    flex: 1;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .connection-section,
  .registration-section {
    background: white;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    margin: 0 auto;
  }

  .connection-section h2,
  .registration-section h2 {
    margin: 0 0 16px 0;
    color: #333;
  }

  .connection-section p {
    margin: 16px 0;
    color: #666;
  }

  .form-group {
    margin-bottom: 16px;
    text-align: left;
  }

  .game-change-notice {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 20px;
    text-align: center;
  }

  .game-change-notice p {
    margin: 0;
    color: #856404;
    font-weight: 500;
  }

  .error-message {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 20px;
    text-align: center;
  }

  .error-message p {
    margin: 0;
    color: #721c24;
    font-weight: 500;
  }

  .form-group label {
    display: block;
    margin-bottom: 4px;
    font-weight: bold;
    color: #555;
  }

  .form-group input {
    width: 100%;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }

  .primary-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .primary-button:hover:not(:disabled) {
    background: #5a6fd8;
  }

  .primary-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .game-interface {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .main-content {
    display: grid;
    grid-template-columns: 1050px 320px;
    gap: 32px;
    align-items: start;
    justify-content: center;
  }

  .cards-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1050px;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }

  .section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .cards-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
  }

  .board-section {
    /* Remove background to match leaderboard style */
    background: transparent;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 16px; /* add some spacing between board and leaderboard */
  }

  .section h2 {
    margin: 0 0 16px 0;
    color: #333;
    text-align: center;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    justify-items: center;
    max-width: 1050px;
  }

  .app-footer {
    background: rgba(255, 255, 255, 0.9);
    padding: 16px;
    text-align: center;
    color: #666;
    margin-top: auto;
  }

  .app-footer p {
    margin: 0;
  }

  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
  }

  @media (max-width: 768px) {
    .app-header h1 {
      font-size: 2em;
    }

    .subtitle {
      font-size: 1em;
    }

    .app-main {
      padding: 16px;
    }

    .connection-section,
    .registration-section {
      padding: 24px 16px;
    }

    .header-content {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .header-right {
      text-align: center;
    }

    .main-content {
      grid-template-columns: 1fr;
      gap: 16px;
      justify-content: stretch;
    }

    .cards-column {
      max-width: 100%;
    }

    .cards-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }

    .right-column {
      order: -1; /* Show board and achievements above cards on mobile */
    }
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    .main-content {
      grid-template-columns: 1fr 300px;
      justify-content: stretch;
    }

    .cards-column {
      max-width: 100%;
    }

    .cards-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }
  }

  /* Cards responsive breakpoints */
  @media (max-width: 1399px) and (min-width: 1025px) {
    .main-content {
      grid-template-columns: 1fr 280px;
    }

    .cards-column {
      max-width: 100%;
    }

    .cards-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }
  }
</style>
