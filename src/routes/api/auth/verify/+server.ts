import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const access_token = url.searchParams.get('access_token');
		const refresh_token = url.searchParams.get('refresh_token');

		if (!access_token) {
			return redirect(302, '/?error=missing_token');
		}

		// Check if Supabase is configured
		const SUPABASE_URL = env.SUPABASE_URL;
		const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
			return redirect(302, '/?error=auth_not_configured');
		}

		// Verify token with Supabase
		const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
			method: 'GET',
			headers: {
				'apikey': SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${access_token}`
			}
		});

		if (!response.ok) {
			// If access token is invalid, try to refresh if refresh_token is provided
			if (refresh_token && response.status === 401) {
				const refreshResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
					method: 'POST',
					headers: {
						'apikey': SUPABASE_ANON_KEY,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						refresh_token
					})
				});

				if (refreshResponse.ok) {
					const refreshData = await refreshResponse.json();
					// Redirect to home with tokens in URL fragment (client-side will pick them up)
					const redirectUrl = `/?success=true#access_token=${refreshData.access_token}&refresh_token=${refreshData.refresh_token}`;
					return redirect(302, redirectUrl);
				}
			}

			return redirect(302, '/?error=invalid_token');
		}

		const userData = await response.json();

		// Redirect to home with tokens in URL fragment (client-side will pick them up)
		const redirectUrl = `/?success=true#access_token=${access_token}&refresh_token=${refresh_token || ''}`;
		return redirect(302, redirectUrl);

	} catch (error) {
		return redirect(302, '/?error=verification_failed');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { access_token, refresh_token } = await request.json();

		if (!access_token) {
			return json({ error: 'Access token is required' }, { status: 400 });
		}

		// Check if Supabase is configured
		const SUPABASE_URL = env.SUPABASE_URL;
		const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
			return json({ error: 'Authentication not configured' }, { status: 501 });
		}

		// Verify token with Supabase
		const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
			method: 'GET',
			headers: {
				'apikey': SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${access_token}`
			}
		});

		if (!response.ok) {
			// If access token is invalid, try to refresh if refresh_token is provided
			if (refresh_token && response.status === 401) {
				const refreshResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
					method: 'POST',
					headers: {
						'apikey': SUPABASE_ANON_KEY,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						refresh_token
					})
				});

				if (refreshResponse.ok) {
					const refreshData = await refreshResponse.json();
					return json({
						success: true,
						user: refreshData.user,
						access_token: refreshData.access_token,
						refresh_token: refreshData.refresh_token
					});
				}
			}

			const errorData = await response.text();
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const userData = await response.json();
		return json({
			success: true,
			user: userData,
			access_token,
			refresh_token
		});

	} catch (error) {
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
