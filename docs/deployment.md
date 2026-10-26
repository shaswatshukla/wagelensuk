# Deployment and maintenance

## Primary: Cloudflare Pages

The project is a static Vite build. Connect the private `shaswatshukla/wagelens` repository to Pages and use:

- Production branch: `main`.
- Framework: Vite, or None with the explicit command below.
- Build command: `pnpm run ci:build`.
- Output: `dist`.
- Environment: `NODE_VERSION=24.22.1`, `PNPM_VERSION=11.25.0`.

The build runs tests and engine coverage before producing static files. Failed tests prevent the build from deploying. GitHub Actions additionally verifies real browser workflows, accessibility and privacy. These are separate checks; Cloudflare's native Git integration does not wait for the GitHub browser job. Dependabot proposes monthly dependency updates; updates and rule changes are not automatically merged.

Cloudflare serves the compiled app, headers and local parsers. No payroll is sent to the host. Keep the research-preview label and conservative REVIEW results until the outstanding legal and engine work is complete. A hosted demonstration is not a production compliance service.

### Automatic health check

Set the GitHub repository variable `SITE_URL` to the deployed HTTPS URL. `Hosted preview health` checks it daily and can also be run manually. It verifies a successful response, the app title and security headers. GitHub Actions notifications follow the owner's GitHub notification settings. This is a daily smoke check, not continuous uptime monitoring or a guarantee of email delivery.

### Recovery and rollback

Pushes to `main` trigger Cloudflare's native build. Review the deployment's commit SHA and logs in Workers & Pages. To recover a bad release, use Pages' rollback to a known successful deployment, then revert the faulty change in GitHub. Rebuild from the lockfile rather than committing node_modules. The private repository contains source, tests, configuration, documentation and a synthetic-data screenshot; generated output and dependencies are recreated.

## Oracle is optional standby

No Oracle resources are required by this app. Current Oracle documentation states an Always Free A1 allowance equivalent to 2 OCPUs and 12 GB RAM and allows idle compute reclamation. A static showcase is idle most of the time. Cloudflare Pages is therefore the simpler primary choice. An Oracle server can be added only after inspecting existing account resources, home-region capacity, resource quotas and the security configuration. Do not upgrade to paid billing or create paid resources automatically.

Primary sources checked 26 October 2026:

- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/platform/limits/
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm

Cloudflare's Free plan currently lists 500 builds/month and one concurrent build. A1 idle reclamation uses CPU, network and (for A1) memory conditions over a seven-day period. No claim is made that upgrading to paid billing eliminates reclamation; that was not verified. No domain purchase, paid service or Oracle upgrade is part of this setup.
