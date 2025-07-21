<script lang="ts">
  export let activeMode: 'player' | 'board' = 'player';
</script>

<nav class="mode-nav">
  <a href="/" class="nav-link" class:active={activeMode === 'player'}>Card Player</a>
  <a href="/board" class="nav-link" class:active={activeMode === 'board'}>Board Operator</a>
</nav>

<style>
  .mode-nav {
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 25px;
    padding: 4px;
    border: 1px solid #e0e0e0;
  }

  .nav-link {
    padding: 8px 16px;
    border-radius: 20px;
    text-decoration: none;
    color: #666;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .nav-link:hover {
    color: #333;
    background: rgba(255, 255, 255, 0.5);
  }

  .nav-link.active {
    background: var(--active-color, #667eea);
    color: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }
</style>
