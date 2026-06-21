import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Returns { limited: true } if the user has exceeded maxRequests ai_call events
 * for the given endpoint within the past windowMinutes. Fails open on error.
 */
export async function checkRateLimit({ userId, endpoint, maxRequests, windowMinutes }) {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { count, error } = await serviceClient()
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event', 'ai_call')
      .eq('endpoint', endpoint)
      .gte('created_at', since);

    if (error) return { limited: false };
    return { limited: count >= maxRequests };
  } catch {
    return { limited: false };
  }
}
