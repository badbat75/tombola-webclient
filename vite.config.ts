import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],

	// Ensure environment variables are properly loaded
	envPrefix: 'VITE_',

	// Development server configuration
	server: {
		host: true, // Allow external connections
		port: 5173,
		strictPort: false, // Allow fallback ports if 5173 is busy
	},

	// Preview server configuration (for production build preview)
	preview: {
		host: true,
		port: 4173,
		strictPort: false,
	}
});
