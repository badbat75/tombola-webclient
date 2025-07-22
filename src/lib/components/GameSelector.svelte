<script lang="ts">
  import { onMount } from 'svelte';
  import { tombolaApi } from '../api.js';
  import type { GameInfo, GameStatus } from '../types.js';
  import { getScoreText, getScoreColor } from '../scoreUtils.js';

  interface Props {
    onGameSelected: (gameId: string) => void;
    readonly?: boolean;
    authEnabled?: boolean;
  }

  let { onGameSelected, readonly = false, authEnabled = true }: Props = $props();

  let games: GameInfo[] = $state([]);
  let gameDetails = $state<Map<string, GameStatus>>(new Map());
  let gameStats = $state<any>(null);
  let loading = $state(true);
  let creating = $state(false);
  let error = $state<string | null>(null);

  onMount(async () => {
    await loadGames();
  });

  async function loadGames() {
    try {
      loading = true;
      error = null;
      const response = await tombolaApi.getGamesList();
      games = response.games;
      gameStats = response.statistics;

      // Load detailed status for each game
      await loadGameDetails();
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
      } catch (err) {
        console.warn(`Failed to load details for game ${game.game_id}:`, err);
      }
    });

    await Promise.all(statusPromises);
    gameDetails = detailsMap;
  }

  function selectGame(gameId: string) {
    onGameSelected(gameId);
  }

  async function createNewGame() {
    try {
      creating = true;
      error = null;

      const response = await tombolaApi.createNewGame();

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
        <button class="create-btn" onclick={createNewGame} disabled={creating || loading}>
          {creating ? '🔄 Creating...' : '🆕 Create New Game'}
        </button>
      {/if}
      <button class="refresh-btn" onclick={loadGames} disabled={loading}>
        {loading ? '🔄' : '↻'} Refresh
      </button>
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
        <button class="create-game-primary" onclick={createNewGame} disabled={creating}>
          {creating ? '🔄 Creating...' : '🆕 Create Your First Game'}
        </button>
      {/if}
    </div>
  {:else}
    <div class="games-grid">
      {#each games as game (game.game_id)}
        {@const detail = getGameDetail(game.game_id)}
        <div
          class="game-card"
          onclick={() => selectGame(game.game_id)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectGame(game.game_id) : null}
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
              <span class="value">{formatDate(game.start_date)}</span>
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
            {#if game.close_date}
              <div class="info-row">
                <span class="label">Closed:</span>
                <span class="value">{formatDate(game.close_date)}</span>
              </div>
            {/if}
          </div>

          <button class="select-btn">
            {game.status === 'new' ? 'Join Game' : game.status === 'active' ? 'Join Active Game' : 'View Game'}
          </button>
        </div>
      {/each}
    </div>
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

  .refresh-btn {
    background: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover:not(:disabled) {
    background: #e9ecef;
    border-color: #adb5bd;
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    color: #6c757d;
  }

  .loading p, .no-games p {
    margin: 0;
    font-size: 1.2em;
  }

  .create-game-primary {
    background: #28a745;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    margin-top: 20px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }

  .create-game-primary:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4);
  }

  .create-game-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
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
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-height: 280px;
    display: flex;
    flex-direction: column;
  }

  .game-card:hover {
    border-color: #4a90e2;
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .game-card:focus {
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

  .progress-bar {
    position: relative;
    background: #e9ecef;
    border-radius: 8px;
    height: 20px;
    margin: 8px 0;
    overflow: hidden;
  }

  .progress-fill {
    background: linear-gradient(90deg, #28a745, #20c997);
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
