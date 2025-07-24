<!--
  Card Selection Modal Component
  Shows when a player wants to join a game with cards
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let gameTitle: string = '';
	export let isOpen = false;

	let cardCount = 1;
	let isJoining = false;
	const dispatch = createEventDispatcher();

	function handleClose() {
		isOpen = false;
		dispatch('close');
	}

	function handleCardCountChange(event: Event) {
		const target = event.target as HTMLInputElement;
		cardCount = parseInt(target.value) || 1;
	}

	async function handleJoinWithCards() {
		if (cardCount <= 0) return;

		isJoining = true;
		dispatch('join', { cardCount });
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
		<div class="modal-content">
			<div class="modal-header">
				<h3>Select Number of Cards</h3>
				<button class="close-btn" onclick={handleClose}>×</button>
			</div>

			<div class="modal-body">
				<p>How many cards would you like for <strong>{gameTitle}</strong>?</p>

				<div class="card-selector">
					<label for="cardCount">Number of cards:</label>
					<input
						id="cardCount"
						type="number"
						min="1"
						max="10"
						bind:value={cardCount}
						oninput={handleCardCountChange}
						disabled={isJoining}
					/>
				</div>

				<div class="card-info">
					<p>💡 You can play with up to 10 cards simultaneously</p>
				</div>
			</div>

			<div class="modal-footer">
				<button class="cancel-btn" onclick={handleClose} disabled={isJoining}>
					Cancel
				</button>
				<button
					class="join-btn"
					onclick={handleJoinWithCards}
					disabled={isJoining || cardCount <= 0}
				>
					{isJoining ? 'Joining...' : `Join with ${cardCount} card${cardCount !== 1 ? 's' : ''}`}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		max-width: 400px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px 16px;
		border-bottom: 1px solid #e0e0e0;
	}

	.modal-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.close-btn:hover {
		background: #f5f5f5;
		color: #333;
	}

	.modal-body {
		padding: 24px;
	}

	.modal-body p {
		margin: 0 0 20px 0;
		color: #555;
		line-height: 1.5;
	}

	.card-selector {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.card-selector label {
		font-weight: 500;
		color: #333;
	}

	.card-selector input {
		padding: 10px 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
		width: 100px;
	}

	.card-selector input:focus {
		outline: none;
		border-color: #007bff;
	}

	.card-selector input:disabled {
		background: #f5f5f5;
		color: #999;
	}

	.card-info {
		background: #f8f9fa;
		border-left: 4px solid #007bff;
		padding: 12px 16px;
		border-radius: 4px;
		margin-top: 16px;
	}

	.card-info p {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
	}

	.modal-footer {
		display: flex;
		gap: 12px;
		padding: 20px 24px;
		border-top: 1px solid #e0e0e0;
		justify-content: flex-end;
	}

	.cancel-btn,
	.join-btn {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 80px;
	}

	.cancel-btn {
		background: #f5f5f5;
		color: #666;
	}

	.cancel-btn:hover:not(:disabled) {
		background: #e9ecef;
		color: #333;
	}

	.join-btn {
		background: #007bff;
		color: white;
	}

	.join-btn:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
	}

	.cancel-btn:disabled,
	.join-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
</style>
