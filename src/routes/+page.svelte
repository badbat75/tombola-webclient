<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Check for any existing preferences
  onMount(() => {
    const lastMode = localStorage.getItem('tombola-mode');
    // Don't auto-redirect, let user choose
  });

  function selectMode(mode: 'player' | 'board') {
    localStorage.setItem('tombola-mode', mode);
    goto(`/${mode}`);
  }
</script>

<svelte:head>
  <title>Tombola Game - Choose Mode</title>
</svelte:head>

<div class="app">
  <header class="app-header">
    <div class="header-content">
      <h1>🎯 Tombola Game</h1>
      <p class="subtitle">Choose your mode to get started</p>
    </div>
  </header>

  <main class="app-main">
    <div class="mode-selector">
      <h2>Select Your Mode</h2>

      <div class="mode-cards">
        <div
          class="mode-card player-card"
          onclick={() => selectMode('player')}
          onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectMode('player') : null}
          role="button"
          tabindex="0"
          aria-label="Select Card Player mode"
        >
          <div class="mode-icon">🎴</div>
          <h3>Card Player</h3>
          <p>Play with your own bingo cards, mark numbers as they're called, and compete for prizes!</p>
          <div class="features">
            <span class="feature">• Generate up to 6 cards</span>
            <span class="feature">• Real-time game updates</span>
            <span class="feature">• Score tracking</span>
            <span class="feature">• Leaderboard</span>
          </div>
          <button class="mode-button player-button">
            Start Playing
          </button>
        </div>

        <div
          class="mode-card board-card"
          onclick={() => selectMode('board')}
          onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectMode('board') : null}
          role="button"
          tabindex="0"
          aria-label="Select Board Operator mode"
        >
          <div class="mode-icon">🎯</div>
          <h3>Board Operator</h3>
          <p>Control the game flow, extract numbers, and manage the tombola session for all players.</p>
          <div class="features">
            <span class="feature">• Extract numbers</span>
            <span class="feature">• Start new games</span>
            <span class="feature">• Monitor all players</span>
            <span class="feature">• Game statistics</span>
          </div>
          <button class="mode-button board-button">
            Operate Board
          </button>
        </div>
      </div>

      <div class="quick-links">
        <p class="help-text">
          <strong>New to Tombola?</strong> It's like Bingo! Numbers are drawn randomly,
          and players mark them on their cards to win prizes.
        </p>
      </div>
    </div>
  </main>

  <footer class="app-footer">
    <p>Tombola Web Client • Powered by Rust API Server</p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: rgba(255, 255, 255, 0.95);
    padding: 30px 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .app-header h1 {
    margin: 0;
    color: #333;
    font-size: 3em;
    font-weight: bold;
  }

  .subtitle {
    margin: 10px 0 0 0;
    color: #666;
    font-size: 1.3em;
    font-weight: 400;
  }

  .app-main {
    flex: 1;
    padding: 40px 20px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .mode-selector {
    text-align: center;
  }

  .mode-selector h2 {
    color: white;
    font-size: 2.2em;
    margin: 0 0 40px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .mode-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .mode-card {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    cursor: pointer;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .mode-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }

  .mode-card:focus {
    outline: 3px solid #4a90e2;
    outline-offset: 2px;
  }

  .mode-card:focus:not(:focus-visible) {
    outline: none;
  }

  .mode-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
  }

  .player-card::before {
    background: linear-gradient(90deg, #667eea, #764ba2);
  }

  .board-card::before {
    background: linear-gradient(90deg, #4a90e2, #2c5aa0);
  }

  .mode-icon {
    font-size: 4em;
    margin-bottom: 20px;
    display: block;
  }

  .mode-card h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.8em;
    font-weight: bold;
  }

  .mode-card p {
    color: #666;
    font-size: 1.1em;
    line-height: 1.6;
    margin-bottom: 20px;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 25px;
    text-align: left;
  }

  .feature {
    color: #555;
    font-size: 0.95em;
    padding-left: 8px;
  }

  .mode-button {
    width: 100%;
    padding: 15px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .player-button {
    background: #667eea;
    color: white;
  }

  .player-button:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }

  .board-button {
    background: #4a90e2;
    color: white;
  }

  .board-button:hover {
    background: #357abd;
    transform: translateY(-2px);
  }

  .quick-links {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    margin: 0 auto;
  }

  .help-text {
    margin: 0;
    color: #555;
    font-size: 1.1em;
    line-height: 1.6;
  }

  .app-footer {
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    text-align: center;
    color: #666;
    margin-top: auto;
  }

  .app-footer p {
    margin: 0;
    font-size: 1em;
  }

  @media (max-width: 768px) {
    .app-header h1 {
      font-size: 2.2em;
    }

    .subtitle {
      font-size: 1.1em;
    }

    .app-main {
      padding: 20px 16px;
    }

    .mode-selector h2 {
      font-size: 1.8em;
      margin-bottom: 30px;
    }

    .mode-cards {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .mode-card {
      padding: 24px 20px;
    }

    .mode-icon {
      font-size: 3em;
    }

    .mode-card h3 {
      font-size: 1.5em;
    }

    .features {
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .app-header {
      padding: 20px 16px;
    }

    .app-header h1 {
      font-size: 1.8em;
    }

    .mode-card {
      padding: 20px 16px;
    }
  }
</style>
