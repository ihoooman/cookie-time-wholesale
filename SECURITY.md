# Security policy

Cookie Time Wholesale processes business contact details and protects an
administrative catalog. Please report security issues privately and responsibly.

## Supported version

The production deployment and the latest commit on `main` are supported. Older
commits, forks, and local modifications are not maintained as security releases.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use
[GitHub private vulnerability reporting](https://github.com/ihoooman/cookie-time-wholesale/security/advisories/new)
and include:

- the affected route or component;
- reproduction steps or a minimal proof of concept;
- the likely impact;
- any suggested mitigation;
- whether the issue is already public.

Please avoid accessing, changing, or retaining real customer data. Allow a
reasonable remediation window before disclosure.

## Security model

- Admin sessions are signed, HttpOnly, Secure, and SameSite Strict.
- Google credentials are verified server-side against Google's JWKS and audience.
- Admin access is restricted to an explicit normalized email allowlist.
- Password sign-in is rate-limited with expiring Workers KV records.
- Secrets are supplied through Cloudflare and are never committed.
- Product prices, inventory, discounts, and totals are reloaded and calculated server-side.
- Admin and API surfaces are excluded from indexing at both app and edge layers.

Security reports about third-party services should also follow the responsible
disclosure policy of the affected provider.
