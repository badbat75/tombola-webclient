<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { gameState, gameActions } from '$lib/gameStore.svelte.js';
  import { tombolaApi } from '$lib/api.js';
  import Card from '$lib/components/Card.svelte';
  import Board from '$lib/components/Board.svelte';
  import GameFooter from '$lib/components/GameFooter.svelte';
  import LeaderboardSidebar from '$lib/components/LeaderboardSidebar.svelte';
  import GameInfoSidebar from '$lib/components/GameInfoSidebar.svelte';
  import ScoreBoard from '$lib/components/ScoreBoard.svelte';

  // Get server-side auth configuration
  let { data } = $props();
  const { authEnabled } = data;

  let isConnecting = $state(false);
  let gameIdSet = $state(false);

  // Redirect if user signs out (but only if auth is enabled)
  $effect(() => {
    // Only redirect on signout if authentication is enabled server-side
    if (authEnabled && $authStore.state === 'unauthenticated' && gameIdSet) {
      alert('You have been signed out. Redirecting to home page.');
      goto('/');
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
      // Check if there's an existing registration in localStorage
      const existingClientId = localStorage.getItem('tombola-client-id');
      const existingUserName = localStorage.getItem('tombola-user-name');

      if (existingClientId && existingUserName && !gameState.isRegistered) {
        gameState.clientId = existingClientId;
        gameState.playerName = existingUserName;
        gameState.isRegistered = true;
        tombolaApi.setClientId(existingClientId);

        // Load cards for this registered user
        await gameActions.loadCards();
      }

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
    {:else if !gameState.isRegistered}
      <!-- Not registered - redirect to home -->
      <div class="registration-section">
        <h2>No Player Registration Found</h2>
        <p>You need to join a game first. Please go back to the home page and select a game to join.</p>
        <button onclick={() => goto('/')} class="primary-button">
          Go to Home Page
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
            {:else}
              <div class="section cards-section">
                <h2>No Cards Generated</h2>
                <p>You haven't generated any cards yet. Please go back to the home page and join a game.</p>
                <button onclick={() => goto('/')} class="primary-button">
                  Go to Home Page
                </button>
              </div>
            {/if}
          </div>

          <!-- Right Column: Board and Leaderboard -->
          <div class="right-column">
            <div class="section board-section">
              <Board />
            </div>
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
      <p>Tombola Web Client • Connected to Rust API Server</p>
    </footer>
  {/if}
</div>

<style>
  :global(body) {
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
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .connection-section,
  .registration-section {
    background: var(--container-bg-solid);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-2xl);
    text-align: center;
    box-shadow: var(--box-shadow-heavy);
    max-width: 500px;
    margin: 0 auto;
  }

  .connection-section h2,
  .registration-section h2 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--text-color-primary);
  }

  .connection-section p,
  .registration-section p {
    margin: var(--spacing-base) 0;
    color: var(--text-color-secondary);
  }

  .game-interface {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .main-content {
    display: grid;
    grid-template-columns: 1050px 320px;
    gap: var(--spacing-2xl);
    align-items: start;
    justify-content: center;
  }

  .cards-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    max-width: 1050px;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    height: 100%;
  }

  .cards-section {
    background: var(--container-bg-solid);
    border-radius: var(--border-radius-md);
    box-shadow: var(--box-shadow-light);
    overflow-y: auto;
  }

  .board-section {
    /* Remove background to match leaderboard style */
    background: transparent;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .section h2 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--text-color-primary);
    text-align: center;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
    justify-items: center;
    max-width: 1050px;
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

  @media (max-width: 768px) {
    .app-main {
      padding: var(--spacing-base);
    }

    .connection-section,
    .registration-section {
      padding: var(--spacing-xl) var(--spacing-base);
    }

    .main-content {
      grid-template-columns: 1fr;
      gap: var(--spacing-base);
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
