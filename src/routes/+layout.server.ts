import { env } from '$env/dynamic/private';

export async function load() {
	// Check if authentication is configured on the server
	const SUPABASE_URL = env.SUPABASE_URL;
	const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

	const authEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

	return {
		authEnabled
	};
}
