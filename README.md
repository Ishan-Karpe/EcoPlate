# EcoPlate MVP

This is a code bundle for EcoPlate MVP. The original project is available at https://www.figma.com/design/B9PXCRk1CdYNgKrKN3uSDW/EcoPlate-MVP.

## Running the code

Run `npm i` to install the dependencies.

Create a `.env.local` (or `.env`) file in the project root with:

```env
PUBLIC_SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
OPENROUTER_API_KEY=... # optional unless using AI photo analysis

# Optional for Playwright admin e2e flow
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

Apply Supabase SQL migrations (in order):

- `supabase/migrations/202603020001_create_kv_store_b2407c0b.sql`
- `supabase/migrations/202603020002_harden_kv_store_access.sql`

Run `npm run dev` to start the development server.
