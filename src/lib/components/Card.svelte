<script lang="ts">
  import { gameUtils } from '$lib/gameStore.svelte.js';
  import type { Card } from '$lib/types.js';

  let { card, showCardId = false } = $props<{ card: Card; showCardId?: boolean }>();

  // Calculate card statistics and achievement
  const cardStats = $derived(() => {
    const score = gameUtils.getCardScore(card);
    const lines = gameUtils.getCardLines(card);
    const bingo = gameUtils.isBingo(card);
    const achievement = gameUtils.getCardAchievement(card.card_id);
    return { score, lines, bingo, achievement };
  });
</script>

<div class="card">
  <div class="card-title">
    <span class="title-text">RUSTED TOMBOLA</span>
  </div>

  {#if showCardId}
    <div class="card-header">
      <div class="card-stats">
        {#if cardStats().achievement}
          <span class="achievement" class:bingo={cardStats().achievement?.text === 'BINGO'}>
            🏆 {cardStats().achievement?.text}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <div class="card-grid">
    {#each card.card_data as row, rowIndex}
      <div class="card-row">
        {#each row as cell, colIndex}
          {@const highlightType = cell !== null ? gameUtils.getNumberHighlight(cell, card.card_id) : 'none'}
          <div
            class="card-cell"
            class:empty={cell === null}
            class:extracted={highlightType === 'extracted'}
            class:achievement={highlightType === 'achievement'}
            class:unmarked={highlightType === 'none' && cell !== null}
          >
            {cell || ''}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  {#if showCardId}
    <div class="card-footer">
      <span class="card-id">{card.card_id}</span>
    </div>
  {/if}
</div>

<style>
  .card {
    border: 2px solid #8b0000;
    border-radius: 10px;
    padding: 14px;
    background: #ffcdd2;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(139, 0, 0, 0.15);
    max-width: 450px;
    width: 100%;
  }

  .card-title {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0;
  }

  .title-text {
    background: white;
    color: black;
    font-weight: bold;
    font-size: 1.08em;
    padding: 5px 10px;
    border: 2px solid #8b0000;
    border-radius: 14px;
    text-align: center;
    letter-spacing: 1px;
  }

  .card-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
  }

  .card-id {
    font-family: monospace;
    font-size: 1.08em;
    color: #8b0000;
  }

  .card-stats {
    display: flex;
    gap: 14px;
    font-size: 1.08em;
  }

  .achievement {
    color: #ff6b35;
    font-weight: bold;
  }

  .achievement.bingo {
    color: #ff1744;
    font-weight: bold;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .card-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
    justify-content: center;
  }

  .card-row {
    display: flex;
    gap: 2px;
  }

  .card-cell {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ccc;
    font-weight: bold;
    font-size: 17px;
    border-radius: 5px;
    transition: all 0.2s ease;
  }

  .card-cell.empty {
    background: #f5f5f5;
    border-color: #e0e0e0;
  }

  .card-cell.unmarked {
    background: white !important;
    color: #333 !important;
  }

  /* Light grey highlighting for extracted numbers that don't contribute to highest score */
  .card .card-cell.extracted {
    background: #e0e0e0 !important;
    color: black !important;
    border-color: #bdbdbd !important;
    box-shadow: 0 0 4px rgba(189, 189, 189, 0.5) !important;
  }

  /* Dark green border, light green fill, dark green font for achievement numbers */
  .card .card-cell.achievement {
    background: #c8e6c9 !important;
    color: #2e7d32 !important;
    border-color: #2e7d32 !important;
    box-shadow: 0 0 4px rgba(46, 125, 50, 0.7) !important;
    font-weight: bold !important;
  }

  @media (max-width: 600px) {
    .card {
      max-width: 100%;
    }

    .card-cell {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }

    .card-header {
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .card-footer {
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .card-stats {
      flex-direction: column;
      gap: 5px;
    }
  }
</style>
