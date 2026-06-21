import * as Sentry from '@sentry/node';

let ready = false;

export function initSentry() {
  if (ready || !process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
  ready = true;
}

export { Sentry };
