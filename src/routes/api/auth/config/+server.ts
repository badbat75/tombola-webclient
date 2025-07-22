import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	// Check if Supabase is configured on the server
	const SUPABASE_URL = env.SUPABASE_URL;
	const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

	return json({
		authEnabled: !!(SUPABASE_URL && SUPABASE_ANON_KEY)
	});
};
