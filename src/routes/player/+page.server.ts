import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, request }) => {
	// Check if authentication is configured on the server
	const SUPABASE_URL = env.SUPABASE_URL;
	const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

	const authEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

	// If auth is enabled, validate the user's authentication
	if (authEnabled) {
		// Try to get auth token from cookies or localStorage token stored in auth state
		const authToken = cookies.get('supabase-auth-token');

		// Check if we have a valid token
		if (!authToken) {
			// No token found, redirect to home page
			throw redirect(302, '/?error=auth_required');
		}

		try {
			// Parse the token data
			const tokenData = JSON.parse(authToken);
			const accessToken = tokenData.access_token;

			if (!accessToken) {
				throw redirect(302, '/?error=invalid_token');
			}

			// Verify token with Supabase
			const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
				method: 'GET',
				headers: {
					'apikey': SUPABASE_ANON_KEY,
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (!response.ok) {
				// Token is invalid or expired
				cookies.delete('supabase-auth-token', { path: '/' });
				throw redirect(302, '/?error=session_expired');
			}

			// Token is valid, user can access the page
			const userData = await response.json();

			return {
				authEnabled,
				user: userData
			};

		} catch (error) {
			// Error parsing token or validating - redirect to home
			cookies.delete('supabase-auth-token', { path: '/' });
			throw redirect(302, '/?error=auth_error');
		}
	}

	// Auth is disabled, allow access
	return {
		authEnabled
	};
};
