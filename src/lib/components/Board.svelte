<script lang="ts">
  import { gameState } from '$lib/gameStore.svelte.js';

  interface Props {
    size?: 'normal' | 'large';
  }

  let { size = 'normal' }: Props = $props();

  // Create a 6-section board layout (2x3) with 15 numbers each
  const createBoard = () => {
    const sections = [];

    // Create 6 sections in a 2x3 layout
    // Each section will have 15 numbers arranged in 3 rows x 5 columns
    for (let section = 0; section < 6; section++) {
      const sectionNumbers = [];

      // Determine the column range for this section
      // Section 0: columns 1-15 (1-5, 11-15, 21-25)
      // Section 1: columns 16-30 (6-10, 16-20, 26-30)
      // Section 2: columns 31-45 (31-35, 41-45, 51-55)
      // Section 3: columns 46-60 (36-40, 46-50, 56-60)
      // Section 4: columns 61-75 (61-65, 71-75, 81-85)
      // Section 5: columns 76-90 (66-70, 76-80, 86-90)

      for (let row = 0; row < 3; row++) {
        const sectionRow = [];
        for (let col = 0; col < 5; col++) {
          let number;

          if (section === 0) {
            // Section 0: 1-5, 11-15, 21-25
            number = row * 10 + col + 1;
          } else if (section === 1) {
            // Section 1: 6-10, 16-20, 26-30
            number = row * 10 + col + 6;
          } else if (section === 2) {
            // Section 2: 31-35, 41-45, 51-55
            number = row * 10 + col + 31;
          } else if (section === 3) {
            // Section 3: 36-40, 46-50, 56-60
            number = row * 10 + col + 36;
          } else if (section === 4) {
            // Section 4: 61-65, 71-75, 81-85
            number = row * 10 + col + 61;
          } else {
            // Section 5: 66-70, 76-80, 86-90
            number = row * 10 + col + 66;
          }

          if (number <= 90) {
            sectionRow.push(number);
          }
        }
        if (sectionRow.length > 0) {
          sectionNumbers.push(sectionRow);
        }
      }
      if (sectionNumbers.length > 0) {
        sections.push(sectionNumbers);
      }
    }

    return sections;
  };

  const boardSections = createBoard();

  const isNumberExtracted = (number: number) => {
    return gameState.board.numbers.includes(number);
  };

  const getExtractionOrder = (number: number) => {
    const index = gameState.board.numbers.indexOf(number);
    return index >= 0 ? index + 1 : null;
  };

  // Check if a number is part of an achievement (completed line)
  const isAchievementNumber = (number: number) => {
    if (!isNumberExtracted(number)) {
      return false;
    }

    // Only highlight achievements if they haven't been superseded by a higher achievement
    if (gameState.scoreCard.score_map) {
      let highestScore = 0;
      let achievementNumbers: number[] = [];

      // Find the highest score level that represents actual achievements (2+)
      for (const scoreStr of Object.keys(gameState.scoreCard.score_map)) {
        const score = parseInt(scoreStr);
        if (score >= 2 && score > highestScore) {  // Only consider scores of 2 or higher
          highestScore = score;
        }
      }

      // Only highlight if we found a meaningful score (2 or higher for actual lines)
      if (highestScore >= 2) {
        const highestAchievements = gameState.scoreCard.score_map[highestScore.toString()];
        if (highestAchievements) {
          for (const achievement of highestAchievements) {
            // Only include achievements from the board client (0000000000000000)
            // and that have multiple numbers (actual lines)
            if (achievement.client_id === "0000000000000000" && achievement.numbers.length >= 2) {
              achievementNumbers.push(...achievement.numbers);
            }
          }
        }

        // Check if this number is in the highest achievement numbers
        if (achievementNumbers.includes(number)) {
          return true;
        }
      }
    }

    return false;
  };
</script>

<div class="board-container" class:large={size === 'large'}>
  <h4>Board</h4>

  <div class="board-sections">
    <!-- Row 1 -->
    <div class="board-section" style="grid-area: 1 / 1;">
      <div class="section-grid">
        {#each boardSections[0] as row}
          <div class="board-row">
            {#each row as number}
              <div
                class="board-number"
                class:extracted={isNumberExtracted(number)}
                class:achievement={isAchievementNumber(number)}
                class:hidden={!isNumberExtracted(number)}
                title={isNumberExtracted(number) ? `Extracted #${getExtractionOrder(number)}${isAchievementNumber(number) ? ' - Achievement!' : ''}` : `Number ${number}`}
              >
                {#if isNumberExtracted(number)}
                  <span class="number">{number}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <!-- Vertical separator -->
    <div class="vertical-separator" style="grid-area: 1 / 2 / 6 / 2;"></div>

    <div class="board-section" style="grid-area: 1 / 3;">
      <div class="section-grid">
        {#each boardSections[1] as row}
          <div class="board-row">
            {#each row as number}
              <div
                class="board-number"
                class:extracted={isNumberExtracted(number)}
                class:achievement={isAchievementNumber(number)}
                class:hidden={!isNumberExtracted(number)}
                title={isNumberExtracted(number) ? `Extracted #${getExtractionOrder(number)}${isAchievementNumber(number) ? ' - Achievement!' : ''}` : `Number ${number}`}
              >
                {#if isNumberExtracted(number)}
                  <span class="number">{number}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <!-- Horizontal separator 1 -->
    <div class="horizontal-separator" style="grid-area: 2 / 1 / 2 / 4;"></div>

    <!-- Row 2 -->
    <div class="board-section" style="grid-area: 3 / 1;">
      <div class="section-grid">
        {#each boardSections[2] as row}
          <div class="board-row">
            {#each row as number}
              <div
                class="board-number"
                class:extracted={isNumberExtracted(number)}
                class:achievement={isAchievementNumber(number)}
                class:hidden={!isNumberExtracted(number)}
                title={isNumberExtracted(number) ? `Extracted #${getExtractionOrder(number)}${isAchievementNumber(number) ? ' - Achievement!' : ''}` : `Number ${number}`}
              >
                {#if isNumberExtracted(number)}
                  <span class="number">{number}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div class="board-section" style="grid-area: 3 / 3;">
      <div class="section-grid">
        {#each boardSections[3] as row}
          <div class="board-row">
            {#each row as number}
              <div
                class="board-number"
                class:extracted={isNumberExtracted(number)}
                class:achievement={isAchievementNumber(number)}
                class:hidden={!isNumberExtracted(number)}
                title={isNumberExtracted(number) ? `Extracted #${getExtractionOrder(number)}${isAchievementNumber(number) ? ' - Achievement!' : ''}` : `Number ${number}`}
              >
                {#if isNumberExtracted(number)}
                  <span class="number">{number}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <!-- Horizontal separator 2 -->
    <div class="horizontal-separator" style="grid-area: 4 / 1 / 4 / 4;"></div>

    <!-- Row 3 -->
    <div class="board-section" style="grid-area: 5 / 1;">
      <div class="section-grid">
        {#each boardSections[4] as row}
          <div class="board-row">
            {#each row as number}
              <div
                class="board-number"
                class:extracted={isNumberExtracted(number)}
                class:achievement={isAchievementNumber(number)}
                class:hidden={!isNumberExtracted(number)}
                title={isNumberExtracted(number) ? `Extracted #${getExtractionOrder(number)}${isAchievementNumber(number) ? ' - Achievement!' : ''}` : `Number ${number}`}
              >
                {#if isNumberExtracted(number)}
                  <span class="number">{number}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div class="board-section" style="grid-area: 5 / 3;">
      <div class="section-grid">
        {#each boardSections[5] as row}
          <div class="board-row">
            {#each row as number}
              <div
                class="board-number"
                class:extracted={isNumberExtracted(number)}
                class:achievement={isAchievementNumber(number)}
                class:hidden={!isNumberExtracted(number)}
                title={isNumberExtracted(number) ? `Extracted #${getExtractionOrder(number)}${isAchievementNumber(number) ? ' - Achievement!' : ''}` : `Number ${number}`}
              >
                {#if isNumberExtracted(number)}
                  <span class="number">{number}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if gameState.board.numbers.length > 0}
    <div class="extraction-history">
      <h4>Recent Extractions:</h4>
      <div class="recent-numbers">
        {#each gameState.board.numbers.slice(-8) as number, index}
          <span class="recent-number" class:latest={index === gameState.board.numbers.slice(-8).length - 1}>
            {number}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .board-container {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
    margin: 0 auto; /* center the board in its column */
    display: flex;
    flex-direction: column;
    align-items: center; /* center all content */
  }

  .board-container h4 {
    margin: 0 0 8px 0;
    color: #333;
    text-align: center;
    font-size: 1.1em;
  }

  .board-sections {
    display: grid;
    grid-template-columns: min-content min-content min-content; /* section | separator | section */
    grid-template-rows: min-content min-content min-content min-content min-content; /* section | separator | section | separator | section */
    gap: 8px; /* uniform gap for both rows and columns */
    margin-bottom: 12px;
    justify-content: center; /* center the grid */
    width: 100%; /* take full width of container */
    place-items: center; /* center each section in its grid cell */
  }

  .board-section {
    padding: 0px; /* remove padding to bring sections closer */
    background: transparent;
  }

  .vertical-separator {
    width: 2px;
    height: 100%;
    background: linear-gradient(to bottom, #ddd 0%, #999 50%, #ddd 100%);
    align-self: stretch;
    margin: 0 4px;
  }

  .horizontal-separator {
    height: 2px;
    width: 100%;
    background: linear-gradient(to right, #ddd 0%, #999 50%, #ddd 100%);
    justify-self: stretch;
    margin: 4px 0;
  }

  .section-grid {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .board-row {
    display: flex;
    gap: 1px;
    justify-content: center;
  }

  .board-container .board-number {
    width: 24px;
    height: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent; /* transparent by default */
    border-radius: 50% !important; /* make it circular */
    background: transparent; /* transparent by default */
    color: transparent; /* transparent by default */
    transition: all 0.3s ease;
    cursor: default;
    position: relative;
  }

  .board-container .board-number.extracted {
    border: 2px solid #ff5722 !important; /* orange border when extracted */
    background: #f5deb3 !important; /* light wood color (wheat) when extracted */
    color: #ff5722 !important; /* orange text when extracted */
    box-shadow: 0 0 8px rgba(255, 87, 34, 0.4) !important;
  }

  .board-container .board-number.achievement {
    border: 2px solid #2e7d32 !important; /* dark green border for achievements */
    background: #c8e6c9 !important; /* light green fill for achievements */
    color: #2e7d32 !important; /* dark green text for achievements */
    box-shadow: 0 0 8px rgba(46, 125, 50, 0.4) !important;
  }

  .board-container .board-number.extracted:hover {
    border-color: #d84315 !important; /* darker orange on hover */
    background: #f0d0a0 !important; /* slightly darker wood on hover */
  }

  .board-container .board-number.achievement:hover {
    border-color: #1b5e20 !important; /* darker green on hover */
    background: #a5d6a7 !important; /* slightly darker green on hover */
  }

  .board-container .board-number .number {
    font-weight: bold;
    font-size: 11px;
    color: inherit; /* inherit color from parent */
  }

  .extraction-history {
    border-top: 1px solid #eee;
    padding-top: 12px;
  }

  .extraction-history h4 {
    margin: 0 0 6px 0;
    color: #333;
    font-size: 1em;
  }

  .recent-numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .recent-number {
    background: #e3f2fd;
    color: #1976d2;
    padding: 3px 6px;
    border-radius: 4px;
    font-weight: bold;
    border: 1px solid #bbdefb;
    font-size: 12px;
  }

  .recent-number.latest {
    background: #ff5722;
    color: white;
    border-color: #d84315;
    animation: pulse 2s ease-in-out;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  @media (max-width: 768px) {
    .board-sections {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(6, 1fr);
      gap: 8px;
    }

    .board-container .board-number {
      width: 28px;
      height: 28px;
      /* Keep transparent for non-extracted numbers */
      border: 1px solid transparent;
      background: transparent;
      color: transparent;
    }

    .board-container .board-number.extracted {
      border: 1px solid #ff5722 !important;
      background: #f5deb3 !important;
      color: #ff5722 !important;
    }

    .board-container .board-number.achievement {
      border: 1px solid #2e7d32 !important;
      background: #c8e6c9 !important;
      color: #2e7d32 !important;
    }

    .board-container .board-number .number {
      font-size: 11px;
      color: inherit;
    }
  }

  @media (max-width: 480px) {
    .board-sections {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(6, 1fr);
    }

    .board-container .board-number {
      width: 25px;
      height: 25px;
      /* Keep transparent for non-extracted numbers */
      border: 1px solid transparent;
      background: transparent;
      color: transparent;
    }

    .board-container .board-number.extracted {
      border: 1px solid #ff5722 !important;
      background: #f5deb3 !important;
      color: #ff5722 !important;
    }

    .board-container .board-number.achievement {
      border: 1px solid #2e7d32 !important;
      background: #c8e6c9 !important;
      color: #2e7d32 !important;
    }

    .board-container .board-number .number {
      font-size: 10px;
      color: inherit;
    }
  }

  /* Large board styles for board operator interface */
  .board-container.large .board-number {
    width: 48px;
    height: 48px;
    border: 2px solid transparent;
  }

  .board-container.large .board-number.extracted {
    border: 2px solid #ff5722 !important;
    background: #f5deb3 !important;
    color: #ff5722 !important;
  }

  .board-container.large .board-number.achievement {
    border: 2px solid #2e7d32 !important;
    background: #c8e6c9 !important;
    color: #2e7d32 !important;
  }

  .board-container.large .board-number .number {
    font-size: 22px;
  }

  /* Large board title */
  .board-container.large h4 {
    font-size: 1.8em;
    margin: 0 0 16px 0;
    font-weight: bold;
  }

  /* Large board sections gap */
  .board-container.large .board-sections {
    gap: 24px;
  }

  /* Large board spacing styles */
  .board-container.large .section-grid {
    gap: 6px;
  }

  .board-container.large .board-row {
    gap: 6px;
  }

  /* Large board recent extractions styles */
  .board-container.large .extraction-history {
    padding-top: 16px;
  }

  .board-container.large .extraction-history h4 {
    font-size: 1.2em;
    margin: 0 0 8px 0;
  }

  .board-container.large .recent-numbers {
    gap: 8px;
  }

  .board-container.large .recent-number {
    padding: 6px 12px;
    font-size: 16px;
    border-radius: 6px;
    border: 2px solid #bbdefb;
  }

  .board-container.large .recent-number.latest {
    border: 2px solid #d84315;
  }

  /* Large board mobile responsive styles */
  @media (max-width: 768px) {
    .board-container.large .board-number {
      width: 56px;
      height: 56px;
      border: 2px solid transparent;
    }

    .board-container.large .board-number.extracted {
      border: 2px solid #ff5722 !important;
    }

    .board-container.large .board-number.achievement {
      border: 2px solid #2e7d32 !important;
    }

    .board-container.large .board-number .number {
      font-size: 22px;
    }

    .board-container.large .recent-number {
      padding: 5px 10px;
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .board-container.large .board-number {
      width: 50px;
      height: 50px;
      border: 2px solid transparent;
    }

    .board-container.large .board-number.extracted {
      border: 2px solid #ff5722 !important;
    }

    .board-container.large .board-number.achievement {
      border: 2px solid #2e7d32 !important;
    }

    .board-container.large .board-number .number {
      font-size: 20px;
    }

    .board-container.large .recent-number {
      padding: 4px 8px;
      font-size: 13px;
    }
  }
</style>
