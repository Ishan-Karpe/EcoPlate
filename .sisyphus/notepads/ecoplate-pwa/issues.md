# Issues — EcoPlate PWA Restructure

(none yet)

## 2026-02-13 Task 1 Issues

### Build Warnings (Non-Blocking)
- Svelte 5 state_referenced_locally warnings in:
  - src/routes/account/+page.svelte:12 (isFirstPickup reference)
  - src/routes/drop/[id]/reserve/+page.svelte:20 (user.membership and user.creditsRemaining references)
  - These are code quality suggestions, not errors. App builds and runs correctly.
- Accessibility warning in src/routes/admin/create/+page.svelte:198 (label without associated control)
  - a11y suggestion, not blocking PWA functionality

### Initial Build Failures (Resolved)
1. ❌ /icon-192x192.png not found (linked from app.html)
   - ✅ Fixed: Changed apple-touch-icon href to /icon-192x192.svg
2. ❌ Prerender error: route /drop/[id]/reserve marked as prerenderable but not found during crawl
   - ✅ Fixed: Added handleUnseenRoutes: 'ignore' to svelte.config.js prerender config
   - Dynamic routes will be handled via fallback.html at runtime (correct for PWA)

### No Critical Issues
- All PWA foundation infrastructure working as expected
- All icon migrations successful
- Build passes with full PWA artifacts generated


## Icon Rollback Incomplete (2026-02-13)

**Root Cause:**
Previous Iconify→Lucide rollback used sed batch replacements that missed 3 `<Icon>` component usages due to insufficient pattern matching in complex conditional expressions.

**Affected Files:**
- `src/routes/rating/+page.svelte`: 2 instances of `<Icon icon="lucide:star" .../>` in star rating loops
- `src/routes/pickup/[id]/+page.svelte`: 1 instance of `<Icon icon="lucide:timer" .../>` with nested ternary conditional classes

**Build Error:**
```
ReferenceError: Icon is not defined
```
During prerender of `/rating` route—Svelte compiled references to `Icon` component that was no longer imported.

**Fix Applied:**
Manually replaced all 3 `<Icon icon="lucide:..." />` usages with corresponding Lucide component tags:
- `<Icon icon="lucide:star" .../> → <Star .../>`
- `<Icon icon="lucide:timer" .../> → <Timer .../>`

Preserved all existing class expressions and conditional logic intact.

**Verification:**
- Zero `<Icon` tags remain: `grep -r '<Icon' src/routes/rating src/routes/pickup` → no matches
- Zero `icon="lucide:` attributes remain
- Build succeeded: PWA precached 67 entries (550.28 KiB)

**Lesson:**
Batch sed replacements with multiline patterns require explicit handling of line breaks and nested expressions. For complex component structures with conditionals, prefer AST-aware tools (ast-grep) or manual verification step after automated replacements.

## 2026-02-14 Tooling Issue

- `lsp_diagnostics` on `.svelte` files is currently blocked because configured server `oxlint` is not installed in the environment.
- Verification relied on `bun run build` and `bun run test` plus manual file review.
