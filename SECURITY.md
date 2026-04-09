# Security Guide for Rizzly AI

## Core protections already in the app
- Same-origin checks on sensitive API routes
- Prompt-injection-resistant handling for AI transcript, screenshot, and note inputs
- File validation for screenshot and voice-note uploads
- Rate limiting on public and authenticated API routes
- Defensive security headers in `next.config.ts`
- `.env.local` and other env files ignored by git via `.gitignore`

## Required production setup
Add these values in Vercel or your production host:

```env
NEXT_PUBLIC_APP_URL=https://rizzlyai.com
RIZZLY_ALLOWED_ORIGINS=https://rizzlyai.com,https://www.rizzlyai.com
RIZZLY_ADMIN_EMAIL_ALLOWLIST=malachibr0226@gmail.com
RIZZLY_PRO_EMAIL_ALLOWLIST=malachibr0226@gmail.com
OPENAI_API_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID=...
```

## Secret-handling rules
- Never commit `.env.local`
- Never paste live secrets into client code or `NEXT_PUBLIC_*` unless they are intentionally public
- Rotate `OPENAI_API_KEY`, `CLERK_SECRET_KEY`, and `STRIPE_SECRET_KEY` immediately if exposed
- Keep Vercel preview/project access limited to trusted collaborators only

## Production secret rotation checklist
1. **OpenAI**
   - Create a new API key in the OpenAI dashboard
   - Replace `OPENAI_API_KEY` in Vercel
   - Remove the old key after confirming production works

2. **Clerk**
   - Rotate the live `CLERK_SECRET_KEY`
   - Confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` matches the correct live instance
   - In Clerk domain settings, allow only `rizzlyai.com`, `www.rizzlyai.com`, and local development URLs you trust

3. **Stripe**
   - Roll the restricted/live `STRIPE_SECRET_KEY` if there is any doubt it was exposed
   - Confirm `STRIPE_PRICE_ID` is still the intended product/price
   - Review webhook endpoints and dashboard team access

4. **Vercel**
   - Re-save all production environment variables
   - Confirm `NEXT_PUBLIC_APP_URL=https://rizzlyai.com`
   - Confirm `RIZZLY_ALLOWED_ORIGINS=https://rizzlyai.com,https://www.rizzlyai.com`
   - Remove unused preview or test secrets from the Production environment
   - Review team/project members and remove any unknown collaborator access

## Clerk and Stripe lockdown
- In Clerk, allow only your real production domain and trusted localhost development URLs
- In Stripe, use server-only secret keys and keep checkout/billing configuration in environment variables
- Prefer webhooks for future billing automation if subscription logic grows

## Operational checks
Run these before shipping changes:

```bash
npm run security:check
```

Or manually:

```bash
npm audit --omit=dev
npm run build
```

## Incident response
If you suspect exposure or interference:
1. Rotate all live keys
2. Remove unknown admin/pro allowlist entries
3. Review recent Vercel environment changes
4. Redeploy after rotation
