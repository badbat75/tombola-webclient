# Tombola Game - AI Coding Assistant Instructions

- This is a Svelte-based web client tombola/bingo game. The client communicates via Rest API to a Rust-based server that manages the game state and logic.

## Behaviour Guidelines
- At first prompt consult `README.md` and `docs` directory.
- Always update `README.md` and `docs` when you make changes to the API or game logic.
- When changing documentation don't run tests.
- Be concise and clear in your responses.
- Do not create new docs unless explicitly asked.

## Code Rules
- Check IDE warnings at each change to guide your code quality.

## Environment Info
- This is a Windows system with PowerShell, do not use bash commands.
- If you need to create test scripts, place them in the `tests/` directory.
- Server documentation is in the workspace directory `tombola` under `docs/`, the most important is `docs/TOMBOLA_API.md`.
- Do not run dev server in workspace (npm run dev), ask to run it if needed.
