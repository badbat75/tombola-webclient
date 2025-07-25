import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'disabled' | 'magic-link-sent' | 'magic-link-processing';

export interface AuthUser {
	email: string;
	name?: string;
	sub?: string;
	exp?: number;
}

export interface AuthStore {
	state: AuthState;
	user: AuthUser | null;
	token: string | null;
	refreshToken: string | null;
	authEnabled?: boolean; // Server-side auth configuration (read-only)
}

// Initial auth store state - always start with loading to check server
const initialState: AuthStore = {
	state: 'loading',
	user: null,
	token: null,
	refreshToken: null,
	authEnabled: undefined // Will be set by server response
};

// Create the writable store
export const authStore: Writable<AuthStore> = writable(initialState);

// Auth store actions
export const auth = {
	// Set loading state
	setLoading: () => {
		authStore.update(store => ({
			...store,
			state: 'loading'
		}));
	},

	// Set authenticated state with user data
	setAuthenticated: (user: AuthUser, token: string, refreshToken?: string) => {
		authStore.update(store => ({
			...store,
			state: 'authenticated',
			user,
			token,
			refreshToken: refreshToken || null
		}));

		// Store tokens in localStorage for persistence
		if (browser) {
			localStorage.setItem('tombola-auth-token', token);
			localStorage.setItem('tombola-auth-user', JSON.stringify(user));
			if (refreshToken) {
				localStorage.setItem('tombola-auth-refresh-token', refreshToken);
			} else {
				localStorage.removeItem('tombola-auth-refresh-token');
			}

			// Store auth token in cookie for server-side validation
			const cookieData = JSON.stringify({
				access_token: token,
				refresh_token: refreshToken,
				expires_at: new Date(Date.now() + 3600000).getTime() // 1 hour from now
			});
			document.cookie = `supabase-auth-token=${encodeURIComponent(cookieData)}; path=/; max-age=3600; SameSite=Strict`;
		}
	},

	// Set unauthenticated state
	setUnauthenticated: () => {
		authStore.update(store => ({
			...store,
			state: 'unauthenticated',
			user: null,
			token: null,
			refreshToken: null
		}));

		// Clear stored data
		if (browser) {
			localStorage.removeItem('tombola-auth-token');
			localStorage.removeItem('tombola-auth-user');
			localStorage.removeItem('tombola-auth-refresh-token');

			// Clear auth cookie
			document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
		}
	},

	// Set authentication disabled state
	setDisabled: () => {
		authStore.update(store => ({
			...store,
			state: 'disabled',
			user: null,
			token: null,
			refreshToken: null
		}));

		// Clear any stored data
		if (browser) {
			localStorage.removeItem('tombola-auth-token');
			localStorage.removeItem('tombola-auth-user');
			localStorage.removeItem('tombola-auth-refresh-token');

			// Clear auth cookie
			document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
		}
	},

	// Set magic link sent state
	setMagicLinkSent: () => {
		authStore.update(store => ({
			...store,
			state: 'magic-link-sent'
		}));
	},

	// Set magic link processing state
	setMagicLinkProcessing: () => {
		authStore.update(store => ({
			...store,
			state: 'magic-link-processing'
		}));
	},

	// Check if authentication is configured on the server
	checkAuthConfiguration: async () => {
		if (!browser) return;

		try {
			// Use dedicated config endpoint that doesn't expose sensitive information
			const response = await fetch('/api/auth/config');

			if (!response.ok) {
				auth.setDisabled();
				return;
			}

			const config = await response.json();

			if (config.authEnabled) {
				// Authentication is configured, proceed with normal flow
				authStore.update(store => ({ ...store, authEnabled: true }));
				auth.initialize();
			} else {
				// Authentication not configured
				authStore.update(store => ({ ...store, authEnabled: false }));
				auth.setDisabled();
			}
		} catch (error) {
			// If we can't check, assume authentication is disabled for security
			auth.setDisabled();
		}
	},

	// Initialize auth state from localStorage
	initialize: () => {
		if (!browser) return;

		const token = localStorage.getItem('tombola-auth-token');
		const userStr = localStorage.getItem('tombola-auth-user');
		const refreshToken = localStorage.getItem('tombola-auth-refresh-token');

		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);

				// Check if token is expired
				if (user.exp && Date.now() >= user.exp * 1000) {
					auth.setUnauthenticated();
					return;
				}

				auth.setAuthenticated(user, token, refreshToken || undefined);
			} catch (error) {
				auth.setUnauthenticated();
			}
		} else {
			auth.setUnauthenticated();
		}
	},

	// Sign out
	signOut: () => {
		auth.setUnauthenticated();
	}
};
