<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore, auth } from '$lib/stores/auth.js';
	import { processMagicLink } from '$lib/auth-client.js';
	import { gameActions } from '$lib/gameStore.svelte.js';
	import AuthButton from '$lib/components/AuthButton.svelte';
	import '../app.css';

	// Get server-side auth configuration
	let { data, children } = $props();
	const { authEnabled } = data;

	// Initialize auth state on app load
	onMount(async () => {
		// Only initialize auth if it's enabled server-side
		if (authEnabled) {
			// Initialize from localStorage first
			auth.initialize();

			// Check for magic link tokens on any page (not just /magic-link)
			const hasTokenInHash = $page.url.hash.includes('access_token');

			if (hasTokenInHash || $page.url.pathname === '/magic-link') {
				try {
					// Get the current page URL with all parameters
					const currentUrl = window.location.href;
					const result = await processMagicLink(currentUrl);

					if (result) {
						// Authentication is handled inside processMagicLink function
						// Redirect to home page after successful authentication (only if not already there)
						if ($page.url.pathname !== '/') {
							window.location.href = '/';
						}
					} else {
						auth.setUnauthenticated();
					}
				} catch (error) {
					console.error('Magic link processing failed:', error);
					auth.setUnauthenticated();
				}
			}
		} else {
			// Auth is disabled server-side, set appropriate state
			auth.setDisabled();
		}
	});

	function handleHomeNavigation() {
		// Clear game-related data but keep auth
		localStorage.removeItem('tombola-game-id');
		localStorage.removeItem('tombola-mode');

		// Clear game state (this will clear cards and registration)
		gameActions.reset();

		// Navigate to home
		goto('/');
	}
</script>

<div class="app">
	<header class="app-header">
		<div class="header-content">
			<button
				class="logo-button"
				onclick={handleHomeNavigation}
				aria-label="Go to home page"
			>
				<h1>🎯 Tombola Game</h1>
			</button>
			<div class="auth-section">
				<AuthButton {authEnabled} />
			</div>
		</div>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-content h1 {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 700;
	}

	.logo-button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0;
		transition: transform 0.1s ease, opacity 0.2s ease;
	}

	.logo-button:hover {
		transform: scale(1.02);
		opacity: 0.9;
	}

	.logo-button:active {
		transform: scale(0.98);
	}

	.logo-button:focus {
		outline: 2px solid rgba(255, 255, 255, 0.5);
		outline-offset: 4px;
		border-radius: 4px;
	}

	.auth-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.app-main {
		flex: 1;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 768px) {
		.header-content {
			padding: 0 1rem;
			flex-direction: column;
			gap: 1rem;
		}

		.header-content h1 {
			font-size: 1.5rem;
		}

		.app-main {
			padding: 1rem;
		}
	}
</style>
