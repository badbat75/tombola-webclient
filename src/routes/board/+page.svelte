<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { gameState, gameActions } from '$lib/gameStore.svelte.js';
  import Board from '$lib/components/Board.svelte';
  import GameFooter from '$lib/components/GameFooter.svelte';
  import LeaderboardSidebar from '$lib/components/LeaderboardSidebar.svelte';
  import GameInfoSidebar from '$lib/components/GameInfoSidebar.svelte';
  import { tombolaApi } from '$lib/api.js';

  // Get server-side auth configuration
  let { data } = $props();
  const { authEnabled } = data;

  let isConnecting = $state(false);
  let isRegistering = $state(false);
  let isExtracting = $state(false);
  let lastExtractionResult = $state<string | null>(null);
  let gameIdSet = $state(false);

  // Computed properties for game state
  let isGameEnded = $derived(gameState.gameStatus?.status?.toLowerCase() === 'closed' || gameState.pouch.numbers.length === 0);
  let canExtractNumbers = $derived(gameState.isConnected && !isExtracting && !isGameEnded);

  // Redirect if user signs out (but only if auth is enabled)
  $effect(() => {
    // Only redirect on signout if authentication is enabled server-side
    if (authEnabled && $authStore.state === 'unauthenticated' && gameIdSet) {
      alert('You have been signed out. Redirecting to home page.');
      goto('/');
    }
  });

  // Auto re-register board viewer when connection is restored or game changes
  // But only if we haven't already failed registration to avoid infinite loops
  $effect(() => {
    if (gameState.isConnected && !gameState.isRegistered && !isRegistering && gameIdSet) {
      // Check if there's already a registration error - if so, don't auto-retry
      if (gameState.error && gameState.error.includes('Board access denied')) {
        return; // Don't auto-retry if we already got a board access denied error
      }

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

    // Restore client state from localStorage first
    gameActions.restoreClientState();

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
      // Only try to register if we don't already have an access denied error
      if (!gameState.error || !gameState.error.includes('Board access denied')) {
        // Check if already registered as board, if not, register
        if (!gameState.isRegistered) {
          await handleRegister();
        }
      }
      // Start auto-refresh regardless of registration status
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

    const success = await gameActions.registerAsBoard();

    if (!success) {
      // If registration fails, show error and redirect back to home page after a delay
      const errorMsg = gameState.error || 'Unable to register as board operator';

      setTimeout(() => {
        if (errorMsg.includes('Only the game creator')) {
          alert('Board access denied: ' + errorMsg + '\n\nYou can only access board mode for games you created.');
        } else {
          alert('Board access denied: ' + errorMsg);
        }
        goto('/');
      }, 1000);
    }

    isRegistering = false;
  }  async function handleExtractNumber() {
    if (isExtracting || !canExtractNumbers) return;

    isExtracting = true;
    lastExtractionResult = null;

    try {
      const result = await tombolaApi.extractNumber();
      lastExtractionResult = `Extracted: ${result.extracted_number} (${result.numbers_remaining} remaining)`;

      // Refresh game state after extraction
      await gameActions.refreshGameState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract number';

      // Check for specific error conditions
      if (errorMessage.includes('board owner') || errorMessage.includes('creator')) {
        lastExtractionResult = `Error: Only the game creator can extract numbers. Create a new game to become a board operator.`;
      } else if (errorMessage.includes('no numbers') || errorMessage.includes('empty')) {
        lastExtractionResult = `Error: No numbers remaining in the pouch. Game is complete!`;
      } else {
        lastExtractionResult = `Error: ${errorMessage}`;
      }
    } finally {
      isExtracting = false;
    }
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
                  disabled={!canExtractNumbers || isGameEnded}
                  class="extract-button"
                  class:game-ended={isGameEnded}
                >
                  {#if isGameEnded}
                    🏁 Game Ended
                  {:else if isExtracting}
                    Extracting...
                  {:else}
                    Extract Number
                  {/if}
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar with Leaderboard and Game Info -->
          <div class="sidebar">
            <LeaderboardSidebar />
            <GameInfoSidebar />
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
    background: var(--primary-gradient);
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
    gap: var(--spacing-xl);
  }

  .control-panel {
    background: var(--container-bg-solid);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
    box-shadow: var(--box-shadow);
  }

  .control-buttons {
    display: flex;
    gap: var(--spacing-base);
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

  .extract-button.game-ended {
    background: #9e9e9e !important;
    color: #ffffff !important;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .extract-button.game-ended:hover {
    background: #9e9e9e !important;
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
    gap: var(--spacing-xl);
    align-items: start;
  }

  .board-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .board-display {
    background: var(--container-bg-solid);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    box-shadow: var(--box-shadow);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .app-footer {
    background: rgba(255, 255, 255, 0.9);
    padding: var(--spacing-base);
    text-align: center;
    color: var(--text-color-secondary);
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
      gap: var(--spacing-base);
    }

    .board-column {
      gap: var(--spacing-base);
    }

    .control-buttons {
      flex-direction: column;
      align-items: center;
    }
  }

  @media (max-width: 768px) {
    .app-main {
      padding: var(--spacing-base);
    }

    .connection-section {
      padding: var(--spacing-xl) var(--spacing-base);
    }

    .control-panel {
      padding: var(--spacing-base);
    }
  }
</style>
