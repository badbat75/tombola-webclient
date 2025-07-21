<script lang="ts">
  import { gameState, gameUtils } from '$lib/gameStore.svelte.js';

  // Get all achievements for each card
  const cardAchievements = $derived(() => {
    return gameState.cards.map(card => {
      const achievement = gameUtils.getCardAchievement(card.card_id);
      const score = gameUtils.getCardScore(card);
      const lines = gameUtils.getCardLines(card);
      const bingo = gameUtils.isBingo(card);

      return {
        cardId: card.card_id,
        achievement,
        score,
        lines,
        bingo
      };
    });
  });

  // Get overall player stats
  const playerStats = $derived(() => gameUtils.getPlayerAchievements());
</script>

<div class="achievements-sidebar">
  <h3>🏆 Achievements</h3>

  <!-- Overall Stats -->
  <div class="overall-stats">
    <div class="stat-item">
      <span class="stat-label">Best Score:</span>
      <span class="stat-value">{playerStats().score}/15</span>
    </div>

    {#if playerStats().lines.length > 0}
      <div class="stat-item">
        <span class="stat-label">Lines:</span>
        <span class="stat-value lines-value">{playerStats().lines.join(', ')}</span>
      </div>
    {/if}

    {#if playerStats().bingo}
      <div class="stat-item bingo-stat">
        <span class="stat-label">BINGO!</span>
        <span class="stat-value">🎉</span>
      </div>
    {/if}
  </div>

  <!-- Card-by-Card Achievements -->
  {#if gameState.cards.length > 0}
    <div class="card-achievements">
      <h4>Card Progress</h4>
      {#each cardAchievements() as cardAchievement, index}
        <div class="card-achievement" class:has-bingo={cardAchievement.bingo}>
          <div class="card-header">
            <span class="card-number">Card {index + 1}</span>
            <span class="card-score">{cardAchievement.score}/15</span>
          </div>

          {#if cardAchievement.achievement}
            <div class="achievement-badge" class:bingo={cardAchievement.achievement.text === 'BINGO'}>
              {cardAchievement.achievement.text}
            </div>
          {:else}
            <div class="no-achievement">No achievement yet</div>
          {/if}

          {#if cardAchievement.lines.length > 0}
            <div class="lines-info">
              Lines: {cardAchievement.lines.join(', ')}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Published Score Info -->
  <div class="published-score">
    <h4>Published Score</h4>
    <div class="score-display">
      {gameState.scoreCard.published_score}
    </div>
    <div class="score-description">
      Current achievement level recognized by the server
    </div>
  </div>
</div>

<style>
  .achievements-sidebar {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    height: fit-content;
    position: sticky;
    top: 20px;
  }

  .achievements-sidebar h3 {
    margin: 0 0 16px 0;
    color: #333;
    text-align: center;
    font-size: 1.2em;
  }

  .achievements-sidebar h4 {
    margin: 16px 0 8px 0;
    color: #555;
    font-size: 1em;
    border-bottom: 1px solid #eee;
    padding-bottom: 4px;
  }

  .overall-stats {
    margin-bottom: 16px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    margin-bottom: 4px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .stat-item.bingo-stat {
    background: #ffebee;
    border: 1px solid #ffcdd2;
    animation: pulse 1s infinite;
  }

  .stat-label {
    font-weight: 600;
    color: #555;
    font-size: 0.9em;
  }

  .stat-value {
    font-weight: bold;
    color: #333;
  }

  .lines-value {
    color: #ff6b35;
  }

  .card-achievements {
    margin-bottom: 16px;
  }

  .card-achievement {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid #eee;
    border-radius: 6px;
    background: #fafafa;
  }

  .card-achievement.has-bingo {
    background: #fff3e0;
    border-color: #ffcc02;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .card-number {
    font-weight: 600;
    color: #555;
    font-size: 0.9em;
  }

  .card-score {
    font-weight: bold;
    color: #007acc;
    font-size: 0.9em;
  }

  .achievement-badge {
    background: #e3f2fd;
    color: #1976d2;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.8em;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 4px;
  }

  .achievement-badge.bingo {
    background: #ffebee;
    color: #c62828;
    animation: pulse 0.8s infinite;
  }

  .no-achievement {
    color: #999;
    font-size: 0.8em;
    font-style: italic;
  }

  .lines-info {
    color: #ff6b35;
    font-size: 0.8em;
    font-weight: 500;
  }

  .published-score {
    border-top: 1px solid #eee;
    padding-top: 12px;
  }

  .score-display {
    text-align: center;
    font-size: 2em;
    font-weight: bold;
    color: #ffc107;
    background: #fff8e1;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    border: 2px solid #ffecb3;
  }

  .score-description {
    text-align: center;
    color: #666;
    font-size: 0.8em;
    line-height: 1.3;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  @media (max-width: 1024px) {
    .achievements-sidebar {
      position: relative;
      top: 0;
    }
  }
</style>
