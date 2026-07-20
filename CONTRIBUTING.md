# Contributing

Thanks for helping improve Cookie Time Wholesale. This repository backs a live
business application, so changes should be small, reviewable, and safe to
deploy.

## Before you start

- Use an issue for bugs or feature proposals that need product discussion.
- Never include real customer records, credentials, tokens, or `.dev.vars` in a commit.
- Keep the Persian RTL experience and mobile viewport as first-class requirements.
- Coordinate schema and deployment changes before editing a production binding.

## Development workflow

1. Create a focused branch from the latest `main`.
2. Install the locked dependencies with `npm ci`.
3. Copy `.dev.vars.example` to `.dev.vars` and use development-only values.
4. Make the smallest complete change.
5. Run the full quality gate:

   ```bash
   npm run check
   ```

6. If the D1 schema changed, run `npm run db:generate` and commit the resulting migration.
7. Open a pull request using the repository template.

## Code expectations

- Keep TypeScript strict; avoid weakening types or adding unexplained casts.
- Validate untrusted input at the API boundary.
- Recalculate business-sensitive values such as totals and discounts on the server.
- Use semantic HTML, visible focus states, and useful labels for interactive controls.
- Check both a mobile and desktop viewport for UI changes.
- Keep browser-specific glass behavior working in Safari/WebKit and Chromium.
- Add or update a test when changing product, auth, SEO, or deployment contracts.

## Commit and pull request style

Use short, imperative commit subjects, for example:

```text
Improve wholesale cart validation
Document D1 migration workflow
Fix Safari glass contrast
```

A pull request should explain the problem, the solution, customer or developer
impact, screenshots for visual changes, and the commands used for validation.

## Cloudflare changes

Do not commit secrets. D1 and KV resource IDs in `wrangler.jsonc` are resource
identifiers, while `GOOGLE_CLIENT_ID`, `AUTH_SECRET`, and `ADMIN_PASSWORD` belong
in Cloudflare Variables and Secrets.

Read [CLOUDFLARE.md](CLOUDFLARE.md) before changing bindings, migration commands,
the custom domain, or the Git-connected deployment.
