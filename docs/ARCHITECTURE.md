# OneTime: ChangeOps Architecture

## Product identity

- Name: OneTime: ChangeOps
- Short name: CHOPS
- Product slug: CHOPS
- License prefix: OTL-CHOPS

## Two-Supabase model

ChangeOps deliberately uses two separate Supabase projects.

### ChangeOps application project

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Responsibilities:

- ChangeOps authentication when enabled
- ChangeOps organization/workspace data
- Change requests
- Approvals
- Change calendar
- ChangeOps audit records

The initial prototype persists operational ChangeOps records locally until the
production database schema is finalized.

### Central OneTime Labs Licensing / OTLES project

Environment variables:

- `VITE_LICENSING_SUPABASE_URL`
- `VITE_LICENSING_SUPABASE_PUBLISHABLE_KEY`

Responsibilities:

- Product registration
- License records
- Activation records
- Entitlement validation
- Activation/seat limits
- License status enforcement
- Shared `activate-license` Edge Function

ChangeOps does not directly query or mutate licensing tables. The application
calls the central `activate-license` Edge Function using the CHOPS product
identity and lets the licensing service remain authoritative.

## Licensing flow

1. User enters an `OTL-CHOPS-*` license key.
2. ChangeOps creates or retrieves a stable local installation identifier.
3. The dedicated licensing Supabase client invokes `activate-license` on the
   central OneTime Labs licensing project.
4. The request contains:
   - `product: "CHOPS"`
   - the normalized license key
   - the installation identifier as `machineHash`
   - the current ChangeOps version
5. The central licensing service validates the entitlement and activation.
6. ChangeOps caches the successful license state locally and revalidates the
   stored key on future launches.

## Security boundary

The frontend only contains Supabase publishable keys. Server/admin secrets are
never embedded in the ChangeOps client. Licensing authority remains in the
central licensing Edge Function and database.
