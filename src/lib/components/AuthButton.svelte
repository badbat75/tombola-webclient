<script lang="ts">
	import { authStore, auth } from '$lib/stores/auth.js';
	import { authClient } from '$lib/auth-client.js';

	// Accept authEnabled from parent layout
	let { authEnabled = false }: { authEnabled?: boolean } = $props();

	let email = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	async function handleAuth() {
		if ($authStore.state === 'authenticated') {
			// Sign out
			auth.signOut();
			return;
		}

		if ($authStore.state === 'unauthenticated') {
			// Show email input or submit email
			if (!email.trim()) {
				// Just focus on the input if it's already visible
				return;
			}

			// Submit email for magic link
			isSubmitting = true;
			errorMessage = '';

			try {
				await authClient.sendMagicLink(email.trim());
				auth.setMagicLinkSent();
				email = ''; // Clear email after successful send
			} catch (error) {
				errorMessage = error instanceof Error ? error.message : 'Authentication failed';
			} finally {
				isSubmitting = false;
			}
		}
	}

	function handleEmailSubmit(event: Event) {
		event.preventDefault();
		if (email.trim() && !isSubmitting) {
			handleAuth();
		}
	}

	function handleEmailKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleEmailSubmit(event);
		}
		if (event.key === 'Escape') {
			email = '';
			errorMessage = '';
		}
	}
</script>

<div class="auth-button-container">
	{#if !authEnabled}
		<!-- Authentication is disabled server-side - don't show anything -->
	{:else if $authStore.state === 'loading'}
		<div class="auth-loading">
			<div class="spinner"></div>
			<span>Loading...</span>
		</div>
	{:else if $authStore.state === 'authenticated'}
		<div class="auth-user">
			<span class="user-name">
				{$authStore.user?.name || $authStore.user?.email || 'User'}
			</span>
			<button
				class="auth-button sign-out-button"
				onclick={handleAuth}
				aria-label="Sign out"
			>
				Sign Out
			</button>
		</div>
	{:else if $authStore.state === 'magic-link-sent'}
		<div class="magic-link-sent">
			<div class="check-icon">✓</div>
			<span>Check your email!</span>
		</div>
	{:else if $authStore.state === 'magic-link-processing'}
		<div class="auth-loading">
			<div class="spinner"></div>
			<span>Signing you in...</span>
		</div>
	{:else}
		<form class="auth-form" onsubmit={handleEmailSubmit}>
			<div class="email-input-container">
				<input
					type="email"
					bind:value={email}
					onkeydown={handleEmailKeydown}
					placeholder="Enter your email"
					class="email-input"
					class:error={errorMessage}
					disabled={isSubmitting}
					required
					aria-label="Email address"
				/>
				<button
					type="submit"
					class="auth-button login-button"
					class:submitting={isSubmitting}
					disabled={!email.trim() || isSubmitting}
					aria-label="Send magic link"
				>
					{#if isSubmitting}
						<div class="button-spinner"></div>
					{:else}
						Sign In
					{/if}
				</button>
			</div>
			{#if errorMessage}
				<div class="error-message">{errorMessage}</div>
			{/if}
		</form>
	{/if}
</div>

<style>
	.auth-button-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.auth-loading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.auth-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-name {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		font-size: 0.9rem;
	}

	.magic-link-sent {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.check-icon {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.email-input-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.email-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 0.9rem;
		width: 200px;
		transition: all 0.2s ease;
	}

	.email-input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.email-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.15);
	}

	.email-input.error {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.auth-button {
		padding: 0.5rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 80px;
		height: 36px;
	}

	.auth-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.auth-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.login-button.submitting {
		background: rgba(255, 255, 255, 0.15);
	}

	.sign-out-button {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.3);
		color: #fca5a5;
	}

	.sign-out-button:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.button-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.error-message {
		color: #fca5a5;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.auth-button-container {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.email-input-container {
			flex-direction: column;
			align-items: stretch;
		}

		.email-input {
			width: 100%;
		}

		.user-name {
			text-align: center;
		}
	}
</style>
