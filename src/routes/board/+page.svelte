<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { gameState, gameActions } from '$lib/gameStore.svelte.js';
  import Board from '$lib/components/Board.svelte';
  import GameFooter from '$lib/components/GameFooter.svelte';
  import LeaderboardSidebar from '$lib/components/LeaderboardSidebar.svelte';
  import { tombolaApi } from '$lib/api.js';

  // Get server-side auth configuration
  let { data } = $props();
  const { authEnabled } = data;

  let isConnecting = $state(false);
  let isRegistering = $state(false);
  let isExtracting = $state(false);
  let lastExtractionResult = $state<string | null>(null);
  let gameIdSet = $state(false);

  // Redirect if user signs out (but only if auth is enabled)
  $effect(() => {
    // Only redirect on signout if authentication is enabled server-side
    if (authEnabled && $authStore.state === 'unauthenticated' && gameIdSet) {
      alert('You have been signed out. Redirecting to home page.');
      goto('/');
    }
  });

  // Auto re-register board viewer when connection is restored or game changes
  $effect(() => {
    if (gameState.isConnected && !gameState.isRegistered && !isRegistering && gameIdSet) {
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
    // Allow access without authentication - let server handle auth requirements
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
      // Auto-register as board client (no API call needed)
      await handleRegister();
      // Start auto-refresh
      gameActions.startAutoRefresh(2000);
    }
  });

  async function handleConnect() {
    if (!gameIdSet) return;

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
    await gameActions.registerAsBoard(); // Register as board client with special ID
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
</script>

<div class="app">
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
    .app-main {
      padding: 16px;
    }

    .connection-section {
      padding: 24px 16px;
    }

    .control-panel {
      padding: 16px;
    }
  }
</style>
