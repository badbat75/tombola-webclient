import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Check if Supabase is configured
		const SUPABASE_URL = env.SUPABASE_URL;
		const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
			return json({ error: 'Authentication not configured' }, { status: 501 });
		}

		// Construct the correct redirect URL using the request origin
		const redirectUrl = `${url.origin}/magic-link`;

		// Send magic link via Supabase Auth API
		const response = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
			method: 'POST',
			headers: {
				'apikey': SUPABASE_ANON_KEY,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email,
				options: {
					emailRedirectTo: redirectUrl
				}
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			return json({ error: 'Failed to send magic link' }, { status: response.status });
		}

		const data = await response.json();
		return json({ success: true, data });

	} catch (error) {
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
