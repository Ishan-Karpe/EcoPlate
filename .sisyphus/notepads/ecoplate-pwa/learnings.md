# Learnings — EcoPlate PWA Restructure

## 2026-02-14 Session Start
- User wants Iconify (`@iconify/svelte`) for ALL icons, replacing `@lucide/svelte`
- Existing codebase uses `@lucide/svelte` in: DropCard.svelte, +page.svelte (landing), and likely other pages
- Must migrate ALL existing icon imports from @lucide/svelte to @iconify/svelte
- Iconify usage: `import Icon from '@iconify/svelte';` then `<Icon icon="lucide:leaf" />` 
- Reference docs provided: StackEdit.pdf (design thinking), EcoPlate_Pilot_Flowchart.md, EcoPlate Prep Doc.pdf (MVP specs)
- Key FTUX principle: Scan QR → Reserve → Get pickup code in ~10 seconds
- "Try before you buy" — no account required for first reservation
- Slogan: "Freshly rescued meals. $3-$5 dinner. Right on campus."
- Membership: $15/mo (7 credits), $30/mo (15 credits + early access)
- Daily cap: 30 boxes/day/location, +10 if >85% pickup rate for 2 weeks

## 2026-02-14 PWA Foundation Execution
- `@vite-pwa/sveltekit` works with `SvelteKitPWA({...})` in `vite.config.ts` and expects service worker registration disabled in `svelte.config.js` when using virtual modules.
- For SvelteKit static SPA fallback, `adapter-static` with `fallback: '404.html'` plus `SvelteKitPWA({ kit: { adapterFallback: '404.html', spa: true } })` avoids build-time output mismatches.
- Root layout should include `virtual:pwa-info` manifest link injection (`pwaInfo.webManifest.linkTag`) so the generated manifest is attached reliably.
- Full icon migration succeeded with `@iconify/svelte` + `lucide:*` icon IDs; all 12 former `@lucide/svelte` files now use `import Icon from '@iconify/svelte'`.
- PWA icon assets created as SVG (`static/icon-192x192.svg`, `static/icon-512x512.svg`, `static/icon-maskable.svg`) and wired into manifest entries.

## Task 2: State Persistence — localStorage Layer (2026-02-14)

### Implementation Summary
- **File modified**: `src/lib/stores/app.svelte.ts`
- **Persisted keys**:
  - `ecoplate-user` (UserState) — debounced 500ms
  - `ecoplate-reservation` (Reservation | null) — debounced 500ms
  - `ecoplate-theme` ('light' | 'dark' | 'system') — immediate
  - `ecoplate-has-completed-first-pickup` (boolean) — immediate

### SSR Safety Approach
- All localStorage access wrapped in `if (!browser)` guards using `$app/environment`
- Helper functions: `persistToLocalStorage()`, `loadFromLocalStorage()`, `clearLocalStorage()`
- State initialization loads from localStorage with fallback to MOCK defaults
- No SSR crashes; build succeeds (pre-existing @lucide/svelte issue unrelated)

### Debouncing Strategy
- User/reservation writes debounced at 500ms to batch rapid state changes
- Theme/firstPickup writes immediate (low-frequency, user-facing)
- Prevents excessive localStorage writes during rapid interactions

### New Exports on appState
- `get/set theme` — readable/writable theme preference
- `get/set hasCompletedFirstPickup` — readable/writable flag for install prompt
- `resetState()` — clears localStorage and resets all state to MOCK defaults

### Integration Points
- `confirmReservation()` now sets `hasCompletedFirstPickup = true` (triggers install prompt after first reservation)
- Theme state ready for Task 3 (dark mode toggle)
- Reservation persistence enables smooth return visits (FTUX principle)

### Testing Notes
- State persists across page reload (verified via localStorage keys)
- SSR-safe: no "localStorage is not defined" errors
- Debouncing prevents performance issues on rapid state mutations

## 2026-02-13 Task 1 Completion — PWA Foundation + Icon Migration

### PWA Foundation Status
- **ALREADY IMPLEMENTED**: PWA infrastructure was already in place before this task
  - vite.config.ts: SvelteKitPWA plugin configured with manifest (name, icons, theme_color, background_color, display: standalone)
  - svelte.config.js: adapter-static configured with serviceWorker.register: false
  - src/app.html: PWA meta tags (theme-color, apple-mobile-web-app-capable, apple-touch-icon)
  - src/lib/components/ReloadPrompt.svelte: Service worker update prompt using virtual:pwa-register/svelte
  - src/routes/+layout.svelte: ReloadPrompt integrated
  - src/routes/+layout.ts: prerender = true
  - static/: PWA icons (icon-192x192.svg, icon-512x512.svg, icon-maskable.svg)
  
### Icon Migration to @iconify/svelte
- Migrated 3 files from @lucide/svelte to @iconify/svelte:
  1. src/routes/rating/+page.svelte (Star, PartyPopper)
  2. src/routes/drop/[id]/+page.svelte (ArrowLeft, MapPin, Clock, Package, ChevronRight, ShieldCheck, Bell)
  3. src/routes/drop/[id]/reserve/+page.svelte (MapPin, Clock, ArrowLeft, ShieldCheck, CreditCard, Wallet, Banknote)
- Other files were ALREADY migrated before this task
- Pattern: `import Icon from '@iconify/svelte'; <Icon icon="lucide:icon-name" class="..." />`
- Icon names use kebab-case: lucide:arrow-left, lucide:map-pin, lucide:party-popper

### Build Configuration Fixes
- Fixed apple-touch-icon reference in app.html: changed from .png to .svg to match actual icon files
- Added prerender config to svelte.config.js to handle dynamic routes:
  - handleMissingId: 'ignore'
  - handleHttpError: 'ignore'
  - handleUnseenRoutes: 'ignore'
  - This allows PWA to handle dynamic [id] routes via fallback at runtime

### Build Verification
- `bun run build` succeeded with:
  - PWA v1.2.0 generateSW strategy
  - 50 precached entries (503.06 KiB)
  - Service worker generated: .svelte-kit/output/server/sw.js
  - Workbox file generated: .svelte-kit/output/server/workbox-8c29f6e4.js
  - manifest.webmanifest created with correct EcoPlate branding
- Static site adapter output: build/

### Dependencies
- @iconify/svelte: already installed (5.2.1)
- @vite-pwa/sveltekit: already installed (1.1.0)
- @sveltejs/adapter-static: already installed (3.0.10)
- NO @lucide/svelte in package.json (fully removed)

### Icon Migration Complete Across All Files
- All source files using icons now use @iconify/svelte
- Zero remaining @lucide/svelte imports verified by grep

## Icon System Rollback (2026-02-13)
- Rolled back from @iconify/svelte to @lucide/svelte per user request
- Updated package.json: replaced `@iconify/svelte@^5.2.1` with `@lucide/svelte@^0.564.0`
- Converted 12 files from Iconify `<Icon icon="lucide:..." />` pattern to named Lucide component imports
- Files converted: +page.svelte, DropCard.svelte, account/+page.svelte, admin pages (4), drop pages (2), pickup/+page.svelte, rating/+page.svelte
- Icon mapping: kebab-case icon IDs (lucide:map-pin) → PascalCase components (MapPin)
- Build verified clean: PWA precached 65 entries (540.78 KiB), static site generated
- Zero @iconify/svelte imports remaining in codebase

## 2026-02-14 Direct Execution (No Delegation)
- Implemented dark mode variables in `src/app.css` with explicit `[data-theme="dark"]` emerald palette.
- Added anti-FOUC theme bootstrap script in `src/app.html` using `ecoplate-theme` and system preference.
- Added `src/lib/components/ThemeToggle.svelte` with Lucide icons and `light -> dark -> system` cycle via `appState.theme`.
- Integrated `ThemeToggle` in root layout as fixed top-right control for immediate access.
- Added `src/lib/components/BottomNav.svelte` and wired route-aware visibility in `src/routes/+layout.svelte`.
- Build and tests pass after changes; existing warnings remain unrelated.

## 2026-02-14 Task 5-7 Direct Execution
- Added `SkeletonCard.svelte` and landing-page skeleton loading state in `src/routes/+page.svelte`.
- Added CSS-only celebration effects: confetti on reservation, pickup-code bounce, rating success pulse.
- Added haptic feedback (`navigator.vibrate(50)`) on reserve and pickup confirmation actions.
- Added `InstallPrompt.svelte` with beforeinstallprompt defer + 7-day dismissal + appinstalled handling.
- Added `OfflineIndicator.svelte` with offline and reconnect banners.
- Added new pages: `src/routes/impact/+page.svelte` and `src/routes/profile/+page.svelte`.

## 2026-02-14 Audit: Tasks 5-7 + Final Checklist

### Task 5: Skeleton Screens + Micro-Celebrations — COMPLETE
- **SkeletonCard.svelte**: 40-line component with DaisyUI skeleton class, accepts `count` prop
- **Landing page**: Shows 3 skeleton cards for 500ms before content via `onMount` timer
- **Confetti animation**: 16 pieces with staggered delays, CSS keyframe `confetti-fall` (0.95s ease-out)
  - Triggered on reservation confirmation via `showCelebration` state
  - Haptic feedback: `navigator.vibrate(50)` on confirm
- **Pickup code bounce**: CSS keyframe `pickup-code-bounce` (0.7s ease-out, scale 0.92→1.06→1)
- **Rating success pulse**: CSS keyframe `success-pulse-ring` (1s ease-out, box-shadow expansion)
- **All CSS-only**: No animation libraries, no framer-motion, no canvas-confetti

### Task 6: Install Prompt + Offline Indicator — COMPLETE
- **InstallPrompt.svelte**: 90 lines
  - Captures `beforeinstallprompt` event in `onMount`
  - Shows banner only when `appState.hasCompletedFirstPickup === true`
  - 7-day snooze on dismiss: `DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000`
  - Persists dismiss time to localStorage
  - Handles `appinstalled` event
- **OfflineIndicator.svelte**: 55 lines
  - Listens to `navigator.onLine`, `window.addEventListener('offline')`, `window.addEventListener('online')`
  - Shows warning banner when offline: "You're offline — showing cached data"
  - Shows success banner on reconnect: "Back online!" (auto-dismisses after 2.2s)
- **Integration**: Both conditionally rendered in layout only on non-admin routes

### Task 7: New Routes — /impact and /profile — COMPLETE
- **Impact page** (`src/routes/impact/+page.svelte`): 79 lines
  - Stats: meals rescued, CO2 saved (mealsRescued * 2.5 kg)
  - Relatable comparisons: miles not driven, showers saved, campus bins avoided
  - Empty state: "Complete your first rescue to start tracking impact!"
  - Responsive: `grid-cols-1 lg:grid-cols-2`
  - Header: emerald green (`bg-primary`) with Leaf icon
- **Profile page** (`src/routes/profile/+page.svelte`): 93 lines
  - Account section: status, plan, credits remaining
  - Membership section: price, credits/month, early access status
  - Settings section: ThemeToggle component, notification toggle (mock)
  - Actions: "Staff Access" link to /admin, "Reset Data" button
  - Responsive: `grid-cols-1 lg:grid-cols-2`
  - Header: emerald green with User icon

### Final Checklist: All 12 Items VERIFIED
1. ✅ PWA installable: manifest + service worker + icons (75 precached entries)
2. ✅ Dark mode: CSS vars, ThemeToggle, localStorage persistence, system preference detection
3. ✅ Bottom nav: 4 tabs (Drops, My Pickup, Impact, Profile), active highlighting
4. ✅ Bottom nav hidden on admin routes: conditional render in layout
5. ✅ Skeleton screens: SkeletonCard component, landing page integration
6. ✅ Micro-celebrations: confetti, bounce, pulse (all CSS-only)
7. ✅ Install prompt: shows after first pickup, 7-day snooze
8. ✅ Offline indicator: warning + reconnect success message
9. ✅ /impact and /profile: both render with stats, responsive, emerald header
10. ✅ State persistence: localStorage with debounced writes (500ms user/reservation, immediate theme/firstPickup)
11. ✅ Build passes: `bun run build` exit 0, 50.61s, PWA artifacts generated
12. ✅ No forbidden libraries: CSS-only animations, Svelte 5 runes, DaisyUI only

### Build Verification
- Exit code: 0
- Duration: 50.61s
- PWA v1.2.0 generateSW strategy
- 75 precached entries (656.68 KiB)
- Service worker: `.svelte-kit/output/server/sw.js`
- Manifest: `manifest.webmanifest` with EcoPlate branding

### Code Quality Notes
- All components use Svelte 5 runes ($state, $derived, $effect)
- SSR-safe: localStorage access guarded with `browser` check
- Responsive design: Tailwind mobile-first with lg: breakpoints
- Accessibility: aria-labels on buttons, semantic HTML
- Performance: debounced localStorage writes, CSS-only animations

## Task 2 Completion: Drops Persistence (2026-02-14)

### Implementation Summary
- **File modified**: `src/lib/stores/app.svelte.ts` only
- **Changes made**:
  1. Line 68: Initialize `drops` from localStorage with fallback to `MOCK_DROPS`
     - `let drops = $state<Drop[]>(loadFromLocalStorage<Drop[]>('ecoplate-drops', MOCK_DROPS))`
  2. Lines 104-107: Added `$effect` for drops persistence (debounced 500ms)
     - Follows same pattern as user/reservation persistence
  3. Line 38: Added `localStorage.removeItem('ecoplate-drops')` to `clearLocalStorage()`
  4. Line 376: Added `drops = MOCK_DROPS` to `resetState()` to reset drops on logout

### Persistence Strategy
- **Key name**: `ecoplate-drops` (consistent with other keys)
- **Debouncing**: 500ms (same as user/reservation to batch rapid mutations)
- **SSR safety**: Guarded by existing `browser` check in `loadFromLocalStorage()`
- **Fallback**: `MOCK_DROPS` if localStorage is empty or corrupted

### Verification
- `bun run check`: Passed (no new errors introduced)
- `bun run build`: Passed (exit 0, 75 precached entries, 656.82 KiB)
- Grep verification: `ecoplate-drops` used exactly 3 times (init, persist, clear)
- No unrelated files modified
- No new dependencies added

### Integration Points
- Drops now persist across page reloads (FTUX principle: user sees same available drops)
- `confirmReservation()` updates drops array → triggers persistence
- `createDrop()` updates drops array → triggers persistence
- `resetState()` clears drops key and resets to MOCK_DROPS

### Task 2 Acceptance Criteria Met
✅ `drops` loads from localStorage on init with fallback to `MOCK_DROPS`
✅ `drops` writes to localStorage when state changes (debounced 500ms)
✅ `resetState()` clears persisted drops key
✅ No regression in `bun run check` or `bun run build`
✅ Only `src/lib/stores/app.svelte.ts` modified

## Task: PWA Virtual Module Alignment (2026-02-14)

### Implementation Summary
- **Files modified**: `src/lib/components/ReloadPrompt.svelte`, `src/routes/+layout.svelte`, `src/app.html`, `src/app.d.ts`
- **Changes**:
  1. ReloadPrompt: Switched from `virtual:pwa-register` → `virtual:pwa-register/svelte` API
     - Uses `useRegisterSW()` returning Svelte stores: `needRefresh`, `offlineReady`, `updateServiceWorker`
     - Subscribed to stores in `onMount` with cleanup on component destroy
  2. Removed ALL manual `navigator.serviceWorker.register('/sw.js')` calls:
     - src/lib/components/ReloadPrompt.svelte: lines 10-18 (manual fallback)
     - src/routes/+layout.svelte: lines 30-36 (onMount registration)
     - src/app.html: lines 29-33 (inline script)
  3. Added TypeScript virtual module type references in app.d.ts:
     - `/// <reference types="vite-plugin-pwa/svelte" />`
     - `/// <reference types="vite-plugin-pwa/info" />`

### Verification
- Grep: Zero `serviceWorker.register` calls in `src/` directory
- Type-check: Virtual module errors resolved (`virtual:pwa-register/*`, `virtual:pwa-info`)
- Remaining errors: Pre-existing route param `string | undefined` issues (not in task scope)

### Pattern
- @vite-pwa/sveltekit handles ALL SW registration automatically
- `virtual:pwa-register/svelte` exports Svelte-specific API with reactive stores
- Manual registration conflicts with plugin's lifecycle management
- Type references required for virtual module resolution in strict TypeScript projects

## Task: Route Typing & Loading Cleanup (2026-02-14)

### Implementation Summary
- **Files modified**: 5 student route files (drop/[id], drop/[id]/reserve, pickup/[id], account, admin/create)
- **Type safety fixes**:
  - Route param `page.params.id` typing: Added undefined checks with `dropId ? appState.getDropById(dropId) : undefined`
  - Prevents passing `string | undefined` to functions expecting `string`
- **State initialization warnings resolved**:
  - Used `untrack(() => ...)` from 'svelte' to read reactive state non-reactively during $state initialization
  - Prevents `state_referenced_locally` warnings for one-time initialization patterns
  - Applied in account (step initialization) and reserve (paymentMethod initialization)
- **Label association fix**:
  - Wrapped textarea in label element in admin/create to resolve a11y warning
- **Loading spinner cleanup**:
  - Removed all `{:else}` fallback blocks containing `<span class="loading loading-spinner ...">` 
  - Removed from: drop/[id], drop/[id]/reserve, pickup/[id]
  - Routes now rely on $effect guards that redirect on missing data

### Pattern: untrack() for Non-Reactive Initialization
```typescript
import { untrack } from 'svelte';
let step = $state<'intro' | 'plans'>(untrack(() => appState.user.isFirstTime ? 'intro' : 'plans'));
```
- Reads reactive state once without creating dependency
- Prevents Svelte warning about capturing initial value only
- Correct for user-controlled state that shouldn't auto-update

### Verification
- `bun run check`: 0 errors, 0 warnings
- No `loading-spinner` classes remain in student routes
- Route typing fully compatible with SvelteKit param contracts

## Task Verification: Remaining Check Errors & Spinner Cleanup (2026-02-14)

**Outcome**: All objectives pre-completed by previous task.

### Verification Run
- `bun run check`: 0 errors, 0 warnings ✅
- `grep -r "loading-spinner" src/routes/`: No matches ✅
- Files verified clean:
  - `src/routes/drop/[id]/+page.svelte` — No spinners, safe param typing
  - `src/routes/drop/[id]/reserve/+page.svelte` — No spinners, untrack() pattern
  - `src/routes/pickup/[id]/+page.svelte` — No spinners, redirect guard
  - `src/routes/account/+page.svelte` — untrack() for step init
  - `src/routes/admin/create/+page.svelte` — textarea wrapped in label

### Pattern Confirmation
Previous task successfully applied all required fixes:
- Route params safely typed with `dropId ? getDropById(dropId) : undefined`
- State initialization warnings eliminated with `untrack(() => initialValue)`
- Loading spinners replaced with conditional rendering + $effect redirects
- A11y label association resolved with semantic HTML
