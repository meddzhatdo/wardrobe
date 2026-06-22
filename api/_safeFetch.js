const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/i;

/**
 * fetch() wrapper that validates every redirect hop against the BLOCKED list.
 * Prevents SSRF where an attacker supplies a URL that redirects to an internal
 * address (e.g. AWS metadata at 169.254.169.254) that would pass an initial check.
 */
export async function safeFetch(url, options = {}) {
  let current = url;
  for (let hops = 0; hops < 5; hops++) {
    const res = await fetch(current, { ...options, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw new Error('Redirect with no Location header');
      const next = new URL(loc, current);
      if (!['http:', 'https:'].includes(next.protocol)) throw new Error('Blocked redirect: disallowed protocol');
      if (BLOCKED.test(next.hostname)) throw new Error('Blocked redirect: internal address');
      current = next.href;
      continue;
    }
    return res;
  }
  throw new Error('Too many redirects');
}

export { BLOCKED };
