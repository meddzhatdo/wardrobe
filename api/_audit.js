import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function getIp(req) {
  return req?.headers?.['x-forwarded-for']?.split(',')[0].trim()
    ?? req?.socket?.remoteAddress
    ?? null;
}

export async function logAuditEvent({ event, userId = null, endpoint, req, metadata = {} }) {
  try {
    await serviceClient().from('audit_logs').insert({
      event,
      user_id: userId ?? null,
      endpoint,
      ip: getIp(req),
      metadata,
    });
  } catch (err) {
    console.error('audit log failed:', err.message);
  }
}
