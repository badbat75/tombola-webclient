<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore, auth } from '$lib/stores/auth.js';
	import { processMagicLink } from '$lib/auth-client.js';

	// Get server-side auth configuration
	let { data } = $props();
	const { authEnabled } = data;

	let status = $state<'processing' | 'success' | 'error'>('processing');
	let errorMessage = $state('');

	onMount(async () => {
		// If auth is disabled, redirect to home immediately
		if (!authEnabled) {
			goto('/');
			return;
		}

		try {
			auth.setMagicLinkProcessing();

			// Get the current page URL with all parameters
			const currentUrl = window.location.href;
			console.log('[Magic Link] Processing URL:', currentUrl);

			// Check for Supabase error in URL hash
			const urlObj = new URL(currentUrl);
			if (urlObj.hash) {
				const hashParams = new URLSearchParams(urlObj.hash.substring(1));
				const error = hashParams.get('error');
				const errorCode = hashParams.get('error_code');
				const errorDescription = hashParams.get('error_description');

				if (error) {
					status = 'error';
					if (errorCode === 'otp_expired') {
						errorMessage = 'This magic link has expired. Please request a new one to sign in.';
					} else {
						errorMessage = errorDescription ? decodeURIComponent(errorDescription) : 'Authentication failed';
					}
					console.error('[Magic Link] Supabase error:', { error, errorCode, errorDescription });
					auth.setUnauthenticated();
					return;
				}
			}

			const result = await processMagicLink(currentUrl);

			if (result) {
				status = 'success';
				console.log('[Magic Link] Authentication successful');

				// Redirect to home page after a short delay
				setTimeout(() => {
					goto('/');
				}, 2000);
			} else {
				status = 'error';
				errorMessage = 'Invalid or expired magic link';
				console.log('[Magic Link] Authentication failed - invalid token');
				auth.setUnauthenticated();
			}
		} catch (error) {
			status = 'error';
			errorMessage = error instanceof Error ? error.message : 'Authentication failed';
			console.error('[Magic Link] Authentication error:', error);
			auth.setUnauthenticated();
		}
	});
</script>

<svelte:head>
	<title>Magic Link - Tombola Game</title>
</svelte:head>

<div class="magic-link-page">
	<div class="magic-link-card">
		{#if status === 'processing'}
			<div class="processing">
				<div class="spinner"></div>
				<h2>Signing you in...</h2>
				<p>Processing your magic link authentication</p>
			</div>
		{:else if status === 'success'}
			<div class="success">
				<div class="success-icon">✓</div>
				<h2>Welcome back!</h2>
				<p>You've been successfully signed in.</p>
				<p class="redirect-note">Redirecting you to the game...</p>
			</div>
		{:else if status === 'error'}
			<div class="error">
				<div class="error-icon">✗</div>
				<h2>Authentication Failed</h2>
				<p>{errorMessage}</p>
				<div class="error-actions">
					<a href="/" class="return-home">Return to Home</a>
					{#if errorMessage.includes('expired')}
						<p class="hint">You can request a new magic link by clicking "Sign In" on the home page.</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.magic-link-page {
		min-height: 80vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.magic-link-card {
		background: white;
		border-radius: 12px;
		padding: 3rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 400px;
		width: 100%;
	}

	.processing, .success, .error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.success-icon, .error-icon {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		font-weight: bold;
		color: white;
	}

	.success-icon {
		background: linear-gradient(135deg, #10b981, #059669);
	}

	.error-icon {
		background: linear-gradient(135deg, #ef4444, #dc2626);
	}

	h2 {
		margin: 0;
		color: #1f2937;
		font-size: 1.5rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.redirect-note {
		font-size: 0.9rem;
		color: #9ca3af;
		font-style: italic;
	}

	.return-home {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.return-home:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.error-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.hint {
		font-size: 0.85rem;
		color: #9ca3af;
		font-style: italic;
		text-align: center;
		margin: 0;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.magic-link-card {
			padding: 2rem;
			margin: 1rem;
		}

		h2 {
			font-size: 1.25rem;
		}
	}
</style>
