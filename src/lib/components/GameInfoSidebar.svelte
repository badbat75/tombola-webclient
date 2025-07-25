<script lang="ts">
  import { gameState, clientUtils } from '$lib/gameStore.svelte.js';
  import { tombolaApi } from '$lib/api.js';
  import type { PlayersResponse, Player } from '$lib/types.js';

  // State for players data
  let playersData = $state<PlayersResponse | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Cache for resolved client names
  let resolvedNames = $state<Map<string, string>>(new Map());
  let resolvingClients = $state<Set<string>>(new Set());

  // Function to resolve client ID to name via API
  async function resolveClientName(clientId: string): Promise<void> {
    // Skip board client and already resolved/resolving clients
    if (clientId === "0000000000000000" ||
        resolvedNames.has(clientId) ||
        resolvingClients.has(clientId)) {
      return;
    }

    try {
      resolvingClients.add(clientId);
      const clientInfo = await tombolaApi.getClientById(clientId);
      resolvedNames.set(clientId, clientInfo.name);
      // Also update the main client cache
      clientUtils.cacheClientName(clientId, clientInfo.name);

      // Trigger reactivity
      resolvedNames = new Map(resolvedNames);
      resolvingClients.delete(clientId);
    } catch (error) {
      resolvingClients.delete(clientId);
      console.warn(`Failed to resolve client name for ${clientId}:`, error);
    }
  }

  // Get display name for client
  function getClientDisplayName(clientId: string): string {
    // Special case for board client
    if (clientId === "0000000000000000") {
      return "Board";
    }

    // Check if we have a resolved name from API
    if (resolvedNames.has(clientId)) {
      return resolvedNames.get(clientId)!;
    }

    // Check main cache (from registration)
    const cachedName = clientUtils.getClientName(clientId);
    if (cachedName && cachedName !== "Board") {
      return cachedName;
    }

    // Fallback to shortened client ID
    return clientId.slice(-8);
  }

  // Load players data
  async function loadPlayers() {
    if (!gameState.isConnected || !gameState.gameId) return;

    try {
      loading = true;
      error = null;
      const data = await tombolaApi.getPlayers();
      playersData = data;

      // Resolve client names for all players
      for (const player of data.players) {
        await resolveClientName(player.client_id);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
      error = err instanceof Error ? err.message : 'Failed to load players';
    } finally {
      loading = false;
    }
  }

  // Auto-refresh setup
  $effect(() => {
    if (gameState.isConnected && gameState.isRegistered) {
      // Initial load
      loadPlayers();

      // Set up auto-refresh every 5 seconds
      refreshInterval = setInterval(() => {
        if (!loading) {
          loadPlayers();
        }
      }, 5000);

      // Cleanup on component destroy or state change
      return () => {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
      };
    } else {
      // Clear data when disconnected
      playersData = null;
      error = null;
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }
  });
</script>

<div class="game-info-sidebar">
  <div class="game-info-content">
    <h3 class="game-info-title">Game Info</h3>

    {#if error}
      <div class="error">
        <p>❌ {error}</p>
      </div>
    {:else if loading && !playersData}
      <div class="loading">
        <p>🔄 Loading...</p>
      </div>
    {:else if playersData}
      <!-- Game Status -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Game ID:</span>
          <span class="info-value game-id">{playersData.game_id}</span>
        </div>
        {#if gameState.gameStatus}
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value status-{gameState.gameStatus.status?.toLowerCase()}">
              {#if gameState.gameStatus.status?.toLowerCase() === 'new'}
                🆕 New
              {:else if gameState.gameStatus.status?.toLowerCase() === 'active'}
                🎯 Active
              {:else if gameState.gameStatus.status?.toLowerCase() === 'closed'}
                ✅ Closed
              {:else}
                {gameState.gameStatus.status}
              {/if}
            </span>
          </div>
        {/if}
        <div class="info-row">
          <span class="info-label">Players:</span>
          <span class="info-value">👥 {playersData.total_players}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Cards:</span>
          <span class="info-value">🎯 {playersData.total_cards}</span>
        </div>
      </div>

      <!-- Players List -->
      <div class="players-section">
        <h4>Players & Cards</h4>
        <div class="players-list">
          {#each playersData.players as player (player.client_id)}
            <div class="player-item">
              <span class="player-name">
                {#if player.client_type === 'board'}
                  👑 {getClientDisplayName(player.client_id)}
                {:else}
                  👤 {getClientDisplayName(player.client_id)}
                {/if}
              </span>
              <span class="card-count">
                {#if player.client_type === 'board'}
                  Board
                {:else}
                  {player.card_count} cards
                {/if}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="no-data">
        <p>No game data available</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .game-info-sidebar {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .game-info-content {
    padding: var(--spacing-lg);
    flex: 1;
    overflow-y: auto;
  }

  .game-info-title {
    margin: 0 0 var(--spacing-lg) 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-color-primary);
    text-align: center;
    padding-bottom: var(--spacing-base);
    border-bottom: 2px solid var(--border-color-light);
  }

  .info-section {
    margin-bottom: 24px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-weight: 500;
    color: #666;
    font-size: 0.9em;
  }

  .info-value {
    font-weight: 600;
    color: #333;
    font-size: 0.9em;
  }

  .game-id {
    font-family: 'Courier New', monospace;
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8em;
  }

  .status-new {
    color: #4a90e2;
  }

  .status-active {
    color: #28a745;
  }

  .status-closed {
    color: #6c757d;
  }

  .players-section h4 {
    margin: 0 0 16px 0;
    color: #333;
    font-size: 1em;
    font-weight: 600;
    border-bottom: 2px solid #e9ecef;
    padding-bottom: 8px;
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .player-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .player-item:last-child {
    border-bottom: none;
  }

  .player-name {
    font-weight: 500;
    color: #333;
    font-size: 0.9em;
  }

  .card-count {
    font-weight: 500;
    color: #4a90e2;
    font-size: 0.85em;
  }

  .error, .loading, .no-data {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .error {
    color: #dc3545;
    background: #f8d7da;
    border-radius: 6px;
    padding: 12px;
  }

  .error p {
    margin: 0;
  }

  .loading p, .no-data p {
    margin: 0;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .game-info-content {
      padding: 16px;
    }

    .info-row {
      padding: 6px 0;
    }

    .player-item {
      padding: 6px 0;
    }
  }
</style>
