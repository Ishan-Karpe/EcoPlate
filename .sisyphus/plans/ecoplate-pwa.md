# EcoPlate PWA Restructure for Gen Z College Students

## TL;DR

> **Quick Summary**: Convert the existing SvelteKit campus food rescue app into a fully installable Progressive Web App with Gen Z-optimized UX — bottom navigation, dark mode, skeleton loading, micro-celebrations, smart install prompt, offline support, and two new routes (/impact, /profile).
> 
> **Deliverables**:
> - PWA infrastructure (manifest, service worker via @vite-pwa/sveltekit, icons, meta tags)
> - Dark mode with system-preference detection + manual toggle
> - Bottom navigation bar (4 tabs: Drops, My Pickup, Impact, Profile)
> - Gen Z UX enhancements (skeleton screens, micro-celebrations, install prompt, haptic feedback)
> - State persistence via localStorage
> - Offline indicator
> - Two new routes: `/impact` and `/profile`
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (PWA Foundation) → Task 3 (Dark Mode) → Task 4 (Bottom Nav) → Task 7 (New Routes)

---

## Context

### Original Request
Convert EcoPlate into a PWA tailored for Gen Z college students in 2026, incorporating design thinking principles from StackEdit.pdf and the full pilot flowchart from EcoPlate_Pilot_Flowchart.md.

### Interview Summary
**Key Discussions**:
- Bottom nav: YES — 4 tabs (Drops, My Pickup, Impact, Profile) for student routes only, hidden on admin routes
- Dark mode: YES — system-preference-aware with manual toggle, DaisyUI theme switching
- Install prompt: Smart banner shown after first successful reservation, non-intrusive
- PWA approach: @vite-pwa/sveltekit with generateSW strategy (not native SvelteKit SW)
- Adapter: Switch from adapter-auto to adapter-static for full offline precaching

### Research Findings
- @vite-pwa/sveltekit is actively maintained, SvelteKit 2 + Svelte 5 compatible
- DaisyUI supports themes via `data-theme` attribute on `<html>` element
- Svelte 5 runes store can persist via `$effect` writing to localStorage
- SvelteKit needs `kit.serviceWorker.register: false` to let @vite-pwa handle SW registration
- Current favicon.svg is Svelte logo — needs replacement with EcoPlate leaf icon

---

## Work Objectives

### Core Objective
Make EcoPlate installable as a PWA with offline support, and add Gen Z-optimized UX patterns that align with the design thinking principle of "Time to Value" — scan QR → reserve → pickup code in ~10 seconds.

### Concrete Deliverables
- `vite.config.ts` updated with SvelteKitPWA plugin + manifest config
- `svelte.config.js` switched to adapter-static with serviceWorker.register: false
- `src/app.html` with all PWA meta tags (theme-color, apple-touch-icon, apple-mobile-web-app-capable)
- PWA icons: 192x192, 512x512, maskable (in `static/`)
- `src/app.css` with dark theme colors
- `src/lib/components/ThemeToggle.svelte`
- `src/lib/components/BottomNav.svelte`
- `src/lib/components/SkeletonCard.svelte`
- `src/lib/components/InstallPrompt.svelte`
- `src/lib/components/ReloadPrompt.svelte`
- `src/lib/components/OfflineIndicator.svelte`
- `src/routes/impact/+page.svelte`
- `src/routes/profile/+page.svelte`
- `src/lib/stores/app.svelte.ts` updated with localStorage persistence

### Definition of Done
- [ ] `bun run build` passes with zero errors
- [ ] App is installable as PWA (Lighthouse PWA audit passes core checks)
- [ ] Bottom nav shows on student routes, hidden on admin routes
- [ ] Dark/light mode toggles correctly and persists across page reload
- [ ] State (user, reservation, theme) persists in localStorage
- [ ] /impact and /profile routes render correctly
- [ ] Install prompt appears after first reservation

### Must Have
- All PWA requirements: manifest, service worker, icons, meta tags
- Bottom navigation with active tab highlighting
- Dark mode with system preference detection
- Skeleton loading states replacing spinners
- localStorage state persistence
- Offline indicator when network is down

### Must NOT Have (Guardrails)
- NO motion, motion-svelte, svelte-motion, or framer-motion packages
- NO shadcn/ui, Radix, or Bits UI components (using DaisyUI only)
- NO Svelte 4 legacy patterns ($: reactive, writable() stores, export let props)
- NO lucide-svelte (use @lucide/svelte for Svelte 5)
- NO push notification backend (no backend exists)
- NO native app builds (TWA/Capacitor)
- NO leaderboards or social sharing
- NO actual payment processing or QR scanning

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL verification is executed by the agent using tools (Playwright, bash, curl). No human action permitted.

### Test Decision
- **Infrastructure exists**: YES (Vitest + Playwright already configured)
- **Automated tests**: Tests-after (add tests for critical new components)
- **Framework**: Vitest (unit), Playwright (E2E)

### Agent-Executed QA Scenarios

Every task includes Playwright or bash-based verification. The executing agent will:
1. Run `bun run build` after each wave to catch breakage
2. Use Playwright to verify UI changes (bottom nav, dark mode, install prompt)
3. Use Chrome DevTools / Lighthouse for PWA audit
4. Check localStorage persistence via browser console

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: PWA Foundation (adapter, manifest, icons, meta tags, SW)
└── Task 2: State Persistence (localStorage layer in store)

Wave 2 (After Wave 1):
├── Task 3: Dark Mode (theme CSS, toggle component, persistence)
├── Task 4: Bottom Navigation (component, layout integration, route awareness)
└── Task 5: Skeleton Screens + Micro-celebrations

Wave 3 (After Wave 2):
├── Task 6: Install Prompt + ReloadPrompt + Offline Indicator
└── Task 7: New Routes (/impact, /profile)

Critical Path: Task 1 → Task 4 → Task 7
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5, 6 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 7 | 4, 5 |
| 4 | 1 | 7 | 3, 5 |
| 5 | 1 | None | 3, 4 |
| 6 | 1 | None | 7 |
| 7 | 3, 4 | None | 6 |

---

## TODOs

- [ ] 1. PWA Foundation — Adapter, Manifest, Service Worker, Icons, Meta Tags

  **What to do**:
  - Install `@vite-pwa/sveltekit` and `@sveltejs/adapter-static`: `bun add -d @vite-pwa/sveltekit @sveltejs/adapter-static`
  - Update `svelte.config.js`: switch import from `adapter-auto` to `adapter-static`, add `kit.serviceWorker.register: false`, add fallback page config
  - Update `vite.config.ts`: import `SvelteKitPWA` from `@vite-pwa/sveltekit`, add to plugins array with manifest config:
    - `name: "EcoPlate"`, `short_name: "EcoPlate"`, `description: "Campus food rescue"`, `theme_color: "#16a34a"`, `background_color: "#f8faf8"`
    - `display: "standalone"`, `start_url: "/"`
    - Icons array: 192x192, 512x512, maskable
    - Workbox config: `generateSW` strategy, runtimeCaching for navigation routes
  - Generate PWA icons: Create a simple leaf-themed SVG icon for EcoPlate (replace Svelte logo in `src/lib/assets/favicon.svg`), then create PNG versions at 192x192, 512x512, and a maskable variant — place in `static/` directory. If PNG generation tools aren't available, create clean SVG icons and reference them in manifest.
  - Update `src/app.html`:
    - Add `<meta name="theme-color" content="#16a34a">`
    - Add `<meta name="apple-mobile-web-app-capable" content="yes">`
    - Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
    - Add `<link rel="apple-touch-icon" href="/icon-192x192.png">`
    - Add `<meta name="description" content="Campus food rescue — $3-$5 meals, right on campus">`
  - Create `src/lib/components/ReloadPrompt.svelte`: Use `virtual:pwa-register/svelte` to show update-available toast via svelte-sonner when `needRefresh` is true, with a "Reload" button calling `updateServiceWorker(true)`
  - Update `src/routes/+layout.svelte`: Import and render `<ReloadPrompt />`, add pwaInfo manifest link from `virtual:pwa-info`
  - Add `+layout.ts` with `export const prerender = true;` for static prerendering (at root or per-route as needed for dynamic `[id]` routes)
  - Handle dynamic routes: `[id]` routes need `entries()` export or prerender config — use `export const prerender = true` with fallback, or use `entries` returning mock drop IDs from `MOCK_DROPS`

  **Must NOT do**:
  - Do NOT use SvelteKit's native `src/service-worker.ts` — let @vite-pwa handle everything
  - Do NOT remove adapter-auto from package.json (keep as fallback), just change the import in svelte.config.js
  - Do NOT use any motion libraries for the ReloadPrompt

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Infrastructure/config work touching multiple config files, not purely visual
  - **Skills**: [`playwright`]
    - `playwright`: For PWA installability verification via Lighthouse

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4, 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `vite.config.ts` (lines 1-12) — Current plugin setup, add SvelteKitPWA after sveltekit()
  - `svelte.config.js` (lines 1-14) — Current adapter-auto config, replace with adapter-static
  - `src/app.html` (lines 1-12) — Current HTML template, add PWA meta tags inside `<head>`
  - `src/routes/+layout.svelte` (lines 1-30) — Root layout, add ReloadPrompt and pwaInfo link

  **API/Type References**:
  - `src/lib/data.ts` — MOCK_DROPS array, use drop IDs for prerender entries()

  **External References**:
  - @vite-pwa/sveltekit docs: https://vite-pwa-org.netlify.app/frameworks/sveltekit
  - SvelteKit adapter-static docs: https://svelte.dev/docs/kit/adapter-static

  **Acceptance Criteria**:

  - [ ] `bun run build` completes with zero errors
  - [ ] Built output includes a service worker file
  - [ ] Built output includes a webmanifest file with correct name, icons, theme_color
  - [ ] `src/app.html` contains theme-color, apple-mobile-web-app-capable, apple-touch-icon meta tags
  - [ ] Icon files exist in `static/` at 192x192 and 512x512 sizes
  - [ ] ReloadPrompt component exists and imports from virtual:pwa-register/svelte

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Build produces PWA artifacts
    Tool: Bash
    Steps:
      1. Run: bun run build
      2. Assert: exit code 0
      3. Check: ls build/ for service worker file (sw.js or similar)
      4. Check: cat build/manifest.webmanifest or .webmanifest in build output
      5. Assert: manifest contains "EcoPlate" as name
    Expected Result: Build succeeds with SW and manifest in output
    Evidence: Build output captured

  Scenario: PWA is installable
    Tool: Playwright
    Preconditions: Run bun run preview (serves built output)
    Steps:
      1. Navigate to http://localhost:4173
      2. Open Chrome DevTools Application tab → Manifest section
      3. Assert: Manifest loaded with correct name, icons, theme_color
      4. Assert: Service worker registered and active
      5. Screenshot: .sisyphus/evidence/task-1-pwa-manifest.png
    Expected Result: PWA passes installability checks
    Evidence: .sisyphus/evidence/task-1-pwa-manifest.png
  ```

  **Commit**: YES
  - Message: `feat: add PWA foundation with manifest, service worker, and icons`
  - Files: `vite.config.ts, svelte.config.js, src/app.html, src/routes/+layout.svelte, src/lib/components/ReloadPrompt.svelte, static/icon-*.png, package.json, bun.lockb`

---

- [ ] 2. State Persistence — localStorage Layer for Svelte 5 Runes Store

  **What to do**:
  - Update `src/lib/stores/app.svelte.ts` to add localStorage persistence:
    - Create a helper function `persistToLocalStorage(key, value)` and `loadFromLocalStorage(key, fallback)`
    - On store initialization, try to load `user`, `reservation`, `drops` state from localStorage
    - Add a `$effect` (or `$effect.root`) that writes state to localStorage whenever it changes — debounce writes (e.g., 500ms) to avoid performance issues
    - Add a `theme` state field: `let theme = $state<'light' | 'dark' | 'system'>('system')` — persisted to localStorage key `ecoplate-theme`
    - Add a `hasCompletedFirstPickup` state field (persisted) — used by install prompt logic
    - Export getter/setter for theme and hasCompletedFirstPickup on appState
    - Add a `resetState()` method to clear localStorage and reset to defaults (useful for testing)
  - Handle SSR safety: Wrap all `localStorage` calls in `typeof window !== 'undefined'` checks or use `browser` from `$app/environment`

  **Must NOT do**:
  - Do NOT use writable() stores (Svelte 4 pattern)
  - Do NOT persist admin stats or codes to localStorage (mock data resets are fine)
  - Do NOT use any external state management library

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file modification with well-defined scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/lib/stores/app.svelte.ts` (lines 1-259) — Full current store, all $state declarations at top (lines 6-17), appState export object (lines 19-258)
  - `src/lib/types.ts` (lines 37-44) — UserState interface, use for type-safe localStorage

  **External References**:
  - Svelte 5 $effect docs: https://svelte.dev/docs/svelte/$effect
  - SvelteKit `browser` import: `import { browser } from '$app/environment'`

  **Acceptance Criteria**:

  - [ ] `bun run build` passes
  - [ ] Store loads persisted user state from localStorage on init
  - [ ] Store writes user/reservation/theme to localStorage on change
  - [ ] `theme` state is readable and writable via appState
  - [ ] `hasCompletedFirstPickup` state is readable and writable via appState
  - [ ] SSR doesn't crash (localStorage access guarded)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: State persists across page reload
    Tool: Playwright
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to http://localhost:5173
      2. Execute JS: localStorage.getItem('ecoplate-user') — should be null initially or have default
      3. Navigate to a drop and complete a reservation
      4. Execute JS: localStorage.getItem('ecoplate-user') — should contain updated state
      5. Reload the page
      6. Assert: Reservation state is still visible (not reset)
    Expected Result: State survives page reload
    Evidence: Console output captured

  Scenario: SSR doesn't crash
    Tool: Bash
    Steps:
      1. Run: bun run build
      2. Assert: exit code 0, no "localStorage is not defined" errors
    Expected Result: Build succeeds without SSR errors
  ```

  **Commit**: YES
  - Message: `feat: add localStorage persistence to Svelte 5 runes store`
  - Files: `src/lib/stores/app.svelte.ts`

---

- [ ] 3. Dark Mode — Theme CSS, Toggle Component, System Preference Detection

  **What to do**:
  - Update `src/app.css`:
    - Add `[data-theme="dark"]` block with dark emerald theme colors:
      - `--color-base-100: #1d232a` (dark card bg)
      - `--color-base-200: #191e24` (dark page bg)
      - `--color-base-300: #15191e` (darker accents)
      - `--color-base-content: #e8f5e9` (light green text)
      - `--color-primary: #22c55e` (brighter green for dark mode visibility)
      - Keep all other semantic colors adjusted for dark backgrounds
    - Update `:root` CSS vars to also have dark variants, or remove `:root` vars if only DaisyUI theme vars are used
  - Create `src/lib/components/ThemeToggle.svelte`:
    - Import `Sun`, `Moon` from `@lucide/svelte`
    - Read `appState.theme` for current preference ('light' | 'dark' | 'system')
    - On click: cycle light → dark → system
    - Apply theme by setting `document.documentElement.setAttribute('data-theme', resolvedTheme)` in a `$effect`
    - For 'system': use `window.matchMedia('(prefers-color-scheme: dark)')` to resolve, listen to `change` event
    - Guard with `browser` from `$app/environment` for SSR safety
  - Update `src/app.html`: Change `data-theme="light"` to just `data-theme="light"` (keep as default, JS will override on load)
  - Add script to `src/app.html` `<head>` to prevent flash of wrong theme:
    ```html
    <script>
      (function() {
        const t = localStorage.getItem('ecoplate-theme');
        if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else if (t === 'system' || !t) {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches)
            document.documentElement.setAttribute('data-theme', 'dark');
        }
      })();
    </script>
    ```

  **Must NOT do**:
  - Do NOT use CSS-in-JS or styled-components
  - Do NOT add any third-party theme libraries
  - Do NOT change the emerald green brand identity (just adjust brightness for dark mode)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Theme/styling work with visual output
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Dark mode design decisions and color contrast
    - `playwright`: Visual verification of dark/light mode

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/app.css` (lines 1-55) — Current light theme CSS, add dark theme block after line 35
  - `src/app.html` (line 2) — Current `data-theme="light"`, add inline script to prevent FOUC
  - `src/lib/stores/app.svelte.ts` — Theme state from Task 2

  **External References**:
  - DaisyUI themes: https://daisyui.com/docs/themes/

  **Acceptance Criteria**:

  - [ ] `bun run build` passes
  - [ ] ThemeToggle component toggles between light, dark, system
  - [ ] Dark theme has proper contrast (light text on dark bg)
  - [ ] Theme preference persists in localStorage key `ecoplate-theme`
  - [ ] No flash of wrong theme on page load (inline script handles it)
  - [ ] System preference detection works (follows OS dark mode setting)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Dark mode toggle works
    Tool: Playwright
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: data-theme attribute on <html> is "light" (default)
      3. Find and click the ThemeToggle button
      4. Assert: data-theme changes to "dark"
      5. Assert: Background color is dark (#191e24 or similar)
      6. Screenshot: .sisyphus/evidence/task-3-dark-mode.png
      7. Reload page
      8. Assert: data-theme is still "dark" (persisted)
    Expected Result: Dark mode toggles and persists
    Evidence: .sisyphus/evidence/task-3-dark-mode.png
  ```

  **Commit**: YES
  - Message: `feat: add dark mode with system preference detection and toggle`
  - Files: `src/app.css, src/app.html, src/lib/components/ThemeToggle.svelte`

---

- [ ] 4. Bottom Navigation — Component, Layout Integration, Route Awareness

  **What to do**:
  - Create `src/lib/components/BottomNav.svelte`:
    - 4 tabs: Drops (Home icon), My Pickup (Ticket/QrCode icon), Impact (TrendingUp/BarChart3 icon), Profile (User icon)
    - Icons from `@lucide/svelte`: `Home`, `Ticket`, `TrendingUp`, `User`
    - Use `$page.url.pathname` from `$app/stores` (via `import { page } from '$app/state'` for Svelte 5) to highlight active tab
    - Route mapping: `/` → Drops, `/pickup/*` → My Pickup, `/impact` → Impact, `/profile` → Profile
    - Fixed to bottom: `fixed bottom-0 left-0 right-0` with `z-50`
    - Style: DaisyUI `btm-nav` component class or custom with `bg-base-100 border-t border-base-300`
    - Active tab: `text-primary` with filled icon variant
    - Add `pb-safe` (safe area padding) for iOS home indicator: `padding-bottom: env(safe-area-inset-bottom)`
    - Responsive: Show on mobile/tablet, hide on desktop (`lg:hidden`) — on desktop the existing top header nav is sufficient
    - Each tab navigates via `goto()` from `$app/navigation`
  - Update `src/routes/+layout.svelte`:
    - Import BottomNav
    - Import ThemeToggle from Task 3
    - Conditionally render `<BottomNav />` only on student routes (NOT on `/admin/*` paths)
    - Use `$page.url.pathname` to check if current route starts with `/admin`
    - Add `pb-16 lg:pb-0` to main content wrapper to account for bottom nav height on mobile
  - Move the "Staff" button: Keep it in the header on the landing page AND add it to the Profile page as a link

  **Must NOT do**:
  - Do NOT show bottom nav on admin routes (`/admin`, `/admin/dashboard`, etc.)
  - Do NOT use a sidebar navigation (keep it simple — bottom nav mobile, existing header desktop)
  - Do NOT use svelte-routing or any external router

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Navigation UI component with responsive behavior
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Navigation UX patterns, thumb-zone optimization
    - `playwright`: Verify nav visibility, active states, route navigation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/routes/+layout.svelte` (lines 1-30) — Root layout, add BottomNav conditionally
  - `src/routes/+page.svelte` (lines 41-46) — Current "Staff" button in header, keep here
  - `src/lib/components/DropCard.svelte` (lines 7-15) — Props interface pattern for Svelte 5

  **External References**:
  - DaisyUI bottom navigation: https://daisyui.com/components/bottom-navigation/
  - SvelteKit page store: https://svelte.dev/docs/kit/$app-state

  **Acceptance Criteria**:

  - [ ] `bun run build` passes
  - [ ] Bottom nav visible on `/` route with 4 tabs
  - [ ] Bottom nav hidden on `/admin` and all admin sub-routes
  - [ ] Active tab highlights based on current route
  - [ ] Tapping tab navigates to correct route
  - [ ] Bottom nav hidden on desktop (lg: breakpoint)
  - [ ] Main content has bottom padding to avoid overlap with nav on mobile
  - [ ] Safe area padding for iOS devices

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Bottom nav shows on student routes, hidden on admin
    Tool: Playwright
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: Bottom navigation bar is visible (4 tabs)
      3. Assert: "Drops" tab has active/highlighted style
      4. Navigate to http://localhost:5173/admin
      5. Assert: Bottom navigation bar is NOT visible
      6. Screenshot: .sisyphus/evidence/task-4-bottom-nav.png
    Expected Result: Nav shows for students, hidden for admin
    Evidence: .sisyphus/evidence/task-4-bottom-nav.png

  Scenario: Tab navigation works
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Click "Impact" tab in bottom nav
      3. Assert: URL is /impact
      4. Assert: "Impact" tab is now highlighted
      5. Click "Profile" tab
      6. Assert: URL is /profile
    Expected Result: Tabs navigate correctly
  ```

  **Commit**: YES
  - Message: `feat: add bottom navigation bar with route-aware active states`
  - Files: `src/lib/components/BottomNav.svelte, src/routes/+layout.svelte`

---

- [ ] 5. Skeleton Screens + Micro-Celebrations

  **What to do**:
  - Create `src/lib/components/SkeletonCard.svelte`:
    - Match the exact layout of DropCard.svelte but with DaisyUI skeleton placeholders
    - Use `skeleton` class from DaisyUI: `<div class="skeleton h-4 w-28"></div>` for text lines
    - Skeleton for: emoji area (left), title, description, time/location row, price badge
    - Accept a `count` prop to render multiple skeletons
  - Update pages that show loading states to use SkeletonCard instead of `loading-spinner`:
    - `src/routes/+page.svelte` — Show 3 SkeletonCards while "loading" (simulate with a brief delay or `onMount`)
    - Any other pages that have loading states
  - Add micro-celebration animations (CSS-only, NO motion libraries):
    - Confetti effect on successful reservation (`src/routes/drop/[id]/reserve/+page.svelte`): Use CSS `@keyframes` for particle animations, triggered on reservation confirmation
    - Checkmark bounce on pickup code display (`src/routes/pickup/[id]/+page.svelte`): CSS scale + bounce keyframe on the pickup code
    - Success pulse on rating submission (`src/routes/rating/+page.svelte`): Green pulse ring animation
  - Add haptic feedback: Call `navigator.vibrate(50)` on key button presses (reserve, confirm pickup) — wrap in `typeof navigator.vibrate === 'function'` check
  - Update environmental impact display to use relatable comparisons where shown (e.g., "= 45 miles not driven", "= 12 showers saved")

  **Must NOT do**:
  - Do NOT use framer-motion, motion-svelte, or any animation library
  - Do NOT add heavy confetti libraries (canvas-confetti etc.) — CSS only
  - Do NOT make animations too long (keep under 1.5s)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Animation, skeleton UI, and visual feedback
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Micro-interaction design, skeleton screen patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/lib/components/DropCard.svelte` (lines 20-92) — Layout structure to mirror in skeleton
  - `src/routes/drop/[id]/reserve/+page.svelte` — Reservation confirmation, add confetti trigger
  - `src/routes/pickup/[id]/+page.svelte` — Pickup code display, add bounce animation
  - `src/routes/rating/+page.svelte` — Rating submission, add success pulse

  **External References**:
  - DaisyUI skeleton: https://daisyui.com/components/skeleton/

  **Acceptance Criteria**:

  - [ ] `bun run build` passes
  - [ ] SkeletonCard renders with correct layout matching DropCard dimensions
  - [ ] Landing page shows skeleton cards briefly before content
  - [ ] Confetti animation plays on reservation confirmation
  - [ ] Bounce animation on pickup code display
  - [ ] No animation libraries in package.json (CSS-only)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Skeleton cards display on landing page
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: Skeleton elements with class "skeleton" are visible (briefly or on slow load)
      3. Wait for actual drop cards to appear
      4. Assert: DropCard components visible after loading
    Expected Result: Smooth skeleton → content transition

  Scenario: Micro-celebration on reservation
    Tool: Playwright
    Steps:
      1. Navigate to a drop detail page
      2. Complete reservation flow
      3. Assert: Confetti/celebration CSS animation plays (check for animation class or keyframe)
      4. Screenshot: .sisyphus/evidence/task-5-celebration.png
    Expected Result: Visual celebration on success
    Evidence: .sisyphus/evidence/task-5-celebration.png
  ```

  **Commit**: YES
  - Message: `feat: add skeleton loading screens and micro-celebration animations`
  - Files: `src/lib/components/SkeletonCard.svelte, src/routes/+page.svelte, src/routes/drop/[id]/reserve/+page.svelte, src/routes/pickup/[id]/+page.svelte, src/routes/rating/+page.svelte`

---

- [ ] 6. Install Prompt + Offline Indicator

  **What to do**:
  - Create `src/lib/components/InstallPrompt.svelte`:
    - Capture the `beforeinstallprompt` event on `window` in `onMount`
    - Store the event, defer the native prompt
    - Only show the custom install banner when `appState.hasCompletedFirstPickup` is true (from Task 2)
    - Banner design: Bottom toast-style card with "Add EcoPlate to Home Screen" message, "Install" button (calls `deferredPrompt.prompt()`), and "Maybe Later" dismiss button
    - On successful install (`appinstalled` event), hide banner and record in localStorage
    - Banner should be dismissable and not show again for 7 days after dismiss
    - Use DaisyUI `alert` or `card` component for the banner
    - Position: Fixed above bottom nav, with slide-up animation (CSS transition)
  - Create `src/lib/components/OfflineIndicator.svelte`:
    - Listen to `navigator.onLine`, `window.addEventListener('online')`, `window.addEventListener('offline')`
    - When offline: Show a small banner at top of screen: "You're offline — showing cached data"
    - Use DaisyUI `alert alert-warning` styling
    - Auto-dismiss when back online with a brief "Back online!" success message
  - Add both components to `src/routes/+layout.svelte`

  **Must NOT do**:
  - Do NOT show install prompt to users who haven't completed their first pickup
  - Do NOT show install prompt on admin routes
  - Do NOT use any third-party install prompt libraries

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Two focused components with straightforward browser API usage
  - **Skills**: [`playwright`]
    - `playwright`: Test install prompt visibility logic, offline simulation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/routes/+layout.svelte` (lines 1-30) — Add InstallPrompt and OfflineIndicator here
  - `src/lib/stores/app.svelte.ts` — `hasCompletedFirstPickup` from Task 2
  - `src/lib/components/DropCard.svelte` (lines 7-15) — Svelte 5 Props pattern

  **External References**:
  - beforeinstallprompt: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
  - navigator.onLine: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine

  **Acceptance Criteria**:

  - [ ] `bun run build` passes
  - [ ] InstallPrompt component exists and captures beforeinstallprompt event
  - [ ] Install banner only shows after first pickup (hasCompletedFirstPickup === true)
  - [ ] OfflineIndicator shows warning when network is disconnected
  - [ ] OfflineIndicator auto-hides when network reconnects

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Offline indicator shows when network drops
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:5173
      2. Use Playwright to go offline (context.setOffline(true))
      3. Assert: Offline indicator banner is visible with warning text
      4. Go back online (context.setOffline(false))
      5. Assert: Offline indicator disappears or shows "Back online" briefly
      6. Screenshot: .sisyphus/evidence/task-6-offline.png
    Expected Result: Offline state is clearly communicated
    Evidence: .sisyphus/evidence/task-6-offline.png

  Scenario: Install prompt not shown before first pickup
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: No install prompt banner visible (user hasn't completed pickup)
    Expected Result: Install prompt is hidden for new users
  ```

  **Commit**: YES
  - Message: `feat: add smart install prompt and offline indicator`
  - Files: `src/lib/components/InstallPrompt.svelte, src/lib/components/OfflineIndicator.svelte, src/routes/+layout.svelte`

---

- [ ] 7. New Routes — /impact and /profile Pages

  **What to do**:
  - Create `src/routes/impact/+page.svelte`:
    - Personal impact dashboard for the student
    - Show stats from `appState.user`: `totalPickups`, calculate estimated CO2 saved (each meal ≈ 2.5 kg CO2), meals rescued count
    - Relatable comparisons: "= X miles not driven", "= X trees planted for a day", "= X showers saved"
    - Visual: Use DaisyUI `stats` component for key metrics
    - Streak tracker: "Current streak: X days" (can be mock/calculated from data)
    - Monthly breakdown chart or simple visual (use DaisyUI progress bars, not a charting library)
    - Color: Emerald green themed, matching the app's identity
    - Responsive: Single column mobile, two-column grid on desktop
    - Header: "Your Impact" with a leaf or earth icon from @lucide/svelte
    - If no pickups yet: Show motivational empty state "Complete your first rescue to start tracking impact!"
  - Create `src/routes/profile/+page.svelte`:
    - User profile and settings page
    - Show: Account status (has account or guest), membership plan (basic/premium/none), credits remaining
    - Settings section: ThemeToggle component (from Task 3), notification preferences (mock toggles)
    - Membership info: Current plan, credits used this month, upgrade/downgrade CTA
    - "Staff Access" link/button → navigates to `/admin`
    - "Reset Data" button → calls `appState.resetState()` (from Task 2)
    - Responsive: Single column mobile, card layout on desktop
    - If guest (no account): Show "Create Account" CTA linking to `/account`
  - Both pages should match the existing app style: emerald green header section, white/base-200 content area, DaisyUI components

  **Must NOT do**:
  - Do NOT use any charting libraries (use DaisyUI progress bars/stats)
  - Do NOT add real notification toggle functionality (mock UI only)
  - Do NOT create a separate settings page — keep settings within /profile

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Two new UI pages with data display and responsive layout
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Dashboard layout, data visualization UX
    - `playwright`: Verify page rendering, navigation, responsive layout

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/routes/+page.svelte` (lines 28-57) — Header pattern with emerald bg + rounded bottom, copy this structure
  - `src/routes/account/+page.svelte` — Membership plan display, pricing UI pattern
  - `src/routes/admin/dashboard/+page.svelte` — Stats display pattern, grid layout for metrics
  - `src/lib/stores/app.svelte.ts` (lines 29-31) — `appState.user` getter for user data
  - `src/lib/types.ts` (lines 37-52) — UserState and Membership interfaces

  **API/Type References**:
  - `src/lib/types.ts:UserState` — `isFirstTime`, `totalPickups`, `noShowCount`, `hasAccount`, `membership`, `creditsRemaining`
  - `src/lib/types.ts:Membership` — `plan`, `monthlyPrice`, `creditsPerMonth`, `earlyAccess`

  **Acceptance Criteria**:

  - [ ] `bun run build` passes
  - [ ] `/impact` route renders with impact stats (meals rescued, CO2 saved, relatable comparisons)
  - [ ] `/impact` shows empty state when no pickups
  - [ ] `/profile` route renders with user info, membership status, settings
  - [ ] `/profile` contains ThemeToggle component
  - [ ] `/profile` has "Staff Access" link to /admin
  - [ ] Both pages are responsive (single col mobile, multi-col desktop)
  - [ ] Both pages follow the existing emerald green header pattern

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Impact page shows stats
    Tool: Playwright
    Preconditions: Dev server running, user has completed at least 1 pickup
    Steps:
      1. Navigate to http://localhost:5173/impact
      2. Assert: Page title "Your Impact" or similar is visible
      3. Assert: Meals rescued count is displayed
      4. Assert: CO2 saved stat is displayed with relatable comparison
      5. Screenshot: .sisyphus/evidence/task-7-impact.png
    Expected Result: Impact dashboard renders with stats
    Evidence: .sisyphus/evidence/task-7-impact.png

  Scenario: Profile page shows user info and settings
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/profile
      2. Assert: Account status section is visible
      3. Assert: ThemeToggle component is present
      4. Assert: "Staff Access" link/button is visible
      5. Click "Staff Access"
      6. Assert: URL is /admin
      7. Screenshot: .sisyphus/evidence/task-7-profile.png
    Expected Result: Profile page renders with all sections
    Evidence: .sisyphus/evidence/task-7-profile.png

  Scenario: Impact empty state for new user
    Tool: Playwright
    Preconditions: Fresh state, no pickups
    Steps:
      1. Clear localStorage
      2. Navigate to http://localhost:5173/impact
      3. Assert: Empty state message visible ("Complete your first rescue...")
    Expected Result: Motivational empty state shown
  ```

  **Commit**: YES
  - Message: `feat: add /impact dashboard and /profile settings pages`
  - Files: `src/routes/impact/+page.svelte, src/routes/profile/+page.svelte`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat: add PWA foundation with manifest, service worker, and icons` | config files, ReloadPrompt, icons | `bun run build` |
| 2 | `feat: add localStorage persistence to Svelte 5 runes store` | app.svelte.ts | `bun run build` |
| 3 | `feat: add dark mode with system preference detection and toggle` | app.css, app.html, ThemeToggle | `bun run build` |
| 4 | `feat: add bottom navigation bar with route-aware active states` | BottomNav, +layout.svelte | `bun run build` |
| 5 | `feat: add skeleton loading screens and micro-celebration animations` | SkeletonCard, page updates | `bun run build` |
| 6 | `feat: add smart install prompt and offline indicator` | InstallPrompt, OfflineIndicator | `bun run build` |
| 7 | `feat: add /impact dashboard and /profile settings pages` | new route pages | `bun run build` |

---

## Success Criteria

### Verification Commands
```bash
bun run build    # Expected: exit 0, zero errors
bun run preview  # Expected: serves PWA-ready app
bun run test     # Expected: all existing tests still pass
```

### Final Checklist
- [ ] App is installable as PWA (manifest + service worker + icons)
- [ ] Dark mode works and persists
- [ ] Bottom nav shows on student routes with 4 tabs
- [ ] Bottom nav hidden on admin routes
- [ ] Skeleton loading screens replace spinners
- [ ] Micro-celebrations play on key actions
- [ ] Install prompt shows after first pickup only
- [ ] Offline indicator works
- [ ] /impact and /profile routes render correctly
- [ ] State persists in localStorage across page reload
- [ ] `bun run build` passes with zero errors
- [ ] No forbidden libraries in package.json (no motion libs, no shadcn, no Svelte 4 patterns)
