<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore, auth } from '$lib/stores/auth.js';
  import { userRegistrationStore } from '$lib/stores/userRegistration.js';
  import GameSelector from '$lib/components/GameSelector.svelte';
  import HomeFooter from '$lib/components/HomeFooter.svelte';

  // Get server-side auth configuration
  let { data } = $props();
  const { authEnabled } = data;

  let selectedGameId: string | null = $state(null);
  let selectedMode: 'player' | 'board' | null = $state(null);

  // Check for any existing preferences and magic link processing
  onMount(() => {
    if (!browser) return;

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

<div class="app">
  <main class="app-main">
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
            {#if !$userRegistrationStore.isRegistered}
              <p class="browse-note">📝 Register your name in the header to join games</p>
            {/if}
            <GameSelector
              onGameSelected={onGameSelected}
              authEnabled={authEnabled}
              userRegistered={$userRegistrationStore.isRegistered}
              userName={$userRegistrationStore.userName || ''}
            />
          {/if}
        </div>
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
          <h2>Choose a Game</h2>
          <GameSelector
            onGameSelected={onGameSelected}
            authEnabled={authEnabled}
            userRegistered={true}
            userName={$authStore.user?.name || $authStore.user?.email?.split('@')[0] || 'Player'}
          />
        </div>
      </div>
    {/if}
  </main>

  <!-- Sticky Footer -->
  {#if $userRegistrationStore.isRegistered || (authEnabled && $authStore.state === 'authenticated')}
    <HomeFooter {authEnabled} />
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: var(--primary-gradient);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-main {
    flex: 1;
    padding: var(--spacing-lg);
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .welcome-section {
    display: flex;
    justify-content: center;
    padding: var(--spacing-2xl);
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
    background: var(--success-gradient);
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

  .game-selection h2 {
    color: white;
    font-size: 2.2em;
    margin: 0 0 32px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  /* Authentication-related styles */
  .browse-note {
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
    text-align: center;
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

    .game-selection h2 {
      font-size: 1.8em;
      margin-bottom: 30px;
    }

    .combined-selector {
      gap: 30px;
    }
  }
</style>
