# Local build and recovery

The current app is static. Clone the repository, install dependencies with pnpm, run tests and build. Copy only `dist/` to the selected static host. No user-data backup or database recovery is needed because this application does not keep payroll on the server.

```sh
pnpm install --frozen-lockfile
pnpm coverage
pnpm build
```

On a restricted Windows installation where pnpm's automatic environment checks fail, invoke installed scripts directly:

```sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --coverage
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173
```

`public/_headers` is a Cloudflare Pages-style header file. Other hosts must configure equivalent HTTP headers themselves; this file alone does not secure an arbitrary server. Production CSP should forbid network connections. Preview/dev builds need different connection settings for development tools.

Public deployment is pending owner approval, solicitor review, business identity, domain and host decisions. Oracle/Cloudflare infrastructure has not been provisioned or tested. Do not treat this document as a verified production recovery procedure. A production runbook must include chosen-host credentials handling, exact deployment, DNS failover, rollback and a timed recovery exercise.
