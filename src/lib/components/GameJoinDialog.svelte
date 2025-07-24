<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import CardSelectionModal from './CardSelectionModal.svelte';
	import type { GameStatus } from '$lib/types';
	import { tombolaApi } from '$lib/api.js';

	export let game: GameStatus | null = null;
	export let isOpen = false;
	export let userName: string = '';

	let requestCards = 'cards'; // Default to card player for non-board owners
	let isJoining = false;
	let showCardSelection = false;
	let error = '';
	let isBoardOwner = false;

	const dispatch = createEventDispatcher();

	$: canRequestCards = game?.status?.toLowerCase() === 'new';
	$: showBoardOption = isBoardOwner;
	$: canAccessBoard = isBoardOwner; // Board owners can always access the board
	$: canRejoinAsPlayer = true; // Players can always rejoin active games if they have cards

	// Debug reactive values
	$: console.log('Dialog reactive values:', {
		isBoardOwner,
		showBoardOption,
		canRequestCards,
		canAccessBoard,
		canRejoinAsPlayer,
		gameOwner: game?.owner,
		userName,
		gameStatus: game?.status
	});

	// Function to check if the user is the board owner
	// We need to compare by name since client IDs differ between global and game-specific registration
	async function checkBoardOwnership() {
		console.log('Checking board ownership...', { gameOwner: game?.owner, userName });

		if (!game?.owner || !userName) {
			console.log('Missing game owner or userName');
			isBoardOwner = false;
			return;
		}

		try {
			// Get the owner's client info from the server
			console.log('Getting client info for owner:', game.owner);
			const ownerInfo = await tombolaApi.getClientById(game.owner);
			console.log('Owner info received:', ownerInfo);

			const ownershipMatch = ownerInfo.name === userName;
			console.log('Ownership check:', { ownerName: ownerInfo.name, userName, matches: ownershipMatch });

			// Force reactivity update
			isBoardOwner = ownershipMatch;
			console.log('Board ownership set to:', isBoardOwner);

			// Trigger reactive updates
			requestCards = ownershipMatch ? 'board' : 'cards';
		} catch (error) {
			console.warn('Failed to check board ownership:', error);
			isBoardOwner = false;
		}
	}

	// Check board ownership when game or userName changes
	$: if (game?.owner && userName) {
		checkBoardOwnership();
	} else {
		isBoardOwner = false;
	}

	// Set default selection based on board ownership
	$: if (game && isBoardOwner) {
		requestCards = 'board';
	} else {
		requestCards = 'cards';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	function onClose() {
		isOpen = false;
		dispatch('close');
	}

	async function handleJoin() {
		if (!game) {
			console.error('No game available!');
			return;
		}

		try {
			if (requestCards === 'board') {
				// For board mode, check if user is the board owner
				if (isBoardOwner) {
					// User is the board owner, join as board client
					dispatch('joinBoard', { gameId: game.game_id });
					onClose();
				} else {
					// User is not the board owner, they need to create a new game or join as player
					error = 'Only the game creator can access board mode for this game. You can create a new game or join as a player.';
				}
			} else {
				// Regular player - can request cards for new games or rejoin active games
				if (canRequestCards) {
					// New game - show card selection
					showCardSelection = true;
				} else {
					// Active game - try to rejoin (may already have cards)
					isJoining = true;
					dispatch('join', { gameId: game.game_id, cardCount: 0 });
				}
			}
		} catch (error) {
			console.error('Error in handleJoin:', error);
			error = `Failed to join game: ${error}`;
		}
	}	function handleCardSelectionJoin(event: CustomEvent) {
		const { cardCount } = event.detail;
		isJoining = true;
		showCardSelection = false;
		dispatch('join', { gameId: game?.game_id, cardCount });
	}

	function handleCardSelectionClose() {
		showCardSelection = false;
	}
</script>

<div class="dialog-overlay"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' ? onClose() : null}
	role="button"
	tabindex="0"
	aria-label="Close dialog"
>
	<div class="dialog"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="dialog-header">
			<h2>Join Game</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close dialog">×</button>
		</div>

		<div class="dialog-content">
			<div class="game-info">
				<h3>{game?.game_id}</h3>
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Status:</span>
						<span class="value status-{game?.status.toLowerCase()}">{game?.status}</span>
					</div>
					<div class="info-item">
						<span class="label">Created:</span>
						<span class="value">{game ? formatDate(game.created_at) : ''}</span>
					</div>
					<div class="info-item">
						<span class="label">Players:</span>
						<span class="value">{game?.players || '0'}</span>
					</div>
					<div class="info-item">
						<span class="label">Numbers Drawn:</span>
						<span class="value">{game?.numbers_extracted || 0}/90</span>
					</div>
				</div>
			</div>			<div class="user-info">
				<p><strong>Joining as:</strong> {userName}</p>
			</div>

			{#if canRequestCards || canAccessBoard || canRejoinAsPlayer}
				<div class="options">
					<h4>Join Game</h4>
					{#if showBoardOption}
						<label class="option board-owner">
							<input
								type="radio"
								bind:group={requestCards}
								value="board"
								disabled={isJoining || !isBoardOwner}
							/>
							<span class="option-text">
								<strong>🎯 Play with board</strong>
								<small>{isBoardOwner ? 'You are the board owner with extraction privileges' : 'Only game creator can extract numbers'}</small>
								{#if !isBoardOwner}
									<small class="warning">⚠️ Create a new game to become board operator</small>
								{/if}
							</span>
						</label>
					{/if}
					{#if canRequestCards || canRejoinAsPlayer}
						<label class="option">
							<input
								type="radio"
								bind:group={requestCards}
								value={true}
								disabled={isJoining}
							/>
							<span class="option-text">
								<strong>🎴 Play with cards</strong>
								<small>
									{#if canRequestCards}
										Join as a player with tombola cards
									{:else}
										Rejoin game (you may already have cards assigned)
									{/if}
								</small>
							</span>
						</label>
					{/if}
				</div>
			{:else}
				<div class="spectator-notice">
					<p><strong>Spectator Mode Only</strong></p>
					<p>This game has already started. You can join as a spectator to watch the game progress, but you cannot request cards.</p>
				</div>
			{/if}

			{#if error}
				<div class="error-message">{error}</div>
			{/if}
		</div>

		<div class="dialog-actions">
			<button class="cancel-btn" onclick={onClose} disabled={isJoining}>
				Cancel
			</button>
			<button class="join-btn" onclick={handleJoin} disabled={isJoining}>
				{isJoining ? 'Joining...' :
				 requestCards === 'board' ? 'Go to Board' : 'Join Game'}
			</button>
		</div>
	</div>
</div>

<CardSelectionModal
	bind:isOpen={showCardSelection}
	gameTitle={game?.game_id || ''}
	on:join={handleCardSelectionJoin}
	on:close={handleCardSelectionClose}
/>

<style>
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(2px);
	}

	.dialog {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow: auto;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.dialog-header h2 {
		margin: 0;
		color: #1f2937;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #374151;
	}

	.dialog-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.game-info h3 {
		margin: 0 0 1rem;
		color: #1f2937;
		font-family: monospace;
		font-size: 1.1rem;
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 6px;
	}

	.game-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.label {
		font-weight: 500;
		color: #4b5563;
	}

	.value {
		color: #1f2937;
	}

	.status-new {
		background: #10b981;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.status-active {
		background: #f59e0b;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.user-info {
		background: #f0f9ff;
		padding: 1rem;
		border-radius: 8px;
		border-left: 4px solid #0ea5e9;
	}

	.user-info p {
		margin: 0;
		color: #0c4a6e;
	}

	.options h4 {
		margin: 0 0 1rem;
		color: #1f2937;
	}

	.option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.option:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.option:has(input:checked) {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.option.board-owner {
		border-color: #f59e0b;
		background: #fffbeb;
	}

	.option.board-owner:hover {
		border-color: #d97706;
		background: #fef3c7;
	}

	.option.board-owner:has(input:checked) {
		border-color: #f59e0b;
		background: #fef3c7;
	}

	.option input[type="radio"] {
		margin-top: 0.1rem;
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.option-text strong {
		color: #1f2937;
	}

	.option-text small {
		color: #6b7280;
		font-size: 0.85rem;
	}

	.spectator-notice {
		background: #fef3c7;
		padding: 1rem;
		border-radius: 8px;
		border-left: 4px solid #f59e0b;
	}

	.spectator-notice p {
		margin: 0 0 0.5rem;
		color: #92400e;
	}

	.spectator-notice p:last-child {
		margin-bottom: 0;
	}

	.error-message {
		background: #fee2e2;
		color: #991b1b;
		padding: 0.75rem;
		border-radius: 6px;
		border-left: 4px solid #ef4444;
		font-size: 0.9rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.cancel-btn, .join-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.cancel-btn:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.join-btn {
		background: #3b82f6;
		color: white;
		border: 1px solid #3b82f6;
	}

	.join-btn:hover:not(:disabled) {
		background: #2563eb;
	}

	.cancel-btn:disabled, .join-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.warning {
		color: #f59e0b !important;
		font-style: italic;
		font-size: 0.8em;
		display: block;
		margin-top: 2px;
	}

	@media (max-width: 640px) {
		.dialog {
			width: 95%;
			margin: 1rem;
		}

		.dialog-header, .dialog-content, .dialog-actions {
			padding-left: 1rem;
			padding-right: 1rem;
		}

		.dialog-actions {
			flex-direction: column;
		}

		.cancel-btn, .join-btn {
			width: 100%;
		}
	}
</style>
