import { auth, authStore, type AuthUser } from './stores/auth.js';
import { get } from 'svelte/store';

// Security helper to verify auth is actually enabled on server
async function verifyAuthEnabled(): Promise<boolean> {
	try {
		const response = await fetch('/api/auth/config');
		if (!response.ok) return false;
		const config = await response.json();
		return config.authEnabled;
	} catch {
		return false;
	}
}

export interface AuthResponse {
	success: boolean;
	message?: string;
	error?: string;
}

export interface VerifyResponse {
	success: boolean;
	user?: AuthUser;
	access_token?: string;
	refresh_token?: string;
	error?: string;
}

export class AuthClient {
	/**
	 * Send magic link authentication request to SSR endpoint
	 * Uses server-side Supabase configuration without exposing credentials to browser
	 */
	async sendMagicLink(email: string): Promise<AuthResponse> {
		// Security check: verify auth is actually enabled on server
		const authEnabled = await verifyAuthEnabled();
		if (!authEnabled) {
			throw new Error('Authentication is not available on this server.');
		}

		try {
			const response = await fetch('/api/auth/magic-link', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (!response.ok) {
				// Provide helpful error messages based on status
				if (response.status === 501) {
					throw new Error('Authentication is not configured on this server.');
				} else if (response.status >= 500) {
					throw new Error(`Server error (${response.status}): ${result.error || 'Unknown error'}`);
				} else {
					throw new Error(`Authentication failed (${response.status}): ${result.error || 'Unknown error'}`);
				}
			}

			return { success: true, message: 'Magic link sent successfully' };

		} catch (error) {
			// Handle network errors
			if (error instanceof TypeError && error.message.includes('fetch')) {
				throw new Error(`Cannot connect to authentication service. Please check your connection.`);
			}

			// Re-throw other errors
			throw error;
		}
	}

	/**
	 * Verify authentication token with SSR endpoint
	 */
	async verifyToken(accessToken: string, refreshToken?: string): Promise<VerifyResponse> {
		try {
			const response = await fetch('/api/auth/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					access_token: accessToken,
					refresh_token: refreshToken
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				return { success: false, error: result.error || 'Token verification failed' };
			}

			return {
				success: true,
				user: result.user,
				access_token: result.access_token,
				refresh_token: result.refresh_token
			};

		} catch (error) {
			return { success: false, error: 'Network error during token verification' };
		}
	}

	/**
	 * Process magic link token from URL
	 * This extracts token from URL and processes it with the server
	 */
	async processMagicLinkToken(url: string): Promise<{ user: AuthUser; token: string; refreshToken?: string } | null> {
		// Extract tokens from various possible URL formats
		let accessToken: string | null = null;
		let refreshToken: string | null = null;

		try {
			const urlObj = new URL(url);

			// Check for tokens in hash (Supabase format)
			if (urlObj.hash) {
				const hashParams = new URLSearchParams(urlObj.hash.substring(1));
				accessToken = hashParams.get('access_token');
				refreshToken = hashParams.get('refresh_token');
			}

			// Check for tokens in query params (fallback format)
			if (!accessToken) {
				accessToken = urlObj.searchParams.get('access_token');
				refreshToken = urlObj.searchParams.get('refresh_token');
			}

			if (!accessToken) {
				return null;
			}

			// Verify token with SSR endpoint
			const verification = await this.verifyToken(accessToken, refreshToken || undefined);

		if (!verification.success || !verification.user || !verification.access_token) {
			return null;
		}

		return {
			user: verification.user,
			token: verification.access_token,
			refreshToken: verification.refresh_token
		};		} catch (error) {
			return null;
		}
	}
}

// Export singleton instance
export const authClient = new AuthClient();

// Helper functions for magic link processing
export async function processMagicLink(url: string): Promise<boolean> {
	try {
		const result = await authClient.processMagicLinkToken(url);

		if (result) {
			// Pass both access and refresh tokens to the auth store
			auth.setAuthenticated(result.user, result.token, result.refreshToken);
			return true;
		}

		return false;
	} catch (error) {
		return false;
	}
}
