<script lang="ts">
  import { gameState, gameUtils } from '$lib/gameStore.svelte.js';

  const achievements = $derived(() => gameUtils.getPlayerAchievements());
</script>

<div class="game-status">
  <div class="status-header">
    <h3>Game Status</h3>
    {#if gameState.gameStatus}
      <div class="game-info">
        <span class="game-id">Game: {gameState.gameStatus.game_id}</span>
        <span class="created-at">Started: {new Date(gameState.gameStatus.created_at).toLocaleString()}</span>
      </div>
    {/if}
  </div>

  <div class="status-grid">
    <!-- Connection Status -->
    <div class="status-item">
      <span class="label">Connection:</span>
      <span class="value" class:connected={gameState.isConnected} class:disconnected={!gameState.isConnected}>
        {gameState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </span>
    </div>

    <!-- Registration Status -->
    <div class="status-item">
      <span class="label">Player:</span>
      <span class="value">
        {gameState.isRegistered ? `✅ ${gameState.playerName}` : '❌ Not registered'}
      </span>
    </div>

    <!-- Cards Count -->
    <div class="status-item">
      <span class="label">Cards:</span>
      <span class="value">{gameState.cards.length}</span>
    </div>

    <!-- Numbers Extracted -->
    <div class="status-item">
      <span class="label">Numbers Extracted:</span>
      <span class="value">{gameState.board.numbers.length}/90</span>
    </div>

    <!-- Numbers Remaining -->
    <div class="status-item">
      <span class="label">Numbers Remaining:</span>
      <span class="value">{gameState.pouch.numbers.length}</span>
    </div>

    <!-- Published Score -->
    <div class="status-item">
      <span class="label">Published Score:</span>
      <span class="value">{gameState.scoreCard.published_score}</span>
    </div>
  </div>

  {#if gameState.isRegistered && gameState.cards.length > 0}
    <div class="player-achievements">
      <h4>Your Achievements</h4>
      <div class="achievements-grid">
        <div class="achievement">
          <span class="label">Best Score:</span>
          <span class="value score-value">{achievements().score}/15</span>
        </div>

        {#if achievements().lines.length > 0}
          <div class="achievement">
            <span class="label">Lines Completed:</span>
            <span class="value lines-value">{achievements().lines.join(', ')}</span>
          </div>
        {/if}

        {#if achievements().bingo}
          <div class="achievement bingo-achievement">
            <span class="label">BINGO!</span>
            <span class="value">🎉</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Error Display -->
  {#if gameState.error}
    <div class="error-banner">
      <span class="error-icon">⚠️</span>
      <span class="error-message">{gameState.error}</span>
      <button onclick={() => gameState.error = null} class="close-error">×</button>
    </div>
  {/if}
</div>

<style>
  .game-status {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .status-header {
    margin-bottom: 16px;
  }

  .status-header h3 {
    margin: 0 0 8px 0;
    color: #333;
  }

  .game-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9em;
    color: #666;
  }

  .game-id {
    font-family: monospace;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .label {
    font-weight: bold;
    color: #555;
  }

  .value {
    color: #333;
  }

  .value.connected {
    color: #4caf50;
  }

  .value.disconnected {
    color: #f44336;
  }

  .player-achievements {
    border-top: 1px solid #eee;
    padding-top: 16px;
    margin-top: 16px;
  }

  .player-achievements h4 {
    margin: 0 0 12px 0;
    color: #333;
  }

  .achievements-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .achievement {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background: #e3f2fd;
    border-radius: 4px;
    border: 1px solid #bbdefb;
  }

  .achievement .label {
    font-size: 0.9em;
    color: #1976d2;
  }

  .achievement .value {
    font-weight: bold;
    color: #0d47a1;
  }

  .score-value {
    color: #007acc !important;
  }

  .lines-value {
    color: #ff6b35 !important;
  }

  .bingo-achievement {
    background: #ffebee;
    border-color: #ffcdd2;
    animation: pulse 1s infinite;
  }

  .bingo-achievement .label,
  .bingo-achievement .value {
    color: #c62828 !important;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
    margin-top: 16px;
    color: #c62828;
  }

  .error-message {
    flex: 1;
  }

  .close-error {
    background: none;
    border: none;
    font-size: 18px;
    color: #c62828;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-error:hover {
    background: rgba(198, 40, 40, 0.1);
    border-radius: 50%;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  @media (max-width: 600px) {
    .status-grid {
      grid-template-columns: 1fr;
    }

    .game-info {
      font-size: 0.8em;
    }

    .achievements-grid {
      flex-direction: column;
    }

    .error-banner {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
