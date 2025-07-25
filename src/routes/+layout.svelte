<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore, auth } from '$lib/stores/auth.js';
	import { processMagicLink } from '$lib/auth-client.js';
	import { gameActions } from '$lib/gameStore.svelte.js';
	import AuthButton from '$lib/components/AuthButton.svelte';
	import UserRegistration from '$lib/components/UserRegistration.svelte';
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
				{#if authEnabled}
					<AuthButton {authEnabled} />
				{:else}
					<UserRegistration />
				{/if}
			</div>
		</div>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	:root {
		/* Primary gradient colors for better readability */
		--primary-gradient-start: #4a90e2;
		--primary-gradient-end: #2c5aa0;
		--primary-gradient: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);

		/* Success gradient */
		--success-gradient: linear-gradient(135deg, #10b981, #059669);

		/* Error gradient */
		--error-gradient: linear-gradient(135deg, #ef4444, #dc2626);

		/* Common shadow */
		--box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		--box-shadow-light: 0 2px 8px rgba(0, 0, 0, 0.05);
		--box-shadow-heavy: 0 4px 20px rgba(0, 0, 0, 0.15);

		/* Typography */
		--font-family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		--font-family-monospace: 'Consolas', 'Monaco', 'Courier New', monospace;

		/* Font sizes */
		--font-size-xs: 0.75rem;    /* 12px */
		--font-size-sm: 0.875rem;   /* 14px */
		--font-size-base: 1rem;     /* 16px */
		--font-size-lg: 1.125rem;   /* 18px */
		--font-size-xl: 1.25rem;    /* 20px */
		--font-size-2xl: 1.5rem;    /* 24px */
		--font-size-3xl: 1.875rem;  /* 30px */
		--font-size-4xl: 2.25rem;   /* 36px */

		/* Font weights */
		--font-weight-normal: 400;
		--font-weight-medium: 500;
		--font-weight-semibold: 600;
		--font-weight-bold: 700;

		/* Text colors */
		--text-color-primary: #333333;
		--text-color-secondary: #666666;
		--text-color-muted: #9ca3af;
		--text-color-light: #ffffff;
		--text-color-success: #059669;
		--text-color-error: #dc2626;
		--text-color-warning: #d97706;

		/* Background colors */
		--bg-color-white: #ffffff;
		--bg-color-light: #f8f9fa;
		--bg-color-muted: #f5f5f5;
		--bg-color-dark: rgba(0, 0, 0, 0.05);

		/* Border colors */
		--border-color-light: #e5e7eb;
		--border-color-medium: #d1d5db;
		--border-color-dark: #9ca3af;
		--border-color-primary: var(--primary-gradient-start);

		/* Box styling */
		--border-radius-sm: 4px;
		--border-radius: 6px;
		--border-radius-md: 8px;
		--border-radius-lg: 12px;
		--border-radius-xl: 16px;

		/* Spacing */
		--spacing-xs: 0.25rem;   /* 4px */
		--spacing-sm: 0.5rem;    /* 8px */
		--spacing-md: 0.75rem;   /* 12px */
		--spacing-base: 1rem;    /* 16px */
		--spacing-lg: 1.25rem;   /* 20px */
		--spacing-xl: 1.5rem;    /* 24px */
		--spacing-2xl: 2rem;     /* 32px */

		/* Container styling */
		--container-bg: rgba(255, 255, 255, 0.95);
		--container-bg-solid: var(--bg-color-white);
		--container-padding: var(--spacing-lg);
		--container-padding-sm: var(--spacing-base);

		/* Button colors */
		--button-primary-bg: var(--primary-gradient);
		--button-primary-hover: var(--primary-gradient-start);
		--button-secondary-bg: #6c757d;
		--button-secondary-hover: #5a6268;
		--button-success-bg: var(--success-gradient);
		--button-danger-bg: var(--error-gradient);
		--button-disabled-bg: #ccc;

		/* Form styling */
		--input-border: 2px solid var(--border-color-medium);
		--input-border-focus: 2px solid var(--primary-gradient-start);
		--input-padding: 10px;
		--input-border-radius: var(--border-radius);
	}

	/* Global base styles */
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: var(--font-family-primary);
		font-size: var(--font-size-base);
		color: var(--text-color-primary);
		line-height: 1.5;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		margin: 0 0 var(--spacing-base) 0;
		font-weight: var(--font-weight-bold);
		color: var(--text-color-primary);
	}

	:global(h1) { font-size: var(--font-size-3xl); }
	:global(h2) { font-size: var(--font-size-2xl); }
	:global(h3) { font-size: var(--font-size-xl); }
	:global(h4) { font-size: var(--font-size-lg); }

	:global(p) {
		margin: 0 0 var(--spacing-base) 0;
		color: var(--text-color-secondary);
	}

	:global(code) {
		background: var(--bg-color-muted);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius-sm);
		font-family: var(--font-family-monospace);
		font-size: var(--font-size-sm);
	}

	:global(.primary-button) {
		background: var(--button-primary-bg);
		color: var(--text-color-light);
		border: none;
		padding: var(--spacing-md) var(--spacing-xl);
		border-radius: var(--border-radius);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.primary-button:hover:not(:disabled)) {
		background: var(--button-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--box-shadow);
	}

	:global(.primary-button:disabled) {
		background: var(--button-disabled-bg);
		cursor: not-allowed;
		transform: none;
	}

	:global(.form-group) {
		margin-bottom: var(--spacing-base);
	}

	:global(.form-group label) {
		display: block;
		margin-bottom: var(--spacing-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--text-color-primary);
	}

	:global(.form-group input) {
		width: 100%;
		padding: var(--input-padding);
		border: var(--input-border);
		border-radius: var(--input-border-radius);
		font-size: var(--font-size-base);
		font-family: var(--font-family-primary);
	}

	:global(.form-group input:focus) {
		outline: none;
		border: var(--input-border-focus);
	}

	:global(.section) {
		background: var(--container-bg);
		border-radius: var(--border-radius-lg);
		padding: var(--container-padding);
		box-shadow: var(--box-shadow);
		margin-bottom: var(--spacing-xl);
	}

	:global(.error-message) {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: var(--border-radius);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
		text-align: center;
	}

	:global(.error-message p) {
		margin: 0;
		color: var(--text-color-error);
		font-weight: var(--font-weight-medium);
	}

	:global(.success-message) {
		background: #d1e7dd;
		border: 1px solid #a3cfbb;
		border-radius: var(--border-radius);
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
		text-align: center;
	}

	:global(.success-message p) {
		margin: 0;
		color: var(--text-color-success);
		font-weight: var(--font-weight-medium);
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: var(--primary-gradient);
		color: var(--text-color-light);
		padding: var(--spacing-base) 0;
		box-shadow: var(--box-shadow);
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--spacing-2xl);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-content h1 {
		margin: 0;
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
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
		gap: var(--spacing-base);
	}

	.app-main {
		flex: 1;
		padding: var(--spacing-2xl);
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 768px) {
		.header-content {
			padding: 0 var(--spacing-base);
			flex-direction: column;
			gap: var(--spacing-base);
		}

		.header-content h1 {
			font-size: var(--font-size-2xl);
		}

		.app-main {
			padding: var(--spacing-base);
		}
	}
</style>
