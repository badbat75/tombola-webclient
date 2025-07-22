import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Check if authentication is enabled on the server
  const authEnabled = !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);

  return {
    authEnabled
  };
};
