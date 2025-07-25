<script lang="ts">
	import { goto } from '$app/navigation';
	import { tombolaApi } from '../api.js';
	import { userRegistration } from '../stores/userRegistration.js';

	interface Props {
		onUserRegistered?: (clientId: string, userName: string) => void;
	}

	let { onUserRegistered }: Props = $props();

	let userName = $state('');
	let isRegistering = $state(false);
	let isRegistered = $state(false);
	let registeredClientId = $state<string | null>(null);
	let registeredUserName = $state<string | null>(null);
	let errorMessage = $state('');

	// Check localStorage for existing registration
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			const storedClientId = localStorage.getItem('tombola-client-id');
			const storedUserName = localStorage.getItem('tombola-user-name');

			if (storedClientId && storedUserName) {
				registeredClientId = storedClientId;
				registeredUserName = storedUserName;
				isRegistered = true;

				// Set the client ID in the API client
				tombolaApi.setClientId(storedClientId);
			}
		}
	});

	async function handleRegister() {
		if (!userName.trim()) return;

		isRegistering = true;
		errorMessage = '';

		try {
			const response = await tombolaApi.globalRegister(userName.trim(), 'player');

			registeredClientId = response.client_id;
			registeredUserName = userName.trim();
			isRegistered = true;

			// Update the store
			userRegistration.register(response.client_id, userName.trim());

			// Set the client ID in the API client
			tombolaApi.setClientId(response.client_id);

			// Notify parent component
			if (onUserRegistered) {
				onUserRegistered(response.client_id, userName.trim());
			}

			userName = '';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Registration failed';
		} finally {
			isRegistering = false;
		}
	}

	function handleUnregister() {
		registeredClientId = null;
		registeredUserName = null;
		isRegistered = false;
		userName = '';
		errorMessage = '';

		// Update the store
		userRegistration.unregister();

		// Clear client ID from API client
		tombolaApi.setClientId('');

		// Navigate to home page
		goto('/');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isRegistering) {
			handleRegister();
		}
	}
</script>

<div class="user-registration">
	{#if isRegistered && registeredUserName}
		<div class="registered-user">
			<span class="user-name">👤 {registeredUserName}</span>
			<button
				class="unregister-btn"
				onclick={handleUnregister}
				title="Sign out"
			>
				Sign Out
			</button>
		</div>
	{:else}
		<div class="registration-form">
			<input
				type="text"
				bind:value={userName}
				placeholder="Enter your name"
				disabled={isRegistering}
				onkeydown={handleKeydown}
				class="name-input"
			/>
			<button
				onclick={handleRegister}
				disabled={isRegistering || !userName.trim()}
				class="register-btn"
			>
				{isRegistering ? 'Registering...' : 'Register'}
			</button>
		</div>
	{/if}

	{#if errorMessage}
		<div class="error-message">{errorMessage}</div>
	{/if}
</div>

<style>
	.user-registration {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.registered-user {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		backdrop-filter: blur(10px);
	}

	.user-name {
		color: white;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.unregister-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background-color 0.2s ease;
	}

	.unregister-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.registration-form {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.name-input {
		padding: 0.5rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
		font-size: 0.9rem;
		min-width: 160px;
	}

	.name-input::placeholder {
		color: rgba(255, 255, 255, 0.7);
	}

	.name-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.15);
	}

	.name-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.register-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.2s ease;
		white-space: nowrap;
	}

	.register-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
	}

	.register-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		color: #ff6b6b;
		font-size: 0.8rem;
		background: rgba(255, 107, 107, 0.1);
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		border: 1px solid rgba(255, 107, 107, 0.3);
		max-width: 250px;
		text-align: center;
	}

	@media (max-width: 768px) {
		.user-registration {
			align-items: center;
		}

		.registration-form {
			flex-direction: column;
			width: 100%;
		}

		.name-input {
			width: 100%;
			min-width: auto;
		}

		.registered-user {
			justify-content: center;
		}
	}
</style>
