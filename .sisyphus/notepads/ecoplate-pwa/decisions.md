# Decisions — EcoPlate PWA Restructure

## 2026-02-14 Session Start
- Icons: Use `@iconify/svelte` (Iconify) — NOT `@lucide/svelte` (user explicit request)
- PWA: @vite-pwa/sveltekit with generateSW strategy
- Adapter: Switch to adapter-static
- Dark mode: DaisyUI data-theme with system preference detection
- Bottom nav: 4 tabs (Drops, My Pickup, Impact, Profile) — student routes only
- State: localStorage persistence via $effect in Svelte 5 runes store
- Animations: CSS-only (no motion libraries)
- Components: DaisyUI only (no shadcn, no Radix)
- Svelte patterns: Svelte 5 runes only (no Svelte 4 legacy)

## 2026-02-14 Decision Update
- Icons: Reverted to `@lucide/svelte` per latest user directive (do NOT use Iconify)

## 2026-02-14 Execution Decision
- When delegation startup repeatedly times out, proceed with direct in-session implementation to maintain momentum.
- Keep theme system anchored to `appState.theme` for consistency across `/profile` integration later.

## 2026-02-14 UI/Flow Decisions
- Global `ThemeToggle` remains in root layout for quick access; `/profile` also includes a settings-level toggle.
- Bottom navigation "My Pickup" routes to current reservation when available, otherwise `/` fallback.
- Install prompt appears only after first completed reservation flag and remains snoozed for 7 days after dismissal.
