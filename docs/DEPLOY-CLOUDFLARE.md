# XAWD V2 — Deploy to Cloudflare Pages

This project is a frontend UX foundation. Deploy it first as the public XAWD site.
Do not add real provider secrets or customer funds to this project.

## 1. Local validation

```bash
npm install
npm run build
npm run dev
```

Production build output: `dist/`.

## 2. Put the code in GitHub

Create a repository, for example `xawd-v2`.

```bash
git init
git branch -M main
git add .
git commit -m "chore: xawd v2 ux foundation"
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/xawd-v2.git
git push -u origin main
```

## 3. Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
Choose the GitHub repository.

Build configuration:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

After deployment, Cloudflare provides a `*.pages.dev` URL.

## 4. Custom domain

In the Pages project:

Workers & Pages → your project → Custom domains → Set up a domain.

Primary public site:

- `xawd.my.id`

Optional future app/API subdomains:

- `app.xawd.my.id`
- `api.xawd.my.id`

For a custom subdomain, Cloudflare can use a CNAME to the Pages deployment. Add the domain through the Pages Custom domains flow first; do not rely on a manually-created CNAME alone.

## 5. Environment variables

Only browser-safe public configuration belongs in `VITE_*` variables.

Never put these in frontend variables:

- OpenAI/Anthropic/Google/etc. secret keys
- database credentials
- Cloudflare API tokens
- wallet private keys / seed phrases
- CEX withdrawal keys
- OAuth client secrets
- signing or mint authorities

Those belong in server-side secrets on the API/Workers side.

## 6. Next build phase

After the public site is online:

1. Authentication + session security
2. Passkey/WebAuthn
3. Real workspace/project persistence
4. Server-side AI Gateway
5. BYOK secret vaulting
6. usage metering and rate limits
7. billing
8. Trust Center / observability
9. referral and anti-abuse
10. wallet/financial capabilities behind feature flags and separate security boundaries
