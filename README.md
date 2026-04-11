# Rizzly AI

Rizzly AI is a Next.js app for generating sharper, safer reply suggestions from pasted chats, screenshots, and voice notes.

## Launch-ready highlights
- polished landing experience and mobile-style UI
- screenshot and voice-note support
- saved personas, cloud sync, and Pro upgrade flow
- admin controls, lightweight analytics, and security hardening

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment setup
Copy `.env.example` into `.env.local` and provide your real values:

```env
OPENAI_API_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=...
STRIPE_PLUS_PRICE_ID=...
STRIPE_PRO_PRICE_ID=...
NEXT_PUBLIC_STRIPE_PLUS_PAYMENT_LINK=...
NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK=...
RIZZLY_PRO_EMAIL_ALLOWLIST=you@example.com
RIZZLY_ADMIN_EMAIL_ALLOWLIST=you@example.com
RIZZLY_ALLOWED_ORIGINS=http://localhost:3000,https://rizzlyai.com,https://www.rizzlyai.com
```

> `STRIPE_PRICE_ID` and `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` can still point to your Pro offer as backwards-compatible fallbacks.

## Security checks
Before shipping or after any DNS / hosting change:

```bash
npm run security:check
npm run deploy:verify
```

Or run the checks manually:

```bash
npm audit --omit=dev
npm run build
node ./scripts/verify-production.mjs
```

The deployment verifier fails fast if the production domain resolves to private IP space or if `https://rizzlyai.com/api/health` stops responding cleanly.

See `SECURITY.md` for the full hardening checklist, secret-handling rules, and production lockdown guidance.

## Deployment
Deploy on Vercel and set the same environment variables there. Use your canonical production domain in `NEXT_PUBLIC_APP_URL` and `RIZZLY_ALLOWED_ORIGINS`.
