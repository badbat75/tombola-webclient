<script lang="ts">
  import { gameState, gameActions } from '$lib/gameStore.svelte.js';
  import { authStore } from '$lib/stores/auth.js';
  import { userRegistrationStore } from '$lib/stores/userRegistration.js';

  interface Props {
    showGameInfo?: boolean;
    authEnabled?: boolean;
  }

  let { showGameInfo = false, authEnabled = true }: Props = $props();

  async function handleRefresh() {
    // On homepage, only refresh if we're in a proper game context
    if (showGameInfo && gameState.gameId && gameState.isRegistered && gameState.isConnected) {
      // Only refresh if we're properly registered and connected to the game
      await gameActions.refreshGameState();
    } else {
      // Clear any stale errors when not in a valid game context
      gameActions.clearError();
    }
  }
</script>

<footer class="game-footer">
  <div class="footer-content">
    <!-- Connection Status (always show first) -->
    <div class="status-item">
      <span class="status-dot connected"></span>
      <span class="status-text">Connected</span>
    </div>

    <!-- User Status -->
    {#if authEnabled && $authStore.state === 'authenticated'}
      <div class="status-item">
        <span class="label">User:</span>
        <span class="value">{$authStore.user?.name || $authStore.user?.email || 'User'}</span>
      </div>
    {:else if $userRegistrationStore.isRegistered}
      <div class="status-item">
        <span class="label">ClientID:</span>
        <span class="value">{$userRegistrationStore.clientId}</span>
      </div>
    {/if}

    <!-- Game-specific information (only if in a game context) -->
    {#if showGameInfo}
      <!-- Player Info -->
      {#if gameState.isRegistered && gameState.clientId}
        <div class="status-item">
          <span class="label">Player:</span>
          <span class="value">{gameState.clientId.slice(-8)}</span>
        </div>
      {/if}

      <!-- Game Info -->
      {#if gameState.gameStatus}
        <div class="status-item">
          <span class="label">Game:</span>
          <span class="value">{gameState.gameStatus.game_id}</span>
        </div>
      {/if}

      <!-- Game Progress -->
      <div class="status-item">
        <span class="label">Extracted:</span>
        <span class="value">{gameState.board.numbers.length}/90</span>
      </div>

      <div class="status-item">
        <span class="label">Remaining:</span>
        <span class="value">{gameState.pouch.numbers.length}/90</span>
      </div>

      <!-- Published Score -->
      <div class="status-item">
        <span class="label">Score:</span>
        <span class="value score-highlight">{gameState.scoreCard.published_score}</span>
      </div>

      <!-- Refresh Button -->
      <div class="action-item">
        <button onclick={handleRefresh} class="refresh-button">
          🔄 Refresh
        </button>
      </div>
    {/if}

    <!-- Error Display -->
    {#if gameState.error}
      <div class="error-item">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{gameState.error}</span>
        <button onclick={() => gameState.error = null} class="close-error">×</button>
      </div>
    {/if}
  </div>
</footer>

<style>
  .game-footer {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    position: sticky;
    bottom: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 1200px;
    margin: 0 auto;
    font-size: 0.9em;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .action-item {
    display: flex;
    align-items: center;
  }

  .refresh-button {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.3);
    color: #81c784;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-button:hover {
    background: rgba(76, 175, 80, 0.3);
    border-color: rgba(76, 175, 80, 0.5);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f44336;
    flex-shrink: 0;
  }

  .status-dot.connected {
    background: #4caf50;
  }

  .status-text {
    font-weight: 500;
  }

  .label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85em;
  }

  .value {
    font-weight: 600;
    color: white;
  }

  .score-highlight {
    color: #ffc107;
    font-weight: bold;
  }

  .error-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(244, 67, 54, 0.2);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }

  .error-text {
    color: #ffcdd2;
    font-size: 0.85em;
  }

  .close-error {
    background: none;
    border: none;
    color: #ffcdd2;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .close-error:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    .footer-content {
      gap: 12px;
      font-size: 0.8em;
    }

    .status-item {
      gap: 3px;
    }

    .error-item {
      flex: 1 1 100%;
      justify-content: center;
    }
  }
</style>
