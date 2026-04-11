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
RIZZLY_ADMIN_EMAIL_ALLOWLIST=you@yourdomain.com
RIZZLY_PRO_EMAIL_ALLOWLIST=you@yourdomain.com
OPENAI_API_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID=...
```

## Account lockdown (do this now)
These steps prevent anyone from accessing your Clerk account or admin panel even if a key leaks:

### Clerk (identity provider)
1. **Enable MFA** on your Clerk dashboard account at `https://dashboard.clerk.com` → Account → Security → Two-factor authentication. Use an authenticator app, not SMS.
2. **Remove any unrecognized social connections** in Clerk dashboard → Configure → SSO Connections.
3. **Restrict allowed sign-in methods** to only the ones you personally use (email + Google or Apple only — disable everything else).
4. **Whitelist only your production domain** in Clerk → Configure → Domains: `rizzlyai.com`. Remove localhost and any `*.vercel.app` entries when not doing active development.
5. **Session timeout**: in Clerk → Configure → Sessions, set the session lifetime to the shortest value you can tolerate (e.g. 7 days active, 24-hour idle timeout).
6. **Rotate `CLERK_SECRET_KEY`** if you have any doubt it was seen by an unintended party. After rotating, update it in Vercel immediately and redeploy.
7. **Audit active sessions**: Clerk → Users → your account → Sessions. Revoke any unrecognized active sessions.

### Vercel (host)
1. **Enable MFA** at `https://vercel.com/account/security`.
2. **Audit team members** — `https://vercel.com/teams` — remove anyone who should not have project access.
3. **Set environment variables to Production-only** for live secrets (Clerk, Stripe, OpenAI). Do not expose them to Preview deployments if those URLs are publicly accessible.
4. **Protect Preview deployments** with Vercel Password Protection (project → Settings → Deployment Protection).

### Admin panel
- Admin access is driven entirely by `RIZZLY_ADMIN_EMAIL_ALLOWLIST` (set in Vercel env vars). No email addresses are hardcoded in source code.
- The admin route has a strict **5 requests per minute** rate limit to slow down any brute-force enumeration.
- If you ever see an unexpected admin or pro email in the list, remove it immediately via the admin panel and rotate all secrets.

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
Run these before shipping changes or immediately after DNS / hosting edits:

```bash
npm run security:check
npm run deploy:verify
```

Or manually:

```bash
npm audit --omit=dev
npm run build
node ./scripts/verify-production.mjs
```

The deployment verifier checks for two high-risk outage patterns:
- the production hostname resolving to private/internal IP space such as `192.168.x.x` or `fd00::/8`
- the public app or `api/health` endpoint failing to answer over HTTPS

## DNS and domain guardrails
- Keep registrar and DNS provider accounts behind strong unique passwords and MFA
- Enable domain lock / registrar lock and DNSSEC if your provider supports them
- Keep only the intended Vercel DNS records; remove any stray `A` / `AAAA` records that point to private or legacy hosts
- Leave the scheduled `Production Guard` GitHub Actions workflow enabled so DNS and HTTPS regressions are caught automatically
- Point an uptime monitor at `https://rizzlyai.com/api/health` for external alerting

## Incident response
If you suspect exposure or interference:
1. Rotate all live keys
2. Remove unknown admin/pro allowlist entries
3. Review recent Vercel environment changes
4. Check domain DNS immediately and remove any private/internal IP records
5. Redeploy after rotation and rerun `npm run deploy:verify`
