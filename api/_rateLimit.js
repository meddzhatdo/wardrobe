import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Returns { limited: true } if the user has exceeded maxRequests events
 * for the given endpoint within the past windowMinutes. Fails open on error.
 * `event` defaults to 'ai_call' for backwards compatibility.
 */
export async function checkRateLimit({ userId, endpoint, maxRequests, windowMinutes, event = 'ai_call' }) {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { count, error } = await serviceClient()
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event', event)
      .eq('endpoint', endpoint)
      .gte('created_at', since);

    if (error) return { limited: false };
    if (count >= maxRequests) {
      const { data } = await serviceClient()
        .from('audit_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('event', event)
        .eq('endpoint', endpoint)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(1);
      const resetsAt = data?.[0]?.created_at
        ? new Date(new Date(data[0].created_at).getTime() + windowMinutes * 60 * 1000).toISOString()
        : null;
      return { limited: true, resetsAt };
    }
    return { limited: false };
  } catch {
    return { limited: false };
  }
}
