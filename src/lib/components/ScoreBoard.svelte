<script lang="ts">
  import { gameState } from '$lib/gameStore.svelte.js';
  import { tombolaApi } from '$lib/api.js';

  // Derived value for score achievements with client names
  const achievementsWithNames = $derived(async () => {
    const achievements: Array<{
      score: number;
      clientName: string;
      cardId: string;
      numbers: number[];
    }> = [];

    try {
      for (const [score, scoreAchievements] of Object.entries(gameState.scoreCard.score_map)) {
        for (const achievement of scoreAchievements) {
          let clientName = 'Unknown';

          // Skip board achievements (client_id: "0000000000000000")
          if (achievement.client_id === '0000000000000000') {
            continue;
          }

          try {
            const client = await tombolaApi.getClientById(achievement.client_id);
            clientName = client.name;
          } catch (error) {
            console.warn(`Could not fetch client name for ${achievement.client_id}`);
          }

          achievements.push({
            score: parseInt(score),
            clientName,
            cardId: achievement.card_id,
            numbers: achievement.numbers
          });
        }
      }

      // Sort by score descending, then by client name
      return achievements.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.clientName.localeCompare(b.clientName);
      });
    } catch (error) {
      console.error('Error processing achievements:', error);
      return [];
    }
  });

  const getScoreDescription = (score: number): string => {
    switch (score) {
      case 2: return '2 in a line';
      case 3: return '3 in a line';
      case 4: return '4 in a line';
      case 5: return '5 in a line (Full line)';
      case 15: return 'BINGO!';
      default: return `${score} numbers`;
    }
  };

  const getScoreEmoji = (score: number): string => {
    switch (score) {
      case 2: return '🎯';
      case 3: return '🎪';
      case 4: return '🌟';
      case 5: return '🏆';
      case 15: return '🎉';
      default: return '🎮';
    }
  };
</script>

<div class="scoreboard">
  <h3>🏆 Leaderboard</h3>

  {#if gameState.scoreCard.published_score === 0}
    <div class="no-scores">
      <p>No achievements yet!</p>
      <p>Be the first to complete a line or get BINGO! 🎯</p>
    </div>
  {:else}
    <div class="published-score">
      <span class="label">Highest Achievement:</span>
      <span class="value">{getScoreDescription(gameState.scoreCard.published_score)} {getScoreEmoji(gameState.scoreCard.published_score)}</span>
    </div>

    {#await achievementsWithNames() then achievements}
      {#if achievements.length > 0}
        <div class="achievements-list">
          {#each achievements as achievement (achievement.clientName + achievement.cardId + achievement.score)}
            <div class="achievement-item" class:bingo={achievement.score === 15}>
              <div class="achievement-header">
                <span class="player-name">{achievement.clientName}</span>
                <span class="score-badge" class:bingo-badge={achievement.score === 15}>
                  {getScoreEmoji(achievement.score)} {getScoreDescription(achievement.score)}
                </span>
              </div>
              <div class="achievement-details">
                <span class="card-id">Card: {achievement.cardId.slice(-8)}</span>
                <div class="winning-numbers">
                  Numbers: {achievement.numbers.join(', ')}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="no-player-achievements">
          <p>No player achievements to display</p>
        </div>
      {/if}
    {:catch error}
      <div class="error">
        <p>Error loading achievements: {error.message}</p>
      </div>
    {/await}
  {/if}
</div>

<style>
  .scoreboard {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .scoreboard h3 {
    margin: 0 0 16px 0;
    color: #333;
    text-align: center;
    font-size: 1.4em;
  }

  .no-scores,
  .no-player-achievements,
  .error {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .no-scores p:first-child {
    font-size: 1.1em;
    margin-bottom: 8px;
  }

  .published-score {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #e3f2fd;
    border-radius: 6px;
    margin-bottom: 16px;
    border: 1px solid #bbdefb;
  }

  .published-score .label {
    font-weight: bold;
    color: #1976d2;
  }

  .published-score .value {
    color: #0d47a1;
    font-weight: bold;
  }

  .achievements-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .achievement-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    background: #fafafa;
    transition: all 0.2s ease;
  }

  .achievement-item:hover {
    border-color: #667eea;
    background: #f5f7ff;
  }

  .achievement-item.bingo {
    border-color: #ff1744;
    background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
    animation: gentle-pulse 2s ease-in-out infinite;
  }

  @keyframes gentle-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  .achievement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .player-name {
    font-weight: bold;
    color: #333;
    font-size: 1.1em;
  }

  .score-badge {
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.9em;
    font-weight: bold;
  }

  .score-badge.bingo-badge {
    background: #ff1744;
    animation: pulse 1s ease-in-out infinite;
  }

  .achievement-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9em;
    color: #666;
  }

  .card-id {
    font-family: monospace;
    color: #555;
  }

  .winning-numbers {
    color: #333;
    font-weight: 500;
  }

  .error {
    color: #c62828;
    background: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
  }

  @media (max-width: 600px) {
    .achievement-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .published-score {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }

    .achievement-details {
      font-size: 0.8em;
    }
  }
</style>
