<script lang="ts">
  import { gameState, gameUtils, clientUtils } from '$lib/gameStore.svelte.js';
  import { tombolaApi } from '$lib/api.js';
  import { getScoreText, getScoreColor, getNextScoreLevel, isBingo, isMajorAchievement } from '../scoreUtils.js';

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

  // Simple leaderboard data from scorecard
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

    // If we're currently resolving, show loading
    if (resolvingClients.has(clientId)) {
      return "Loading...";
    }

    // Fallback: show descriptive ID while API resolution is attempted
    return `Player ${clientId.slice(-6)}`;
  }

  // Get current player's stats
  const playerStats = $derived(() => gameUtils.getPlayerAchievements());

  // Simple leaderboard data from scorecard
  const topAchievements = $derived(() => {
    const achievements = [];

    // Get all achievements from score map and sort by score
    for (const [scoreStr, scoreAchievements] of Object.entries(gameState.scoreCard.score_map)) {
      const score = parseInt(scoreStr);
      for (const achievement of scoreAchievements) {
        achievements.push({
          clientId: achievement.client_id,
          cardId: achievement.card_id,
          score: score,
          numbers: achievement.numbers,
          isBingo: isBingo(score),
          isMajor: isMajorAchievement(score)
        });
      }
    }

    // Sort by score descending
    return achievements.sort((a, b) => b.score - a.score).slice(0, 10);
  });

  // Auto-resolve client names for achievements
  $effect(() => {
    topAchievements().forEach(achievement => {
      if (achievement.clientId !== "0000000000000000" &&
          !resolvedNames.has(achievement.clientId) &&
          !resolvingClients.has(achievement.clientId)) {
        resolveClientName(achievement.clientId);
      }
    });
  });
</script>

<div class="leaderboard-sidebar">
  <h3>🏆 Leaderboard</h3>

  <!-- Published Score Info - Show next achievement for all scores -->
  <div class="published-score">
    <h4>Next Achievement</h4>
    <div class="score-display">
      {#if gameState.scoreCard.published_score === 15}
        <span class="next-achievement">🎮 NEW GAME</span>
      {:else}
        {@const nextLevel = getNextScoreLevel(gameState.scoreCard.published_score)}
        {#if nextLevel}
          <span class="next-achievement" style="color: {getScoreColor(nextLevel)}">{getScoreText(nextLevel)}</span>
        {:else}
          <span class="next-achievement">⭐ 2 in line</span>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Top Achievements List -->
  <div class="leaderboard-list">
    <h4>Achievements</h4>

    {#if topAchievements().length === 0}
      <div class="no-achievements">
        No achievements yet
      </div>
    {:else}
      {#each topAchievements() as achievement, index}
        <div
          class="achievement-item"
          class:current-player={achievement.clientId === gameState.clientId}
          class:bingo={achievement.isBingo}
        >
          <div class="achievement-details">
            <div class="main-info">
              <span class="achievement-text" style="color: {getScoreColor(achievement.score)}">
                {getScoreText(achievement.score)}
              </span>
              <span class="separator"> - </span>
              <span class="client-name">{getClientDisplayName(achievement.clientId)}</span>
            </div>
            <div class="card-info">
              Card: {achievement.cardId.slice(-8)}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
    .leaderboard-sidebar {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .leaderboard-sidebar h3 {
    margin: 0 0 16px 0;
    color: #333;
    text-align: center;
    font-size: 1.2em;
  }

  .leaderboard-sidebar h4 {
    margin: 8px 0 8px 0;
    color: #555;
    font-size: 1.12em;
    padding-bottom: 4px;
  }

  .published-score {
    margin-bottom: 8px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }

  .score-display {
    text-align: center;
    font-size: 1em;
    font-weight: 600;
    color: #ffc107;
    background: #fff8e1;
    border-radius: 6px;
    padding: 8px;
    margin: 4px 0;
    border: 1px solid #ffecb3;
  }

  .score-display .next-achievement {
    color: #333;
    font-weight: bold;
  }

  .leaderboard-list {
    flex: 1;
    margin-top: 0;
    display: flex;
    flex-direction: column;
  }

  .no-achievements {
    text-align: center;
    color: #999;
    font-style: italic;
    padding: 20px;
  }

  .achievement-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    margin-bottom: 4px;
    transition: background 0.2s ease;
  }

  .achievement-item:hover {
    background: #f5f5f5;
  }

  .achievement-item.current-player {
    background: #e8f5e8;
    border: 1px solid #4caf50;
  }

  .achievement-item.bingo {
    background: #fff3e0;
    border: 1px solid #ff9800;
    animation: pulse 1s infinite;
  }

  .achievement-details {
    flex: 1;
    min-width: 0;
  }

  .main-info {
    font-size: 0.9em;
    font-weight: 600;
    color: #333;
  }

  .client-name {
    color: #333;
  }

  .separator {
    color: #666;
    font-weight: normal;
  }

  .achievement-text {
    font-weight: 600;
  }

  .card-info {
    font-size: 0.7em;
    color: #666;
    font-family: monospace;
  }

  @media (max-width: 1024px) {
    .leaderboard-sidebar {
      position: relative;
      top: 0;
    }
  }
</style>
