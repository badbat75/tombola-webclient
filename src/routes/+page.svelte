<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, auth } from '$lib/stores/auth.js';
  import GameSelector from '$lib/components/GameSelector.svelte';

  // Get server-side auth configuration
  let { data } = $props();
  const { authEnabled } = data;

  let selectedGameId: string | null = $state(null);
  let selectedMode: 'player' | 'board' | null = $state(null);

  // Check for any existing preferences and magic link processing
  onMount(() => {
    const lastMode = localStorage.getItem('tombola-mode');
    const lastGameId = localStorage.getItem('tombola-game-id');

    // Check for magic link tokens in URL hash (only if auth is enabled)
    if (authEnabled) {
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      // Handle error cases from verification
      if (error) {
        let errorMessage = 'Authentication failed';
        switch (error) {
          case 'missing_token':
            errorMessage = 'Magic link is missing required authentication tokens';
            break;
          case 'auth_not_configured':
            errorMessage = 'Authentication is not properly configured on the server';
            break;
          case 'invalid_token':
            errorMessage = 'Authentication tokens are invalid or expired';
            break;
          case 'verification_failed':
            errorMessage = 'Authentication verification failed';
            break;
          case 'auth_required':
            errorMessage = 'You must sign in to access this page';
            break;
          case 'session_expired':
            errorMessage = 'Your session has expired. Please sign in again';
            break;
          case 'auth_error':
            errorMessage = 'Authentication error occurred. Please sign in again';
            break;
        }
        alert(errorMessage);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Process authentication tokens if present
      if (accessToken && success === 'true') {
        // Store tokens in localStorage for client-side use
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 3600000).getTime() // 1 hour from now
        }));

        // Store auth token in cookie for server-side validation
        document.cookie = `supabase-auth-token=${encodeURIComponent(JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 3600000).getTime()
        }))}; path=/; max-age=3600; SameSite=Strict`;

        // Initialize auth state
        auth.initialize();

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    }

    // Don't auto-redirect, let user choose
  });  function onGameSelected(gameId: string) {
    selectedGameId = gameId;
    localStorage.setItem('tombola-game-id', gameId);
  }

  function selectMode(mode: 'player' | 'board') {
    if (!selectedGameId) return;

    // Allow access - let server handle authentication requirements if needed
    selectedMode = mode;
    localStorage.setItem('tombola-mode', mode);
    // Navigate to the selected mode with the game ID
    goto(`/${mode}?gameId=${selectedGameId}`);
  }

  function dismissNotification() {
    auth.setUnauthenticated();
  }

  function handleNotificationKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dismissNotification();
    }
  }

  function handleBackgroundClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      dismissNotification();
    }
  }
</script>

<svelte:head>
  <title>Tombola Game - Choose Mode</title>
</svelte:head>

{#if !authEnabled || $authStore.state === 'unauthenticated' || $authStore.state === 'magic-link-sent'}
  <!-- Show games even when not authenticated -->
  <div class="combined-selector">
    <!-- Email notification toast (only if auth is enabled) -->
    {#if authEnabled && $authStore.state === 'magic-link-sent'}
      <div
        class="email-notification"
        onclick={handleBackgroundClick}
        onkeydown={handleNotificationKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
        tabindex="0"
      >
        <div class="notification-content">
          <div class="check-icon">✓</div>
          <h3 id="notification-title">Check Your Email!</h3>
          <p>We've sent you a magic link. Click it to sign in and start playing Tombola!</p>
          <p class="note">The link will expire in 10 minutes for security.</p>
          <button class="dismiss-btn" onclick={dismissNotification}>
            Dismiss
          </button>
          <p class="note">Press Escape to close</p>
        </div>
      </div>
    {/if}

    <div class="game-selection">
      <h2>Available Games</h2>
      {#if authEnabled}
        <p class="browse-note">🔒 Sign in to join any of these games</p>
        <GameSelector onGameSelected={onGameSelected} readonly authEnabled={authEnabled} />
      {:else}
        <p class="browse-note">🎮 Choose any game to start playing</p>
        <GameSelector onGameSelected={onGameSelected} authEnabled={authEnabled} />
      {/if}
    </div>

    {#if selectedGameId}
      <div class="mode-selection">
        <h2>Game Modes</h2>
        <p class="game-info">Selected Game: <strong>{selectedGameId}</strong></p>

        {#if authEnabled}
          <p class="auth-required">🔐 <strong>Authentication Required:</strong> Sign in to access game modes</p>

          <div class="mode-cards disabled">
            <div class="mode-card player-card disabled-card">
              <div class="mode-icon">🎴</div>
              <h3>Card Player</h3>
              <p>Play with your own bingo cards, mark numbers as they're called, and compete for prizes!</p>
              <div class="features">
                <span class="feature">• Generate up to 6 cards</span>
                <span class="feature">• Real-time game updates</span>
                <span class="feature">• Score tracking</span>
                <span class="feature">• Leaderboard</span>
              </div>
              <button class="mode-button player-button" disabled>
                🔒 Sign In Required
              </button>
            </div>

            <div class="mode-card board-card disabled-card">
              <div class="mode-icon">🎯</div>
              <h3>Board Operator</h3>
              <p>Control the game by extracting numbers and managing the tombola board for all players!</p>
              <div class="features">
                <span class="feature">• Extract numbers</span>
                <span class="feature">• View live leaderboard</span>
                <span class="feature">• Large board display</span>
                <span class="feature">• Game control</span>
              </div>
              <button class="mode-button board-button" disabled>
                🔒 Sign In Required
              </button>
            </div>
          </div>
        {:else}
          <!-- No auth required, show available modes -->
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
                Join as Player
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
                <span class="feature">• Monitor all players</span>
                <span class="feature">• Game statistics</span>
                <span class="feature">• Real-time updates</span>
              </div>
              <button class="mode-button board-button">
                Operate Board
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{:else if authEnabled && ($authStore.state === 'loading' || $authStore.state === 'magic-link-processing')}
  <div class="welcome-section">
    <div class="welcome-card">
      <div class="spinner"></div>
      <h2>Loading...</h2>
      <p>Setting up your Tombola experience</p>
    </div>
  </div>
{:else if authEnabled && $authStore.state === 'authenticated'}
  <div class="welcome-section">
    <div class="user-welcome">
      <h2>Welcome back, {$authStore.user?.name || $authStore.user?.email || 'Player'}! 🎉</h2>
      <p>Ready to play some Tombola? Choose your game and mode below.</p>
    </div>
  </div>

  <div class="combined-selector">
    <div class="game-selection">
      <h2>1. Choose a Game</h2>
      <GameSelector onGameSelected={onGameSelected} authEnabled={authEnabled} />
    </div>

    {#if selectedGameId}
      <div class="mode-selection">
        <h2>2. Select Your Mode</h2>
        <p class="game-info">Selected Game: <strong>{selectedGameId}</strong></p>

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
              Join as Player
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
              <span class="feature">• Monitor all players</span>
              <span class="feature">• Game statistics</span>
              <span class="feature">• Real-time updates</span>
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
    {:else}
      <div class="mode-selection disabled">
        <h2>2. Select Your Mode</h2>
        <div class="disabled-message">
          <p>👆 Please choose a game first</p>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .welcome-section {
    display: flex;
    justify-content: center;
    padding: 2rem;
    min-height: 400px;
    align-items: center;
  }

  .welcome-card {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    text-align: center;
    max-width: 500px;
    width: 100%;
  }

  .welcome-card h2 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .welcome-card p {
    color: #666;
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }

  /* Email notification styles */
  .email-notification {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .notification-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 400px;
    width: 90%;
    animation: slideIn 0.3s ease;
    pointer-events: auto;
  }

  .notification-content h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .notification-content p {
    color: #666;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }

  .dismiss-btn {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
    margin-top: 1rem;
  }

  .dismiss-btn:hover {
    background: #5a6fd8;
  }

  .check-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    margin: 0 auto 1rem auto;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }

  .note {
    font-size: 0.9rem !important;
    color: #888 !important;
    font-style: italic;
  }

  .user-welcome {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .user-welcome h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .user-welcome p {
    margin: 0;
    color: #666;
    font-size: 1.1rem;
  }

  .combined-selector {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .game-selection h2,
  .mode-selection h2 {
    color: white;
    font-size: 2.2em;
    margin: 0 0 32px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  .mode-selection.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .game-info {
    color: white;
    text-align: center;
    font-size: 1.1em;
    margin-bottom: 24px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .game-info strong {
    color: #FFD700;
    font-family: 'Courier New', monospace;
  }

  .disabled-message {
    text-align: center;
    padding: 60px 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    border: 2px dashed rgba(255, 255, 255, 0.3);
  }

  .disabled-message p {
    color: white;
    font-size: 1.3em;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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

  /* Authentication-related styles */
  .browse-note {
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
    text-align: center;
  }

  .auth-required {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
    text-align: center;
    color: #856404;
  }

  .disabled-card {
    opacity: 0.6;
    pointer-events: none;
    position: relative;
  }

  .disabled-card::after {
    content: '🔒';
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 1.5em;
    opacity: 0.7;
  }

  .mode-cards.disabled .mode-card {
    cursor: not-allowed;
  }

  .mode-button:disabled {
    background: #ccc !important;
    color: #666 !important;
    cursor: not-allowed;
    transform: none;
  }

  .mode-button:disabled:hover {
    background: #ccc !important;
    transform: none;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 768px) {
    .welcome-section {
      padding: 1rem;
    }

    .welcome-card {
      padding: 2rem;
    }

    .user-welcome {
      padding: 1.5rem;
    }

    .mode-selection h2,
    .game-selection h2 {
      font-size: 1.8em;
      margin-bottom: 30px;
    }

    .combined-selector {
      gap: 30px;
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
    .mode-card {
      padding: 20px 16px;
    }
  }
</style>
