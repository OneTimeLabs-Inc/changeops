# OneTime: ChangeOps (CHOPS)

ChangeOps is OneTime Labs' focused operational change-management product.

This repository is a React + TypeScript + Vite prototype with a real integration to the existing OneTime Labs Licensing Platform.

## Product identity

- Name: `OneTime: ChangeOps`
- Short name: `CHOPS`
- Product slug: `CHOPS`
- License prefix: `OTL-CHOPS`
- Version: `VITE_APP_VERSION` with fallback `1.0.0`

The product identity is centralized in `src/config/productConfig.ts`.

## What works in this build

- OneTime Labs license activation gate
- Calls the existing Supabase `activate-license` Edge Function
- Persistent per-browser installation identifier
- Existing license revalidation at startup
- Optional Supabase authentication gate
- Google OAuth integration prepared
- Email/password sign-in prepared
- Change dashboard
- Change register and filtering
- Create-change workflow
- Risk and change type classification
- Approval / rejection workflow
- Change calendar
- Change detail panel
- Completion workflow
- Audit history
- Product/licensing settings panel
- Browser persistence for prototype operational records
- Responsive desktop/mobile layout

## Important prototype boundary

**Licensing is live. Change-management data is prototype-local.**

The first build stores ChangeOps operational records in browser LocalStorage. This was intentional: the shared OneTime Labs database already contains licensing architecture, but no final ChangeOps organization/workspace schema was supplied with this build. The storage layer is isolated in `src/services/storage.ts` so it can be replaced with Supabase persistence without rebuilding the UI.

Do not treat LocalStorage as the production data layer.

## Run locally

```powershell
npm install
npm run dev
```

The included `.env.local` enables the local prototype bypass button so the UI can be reviewed without consuming an activation.

## Production / Vercel

Set these Vercel environment variables:

```text
VITE_APP_VERSION=1.0.0
VITE_SUPABASE_URL=https://wfirtmaevqdykagfidqg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
VITE_DEMO_MODE=false
VITE_AUTH_REQUIRED=false
```

`VITE_DEMO_MODE` must remain `false` in production. When it is false, the application cannot open without a valid ChangeOps license.

The current Supabase URL and publishable key are also present as client-side fallback values in `src/config/env.ts`. Supabase publishable keys are intended for client applications; the service-role key is never used or included.

## Licensing flow

ChangeOps sends this contract to the existing Edge Function:

```ts
{
  product: "CHOPS",
  license: "OTL-CHOPS-...",
  machineHash: "chops-install-...",
  version: "1.0.0"
}
```

The backend remains responsible for:

- product validation
- license validation
- active / suspended / revoked / expired state
- activation limits
- activation creation
- existing activation refresh

The browser never queries the licensing tables directly.

## Authentication

Authentication is prepared but disabled by default for the initial prototype.

Set:

```text
VITE_AUTH_REQUIRED=true
```

to require Supabase authentication after license validation.

For Google OAuth, add the final ChangeOps production URL to the Supabase allowed redirect URLs after the subdomain is connected.

## Recommended next implementation phase

1. Finalize the OneTime Labs organization/workspace model for ChangeOps.
2. Add ChangeOps-specific Supabase tables and RLS.
3. Replace `src/services/storage.ts` with Supabase repositories.
4. Add role-based permissions: requester, implementer, approver/CAB, administrator.
5. Add attachments and evidence.
6. Add reusable change templates.
7. Add PDF change-record export.
8. Add notifications and approval routing.
9. Add OTLES references to change records.

## GitHub remote

Target repository:

```text
https://github.com/OneTimeLabs-Inc/changeops.git
```

If this source is copied into an already initialized local repository, keep the existing `.git` directory and replace the working files only.

## Supabase architecture

ChangeOps uses **two Supabase projects**:

- `VITE_SUPABASE_*` points to the ChangeOps application project.
- `VITE_LICENSING_SUPABASE_*` points to the central OneTime Labs OTLES/Licensing project containing `activate-license`.

Do not deploy or duplicate the licensing tables/functions into the ChangeOps Supabase project. Licensing remains centralized and ChangeOps validates `CHOPS` entitlements through the shared licensing Edge Function.
