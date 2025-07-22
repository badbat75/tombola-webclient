import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load environment variables
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [sveltekit()],

		// Define environment variables to expose to client
		define: {
			'import.meta.env.API_HOST': JSON.stringify(env.API_HOST),
			'import.meta.env.API_PORT': JSON.stringify(env.API_PORT),
			'import.meta.env.API_PROTOCOL': JSON.stringify(env.API_PROTOCOL),
			'import.meta.env.DEBUG_MODE': JSON.stringify(env.DEBUG_MODE),
		},

		// Keep envPrefix for client-safe variables only
		// NEVER include SUPABASE_ or AUTH_ prefixes as they expose sensitive server-only credentials
		envPrefix: ['VITE_', 'PUBLIC_'],

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
	};
});
