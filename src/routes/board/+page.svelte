<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, gameActions } from '$lib/gameStore.svelte.js';
  import Board from '$lib/components/Board.svelte';
  import GameFooter from '$lib/components/GameFooter.svelte';
  import LeaderboardSidebar from '$lib/components/LeaderboardSidebar.svelte';
  import { tombolaApi } from '$lib/api.js';

  let isConnecting = $state(false);
  let isRegistering = $state(false);
  let isExtracting = $state(false);
  let lastExtractionResult = $state<string | null>(null);

  // Auto re-register board viewer when connection is restored or game changes
  $effect(() => {
    if (gameState.isConnected && !gameState.isRegistered && !isRegistering) {
      // Delay the re-registration slightly to avoid rapid successive calls
      setTimeout(() => {
        if (gameState.isConnected && !gameState.isRegistered && !isRegistering) {
          handleRegister();
        }
      }, 100);
    }
  });

  // Try to connect on mount
  onMount(async () => {
    await gameActions.connect();
    if (gameState.isConnected) {
      // Auto-register as board viewer
      await handleRegister();
      // Start auto-refresh
      gameActions.startAutoRefresh(2000);
    }
  });

  async function handleConnect() {
    isConnecting = true;
    const success = await gameActions.connect();
    if (success) {
      await handleRegister();
      gameActions.startAutoRefresh(2000);
    }
    isConnecting = false;
  }

  async function handleRegister() {
    gameActions.clearError();
    isRegistering = true;
    await gameActions.register('Board Viewer', 0); // Register as viewer with 0 cards
    isRegistering = false;
  }

  async function handleExtractNumber() {
    if (isExtracting) return;

    isExtracting = true;
    lastExtractionResult = null;

    try {
      const result = await tombolaApi.extractNumber();
      lastExtractionResult = `Extracted: ${result.extracted_number} (${result.numbers_remaining} remaining)`;

      // Refresh game state to show the new number
      await gameActions.refreshGameState();
    } catch (error) {
      lastExtractionResult = `Error: ${error instanceof Error ? error.message : 'Failed to extract number'}`;
    }

    isExtracting = false;
  }

  async function handleNewGame() {
    try {
      await tombolaApi.newGame();
      lastExtractionResult = 'New game started!';
      await gameActions.refreshGameState();

      // Re-register as board viewer if registration was lost due to game change
      if (!gameState.isRegistered) {
        await handleRegister();
      }
    } catch (error) {
      lastExtractionResult = `Error: ${error instanceof Error ? error.message : 'Failed to start new game'}`;
    }
  }

  async function handleDumpGame() {
    try {
      await tombolaApi.dumpGame();
      lastExtractionResult = 'Game dumped!';
      await gameActions.refreshGameState();
    } catch (error) {
      lastExtractionResult = `Error: ${error instanceof Error ? error.message : 'Failed to dump game'}`;
    }
  }
</script>

<div class="app">
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1>🎯 Tombola Board</h1>
        <p class="subtitle">Board Operator Interface</p>
      </div>
      <div class="header-right">
        <div class="board-name-display">Board</div>
      </div>
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
      <!-- Board Interface -->
      <div class="board-interface">
        <!-- Main Game Area -->
        <div class="main-game-area">
          <!-- Board Column -->
          <div class="board-column">
            <!-- Board Display -->
            <div class="board-display">
              <Board size="large" />
            </div>

            <!-- Control Panel -->
            <div class="control-panel">
              {#if gameState.error}
                <div class="error-message">
                  <p>{gameState.error}</p>
                </div>
              {/if}

              <div class="control-buttons">
                <button
                  onclick={handleExtractNumber}
                  disabled={isExtracting || !gameState.isConnected}
                  class="extract-button"
                >
                  {isExtracting ? 'Extracting...' : 'Extract Number'}
                </button>

                <button
                  onclick={handleNewGame}
                  disabled={!gameState.isConnected}
                  class="new-game-button"
                >
                  New Game
                </button>

                <button
                  onclick={handleDumpGame}
                  disabled={!gameState.isConnected}
                  class="dump-game-button"
                >
                  Dump Game
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar with Leaderboard -->
          <div class="sidebar">
            <LeaderboardSidebar />
          </div>
        </div>
      </div>
    {/if}
  </main>

  <!-- Game Footer (only show when connected and registered) -->
  {#if gameState.isConnected && gameState.isRegistered}
    <GameFooter />
  {:else}
    <footer class="app-footer">
      <p>Tombola Board Interface • Connected to Rust API Server</p>
    </footer>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #4a90e2 0%, #2c5aa0 100%);
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
    max-width: 1400px;
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

  .board-name-display {
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
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .connection-section {
    background: white;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    margin: 0 auto;
  }

  .connection-section h2 {
    margin: 0 0 16px 0;
    color: #333;
  }

  .connection-section p {
    margin: 16px 0;
    color: #666;
  }

  .board-interface {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .control-panel {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .control-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .extract-button {
    background: #4caf50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s ease;
    min-width: 140px;
  }

  .extract-button:hover:not(:disabled) {
    background: #45a049;
  }

  .new-game-button {
    background: #2196f3;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s ease;
    min-width: 120px;
  }

  .new-game-button:hover:not(:disabled) {
    background: #1976d2;
  }

  .dump-game-button {
    background: #ff9800;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s ease;
    min-width: 120px;
  }

  .dump-game-button:hover:not(:disabled) {
    background: #f57c00;
  }

  button:disabled {
    background: #ccc !important;
    cursor: not-allowed;
  }

  .primary-button {
    background: #4a90e2;
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
    background: #357abd;
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

  .main-game-area {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
  }

  .board-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .board-display {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
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

  @media (max-width: 1024px) {
    .main-game-area {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .board-column {
      gap: 16px;
    }

    .control-buttons {
      flex-direction: column;
      align-items: center;
    }
  }

  @media (max-width: 768px) {
    .app-header h1 {
      font-size: 2em;
    }

    .app-main {
      padding: 16px;
    }

    .connection-section {
      padding: 24px 16px;
    }

    .control-panel {
      padding: 16px;
    }

    .header-content {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .header-right {
      text-align: center;
    }
  }
</style>
