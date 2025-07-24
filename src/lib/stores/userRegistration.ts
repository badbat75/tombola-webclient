import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface UserRegistrationState {
  isRegistered: boolean;
  clientId: string | null;
  userName: string | null;
}

// Initialize from localStorage if available
const getInitialState = (): UserRegistrationState => {
  if (!browser) {
    return {
      isRegistered: false,
      clientId: null,
      userName: null
    };
  }

  const clientId = localStorage.getItem('tombola-client-id');
  const userName = localStorage.getItem('tombola-user-name');

  return {
    isRegistered: !!(clientId && userName),
    clientId,
    userName
  };
};

export const userRegistrationStore = writable<UserRegistrationState>(getInitialState());

// Helper functions
export const userRegistration = {
  register: (clientId: string, userName: string) => {
    if (browser) {
      localStorage.setItem('tombola-client-id', clientId);
      localStorage.setItem('tombola-user-name', userName);
    }
    userRegistrationStore.set({
      isRegistered: true,
      clientId,
      userName
    });
  },

  unregister: () => {
    if (browser) {
      localStorage.removeItem('tombola-client-id');
      localStorage.removeItem('tombola-user-name');
    }
    userRegistrationStore.set({
      isRegistered: false,
      clientId: null,
      userName: null
    });
  }
};
