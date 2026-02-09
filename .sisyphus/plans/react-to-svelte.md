# React to Svelte 5 + SvelteKit Conversion

## TL;DR

> **Quick Summary**: Convert the EcoPlate React prototype to Svelte 5 + SvelteKit with DaisyUI, preserving all functionality, styling, and animations using Svelte's native transition system.
> 
> **Deliverables**:
> - Fresh SvelteKit project replacing React codebase
> - 11 route pages matching all React screens
> - Centralized state store with Svelte 5 runes
> - DaisyUI emerald theme with CSS variable bridge
> - Basic component tests with Vitest
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5-10 → Task 11-17 → Task 18-19

---

## Context

### Original Request
Convert all React code to Svelte 5 while keeping results exactly the same. Tech stack: Latest Svelte/SvelteKit, DaisyUI for components, Tailwind CSS, and animations matching current Framer Motion behavior.

### Interview Summary
**Key Discussions**:
- **Routing**: Use SvelteKit file-based routing instead of screen-state approach
- **Theme**: DaisyUI emerald theme with CSS variable bridge for existing shadcn tokens
- **Tests**: Basic component tests after conversion with Vitest + Svelte Testing Library
- **Animation**: Use Svelte built-in transitions (fly, fade, scale) + View Transitions API (NOT motion library)
- **Project structure**: Replace React in-place

**Research Findings**:
- 50 shadcn/ui components are DEAD CODE (none imported) - do NOT migrate
- Motion/Framer Motion has NO official Svelte bindings - using native transitions
- Only 3 animation patterns: enter animations (95%), progress bars (3%), gestures (2%)
- Use `@lucide/svelte` (NOT `lucide-svelte`) for Svelte 5 compatibility
- All 141 motion usages map cleanly to Svelte transitions

### Metis Review
**Identified Gaps** (addressed):
- Animation library assumption was wrong: Resolved by using Svelte built-in transitions
- CSS token mismatch: Resolved by creating CSS variable bridge
- State architecture question: Resolved with centralized `$state` rune store
- Package name gotchas: Documented correct packages (@lucide/svelte, svelte-sonner)

---

## Work Objectives

### Core Objective
Replace the React EcoPlate prototype with an identical SvelteKit implementation using modern Svelte 5 patterns, DaisyUI components, and native Svelte transitions.

### Concrete Deliverables
- SvelteKit project with TypeScript, Tailwind v4, DaisyUI v5
- 11 route pages: /, /drop/[id], /drop/[id]/reserve, /pickup/[id], /rating, /account, /admin, /admin/dashboard, /admin/create, /admin/redeem, /admin/no-shows
- `$lib/stores/app.svelte.ts` - centralized state with Svelte 5 runes
- `$lib/types.ts` - migrated TypeScript interfaces
- `$lib/data.ts` - mock data and utility functions
- CSS variable bridge mapping shadcn tokens to DaisyUI
- Vitest test suite for stores, utilities, and key components

### Definition of Done
- [ ] `npm run build` completes with zero errors
- [ ] `npm run dev` serves app at localhost:5173
- [ ] All 11 routes render correctly
- [ ] Full user flow (browse → reserve → pickup → rate → account) works
- [ ] Admin flow (login → dashboard → create/redeem/no-shows) works
- [ ] Visual appearance matches React version (verified via Playwright screenshots)
- [ ] All tests pass (`npm test`)

### Must Have
- Svelte 5 rune syntax everywhere (`$state`, `$derived`, `$effect`, `$props`)
- SvelteKit file-based routing
- DaisyUI emerald theme
- Svelte built-in transitions for all animations
- View Transitions API for page transitions
- Toast notifications with svelte-sonner
- Icons with @lucide/svelte
- TypeScript throughout
- Mobile-first responsive design (max-w-md centered)

### Must NOT Have (Guardrails)
- NO motion, motion-svelte, svelte-motion, or framer-motion packages
- NO shadcn/ui, Radix, or Bits UI components (using DaisyUI)
- NO Svelte 4 legacy patterns ($: reactive, writable() stores, export let props)
- NO migration of the 50 dead shadcn/ui component files
- NO dark mode toggle (React app defines but never uses it)
- NO SSR/backend features (staying client-side with mock data)
- NO `<Motion>` wrapper components mimicking Framer Motion
- DO NOT create acceptance criteria requiring human visual confirmation

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL verification is executed by the agent using tools (Playwright, Bash, etc.).

### Test Decision
- **Infrastructure exists**: NO (creating fresh)
- **Automated tests**: Tests-after
- **Framework**: Vitest + @testing-library/svelte

### Agent-Executed QA Approach

Every task includes detailed Playwright scenarios for UI verification and Bash commands for build/type checking. No human interaction required.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Sequential):
├── Task 1: Scaffold SvelteKit project
├── Task 2: Configure DaisyUI + Theme
├── Task 3: Migrate types and data
└── Task 4: Create state store + root layout

Wave 2 (Student Flow - Parallel after Wave 1):
├── Task 5: Landing page (/)
├── Task 6: DropDetail (/drop/[id])
├── Task 7: ReserveConfirm (/drop/[id]/reserve)
├── Task 8: PickupCode (/pickup/[id])
├── Task 9: PostRating (/rating)
└── Task 10: AccountPrompt (/account)

Wave 3 (Admin Flow - Parallel after Wave 1):
├── Task 11: AdminLogin (/admin)
├── Task 12: AdminDashboard (/admin/dashboard)
├── Task 13: AdminCreateDrop (/admin/create)
├── Task 14: AdminRedeem (/admin/redeem)
└── Task 15: AdminNoShows (/admin/no-shows)

Wave 4 (Integration - After Waves 2 & 3):
├── Task 16: Wire navigation + guards
├── Task 17: Full integration tests
├── Task 18: Component tests with Vitest
└── Task 19: Final build verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4 | None |
| 2 | 1 | 5-15 | 3 |
| 3 | 1 | 4, 5-15 | 2 |
| 4 | 2, 3 | 5-15 | None |
| 5-10 | 4 | 16 | Each other, 11-15 |
| 11-15 | 4 | 16 | Each other, 5-10 |
| 16 | 5-15 | 17 | None |
| 17 | 16 | 18 | None |
| 18 | 17 | 19 | None |
| 19 | 18 | None | None |

---

## TODOs

- [x] 1. Scaffold SvelteKit Project

  **What to do**:
  - Archive existing React src/ to .archive/react-src/ for reference
  - Run `npx sv create . --template minimal` with TypeScript
  - Select Svelte 5, TypeScript, Tailwind CSS v4
  - Verify project structure created correctly
  - Run `npm install` and `npm run dev` to confirm working

  **Must NOT do**:
  - Do NOT delete React files until archived
  - Do NOT select any additional features (ESLint, Prettier - keep minimal)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding is a straightforward, single-step task
  - **Skills**: [`git-master`]
    - `git-master`: May need to handle git operations during archive

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 - Sequential
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None

  **References**:
  - `package.json` (current): Shows current dependencies for comparison
  - SvelteKit docs: https://svelte.dev/docs/kit/creating-a-project

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: SvelteKit project scaffolded successfully
    Tool: Bash
    Steps:
      1. ls -la src/routes/ → Assert +page.svelte exists
      2. ls -la src/lib/ → Assert directory exists
      3. cat package.json | grep svelte → Assert "@sveltejs/kit" present
      4. cat package.json | grep typescript → Assert typescript present
      5. npm run dev & sleep 5 && curl -s http://localhost:5173 → Assert 200 response
      6. kill %1
    Expected Result: Fresh SvelteKit project with TypeScript and Tailwind
    Evidence: Terminal output captured

  Scenario: React source archived
    Tool: Bash
    Steps:
      1. ls -la .archive/react-src/ → Assert src/app/App.tsx exists in archive
      2. ls src/app/ 2>&1 → Assert "No such file" (original deleted)
    Expected Result: React code preserved but moved out of active src/
    Evidence: Directory listing captured
  ```

  **Commit**: YES
  - Message: `chore: scaffold SvelteKit project, archive React source`
  - Files: `package.json`, `svelte.config.js`, `vite.config.ts`, `src/`, `.archive/`

---

- [x] 2. Configure DaisyUI + Theme + CSS Variable Bridge

  **What to do**:
  - Install DaisyUI v5: `npm install daisyui@latest`
  - Configure in src/app.css with `@plugin "daisyui"` (Tailwind v4 approach)
  - Set emerald as default theme on html element
  - Create CSS variable bridge mapping shadcn tokens → DaisyUI:
    ```css
    :root {
      /* Bridge shadcn tokens to DaisyUI */
      --primary: var(--color-primary);
      --primary-foreground: var(--color-primary-content);
      --background: var(--color-base-200);
      --foreground: var(--color-base-content);
      --card: var(--color-base-100);
      --card-foreground: var(--color-base-content);
      --muted: var(--color-base-300);
      --muted-foreground: color-mix(in srgb, var(--color-base-content) 60%, transparent);
      --accent: var(--color-accent);
      --accent-foreground: var(--color-accent-content);
      --destructive: var(--color-error);
      --destructive-foreground: var(--color-error-content);
      --border: var(--color-base-300);
      --secondary: var(--color-secondary);
      --secondary-foreground: var(--color-secondary-content);
    }
    ```
  - Verify theme applies by checking computed styles

  **Must NOT do**:
  - Do NOT use tailwind.config.js plugin approach (that's Tailwind v3)
  - Do NOT install shadcn-svelte or Bits UI

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS theming requires understanding of design tokens and styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Theme configuration is design-focused work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Tasks 5-15
  - **Blocked By**: Task 1

  **References**:
  - `src/styles/theme.css` (archived): Current color values - `--primary: #16a34a`, `--background: #f8faf8`, etc.
  - DaisyUI v5 docs: https://daisyui.com/docs/install/
  - DaisyUI emerald theme colors: https://daisyui.com/docs/themes/

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: DaisyUI installed and configured
    Tool: Bash
    Steps:
      1. cat package.json | grep daisyui → Assert "daisyui" present
      2. cat src/app.css | grep '@plugin "daisyui"' → Assert plugin configured
      3. npm run build → Assert no CSS errors
    Expected Result: DaisyUI configured with Tailwind v4 @plugin syntax
    Evidence: Build output captured

  Scenario: Emerald theme applies correctly
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Execute: document.documentElement.getAttribute('data-theme') → Assert "emerald"
      3. Execute: getComputedStyle(document.documentElement).getPropertyValue('--color-primary') → Assert green color value
      4. Screenshot: .sisyphus/evidence/task-2-emerald-theme.png
    Expected Result: Emerald theme active with green primary color
    Evidence: .sisyphus/evidence/task-2-emerald-theme.png

  Scenario: CSS variable bridge works
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Execute: getComputedStyle(document.documentElement).getPropertyValue('--primary') → Assert returns value (not empty)
      3. Execute: getComputedStyle(document.documentElement).getPropertyValue('--card') → Assert returns value
    Expected Result: Shadcn token names resolve to DaisyUI values
    Evidence: Console output captured
  ```

  **Commit**: YES
  - Message: `feat: configure DaisyUI emerald theme with CSS variable bridge`
  - Files: `src/app.css`, `package.json`

---

- [x] 3. Migrate Types, Mock Data, and Utilities

  **What to do**:
  - Create `src/lib/types.ts` from `ecoplate-types.ts`:
    - Copy all interfaces: Drop, Reservation, WaitlistEntry, UserState, Membership, LocationCap, AdminStats
    - REMOVE the `Screen` type union (routing replaces it)
    - Copy utility functions: generatePickupCode, formatTime
  - Create `src/lib/data.ts`:
    - Move mock data: MOCK_DROPS, MOCK_USER, MOCK_STATS
    - Export as named exports
  - Verify TypeScript compiles without errors

  **Must NOT do**:
  - Do NOT include Screen type (no longer needed with file routing)
  - Do NOT modify any type definitions (keep identical)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward file copying with minor modifications
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 4, Tasks 5-15
  - **Blocked By**: Task 1

  **References**:
  - `src/app/components/ecoplate-types.ts` (archived): Source file to migrate - lines 1-223

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Types file created correctly
    Tool: Bash
    Steps:
      1. cat src/lib/types.ts | grep "interface Drop" → Assert present
      2. cat src/lib/types.ts | grep "interface Reservation" → Assert present
      3. cat src/lib/types.ts | grep "type Screen" → Assert NOT present (removed)
      4. cat src/lib/types.ts | grep "generatePickupCode" → Assert function present
      5. cat src/lib/types.ts | grep "formatTime" → Assert function present
      6. npx tsc --noEmit src/lib/types.ts → Assert no type errors
    Expected Result: All interfaces and utilities migrated, Screen type removed
    Evidence: Terminal output captured

  Scenario: Mock data file created correctly
    Tool: Bash
    Steps:
      1. cat src/lib/data.ts | grep "MOCK_DROPS" → Assert present
      2. cat src/lib/data.ts | grep "MOCK_USER" → Assert present
      3. cat src/lib/data.ts | grep "MOCK_STATS" → Assert present
      4. npx tsc --noEmit src/lib/data.ts → Assert no type errors
    Expected Result: All mock data exported and type-safe
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat: migrate TypeScript types and mock data`
  - Files: `src/lib/types.ts`, `src/lib/data.ts`

---

- [ ] 4. Create State Store and Root Layout

  **What to do**:
  - Create `src/lib/stores/app.svelte.ts` using Svelte 5 runes:
    ```typescript
    import { MOCK_DROPS, MOCK_USER, MOCK_STATS } from '$lib/data';
    import type { Drop, Reservation, UserState, AdminStats } from '$lib/types';

    // Reactive state using Svelte 5 runes
    let drops = $state<Drop[]>(MOCK_DROPS);
    let selectedDrop = $state<Drop | null>(null);
    let reservation = $state<Reservation | null>(null);
    let user = $state<UserState>(MOCK_USER);
    let validCodes = $state<string[]>([]);
    let expiredCodes = $state<string[]>(['EXP123', 'OLD456']);
    let recentRedemptions = $state<{ code: string; time: string }[]>([...]);
    let stats = $state<AdminStats>(MOCK_STATS);

    // Export getters and setters
    export const appState = {
      get drops() { return drops; },
      get selectedDrop() { return selectedDrop; },
      // ... etc
      setSelectedDrop(drop: Drop | null) { selectedDrop = drop; },
      // ... action methods matching App.tsx handlers
    };
    ```
  - Create `src/routes/+layout.svelte`:
    - App shell with `max-w-md mx-auto` container
    - Import and render `<Toaster>` from svelte-sonner
    - Set up View Transitions API with `onNavigate`
    - Add `data-theme="emerald"` to html via `<svelte:head>`
  - Install svelte-sonner: `npm install svelte-sonner`
  - Install @lucide/svelte: `npm install @lucide/svelte`

  **Must NOT do**:
  - Do NOT use writable() stores (Svelte 4 pattern)
  - Do NOT use $: reactive declarations (Svelte 4 pattern)
  - Do NOT use export let for props (use $props rune)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: State architecture requires careful design decisions
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Layout and transitions are UI-focused

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 - Sequential (after 2 & 3)
  - **Blocks**: Tasks 5-15
  - **Blocked By**: Tasks 2, 3

  **References**:
  - `src/app/App.tsx` (archived): Lines 26-39 for state definitions, lines 43-298 for handlers
  - Svelte 5 runes docs: https://svelte.dev/docs/svelte/$state
  - svelte-sonner: https://github.com/wobsoriano/svelte-sonner

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: State store uses Svelte 5 runes
    Tool: Bash
    Steps:
      1. cat src/lib/stores/app.svelte.ts | grep '$state' → Assert multiple matches
      2. cat src/lib/stores/app.svelte.ts | grep 'writable' → Assert NOT present
      3. cat src/lib/stores/app.svelte.ts | grep 'MOCK_DROPS' → Assert imported
      4. npx tsc --noEmit → Assert no type errors
    Expected Result: Store uses $state runes, not legacy patterns
    Evidence: Terminal output captured

  Scenario: Root layout renders correctly
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: html element has data-theme="emerald"
      3. Assert: .max-w-md container exists
      4. Screenshot: .sisyphus/evidence/task-4-root-layout.png
    Expected Result: Layout shell with theme and container
    Evidence: .sisyphus/evidence/task-4-root-layout.png

  Scenario: Dependencies installed
    Tool: Bash
    Steps:
      1. cat package.json | grep "svelte-sonner" → Assert present
      2. cat package.json | grep "@lucide/svelte" → Assert present (NOT lucide-svelte)
    Expected Result: Correct packages installed
    Evidence: Package.json contents captured
  ```

  **Commit**: YES
  - Message: `feat: create centralized state store and root layout with View Transitions`
  - Files: `src/lib/stores/app.svelte.ts`, `src/routes/+layout.svelte`, `package.json`

---

- [ ] 5. Migrate StudentLanding Page (/)

  **What to do**:
  - Create `src/routes/+page.svelte` as the landing page
  - Convert React component to Svelte 5 syntax:
    - `useState` → `$state` rune (already in store)
    - Props → `$props` rune (none needed, uses store)
    - `motion.div` animations → Svelte `transition:fly`
    - `.map()` → `{#each}` blocks
    - Conditional rendering → `{#if}` blocks
  - Extract DropCard as `src/lib/components/DropCard.svelte`
  - Convert animation patterns:
    - `initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}` → `in:fly={{ y: -20, duration: 300 }}`
    - Staggered delays: `delay: 0.15 + i * 0.07` → `delay: 150 + i * 70`
  - Convert inline styles: `style={{ fontWeight: 700 }}` → `class="font-bold"`
  - Wire navigation: clicking drop → `goto(`/drop/${drop.id}`)`
  - Wire admin access: clicking Staff → `goto('/admin')`

  **Must NOT do**:
  - Do NOT use motion library for animations
  - Do NOT keep React JSX syntax

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with animations and styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Complex component with transitions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6-10, 11-15)
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/student-landing.tsx` (archived): Lines 1-286 - full component
  - Svelte fly transition: https://svelte.dev/docs/svelte/transition#fly

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Landing page renders all drop sections
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for: text "EcoPlate" visible (timeout: 5s)
      3. Assert: text "Available now" visible
      4. Assert: text "Starting soon" visible OR text "Sold out" visible
      5. Assert: at least 1 drop card visible (contains location name)
      6. Screenshot: .sisyphus/evidence/task-5-landing.png
    Expected Result: Landing page shows EcoPlate header and drop listings
    Evidence: .sisyphus/evidence/task-5-landing.png

  Scenario: Drop card navigation works
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Click: first drop card (button with location text)
      3. Wait for: URL contains "/drop/" (timeout: 3s)
      4. Assert: URL matches /drop/drop-\d+ pattern
    Expected Result: Clicking drop card navigates to drop detail
    Evidence: URL captured

  Scenario: Staff button navigates to admin
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173
      2. Click: button with text "Staff"
      3. Wait for: URL is /admin (timeout: 3s)
    Expected Result: Staff button navigates to admin login
    Evidence: URL captured

  Scenario: Animations use Svelte transitions (not motion)
    Tool: Bash
    Steps:
      1. cat src/routes/+page.svelte | grep "transition:fly" → Assert present
      2. cat src/routes/+page.svelte | grep "motion" → Assert NOT present
      3. cat src/lib/components/DropCard.svelte | grep "transition:" → Assert present
    Expected Result: Native Svelte transitions used
    Evidence: File contents captured
  ```

  **Commit**: YES
  - Message: `feat: migrate StudentLanding page with DropCard component`
  - Files: `src/routes/+page.svelte`, `src/lib/components/DropCard.svelte`

---

- [ ] 6. Migrate DropDetail Page (/drop/[id])

  **What to do**:
  - Create `src/routes/drop/[id]/+page.svelte`
  - Get drop ID from route params using `$page.params.id`
  - Look up drop from store using the ID
  - Convert all React patterns to Svelte 5 (same as Task 5)
  - Handle sold out, upcoming, and active states
  - Wire Reserve button → `goto(`/drop/${drop.id}/reserve`)`
  - Wire Join Waitlist → toast + `goto('/')`
  - Wire Back button → `goto('/')`

  **Must NOT do**:
  - Do NOT hardcode drop data
  - Do NOT skip the progress bar animation (use CSS transition)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with multiple states and animations
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7-10, 11-15)
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/drop-detail.tsx` (archived): Lines 1-266 - full component

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Drop detail page renders correctly
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/drop/drop-1
      2. Wait for: text "North Dining Hall" visible (timeout: 5s)
      3. Assert: text "Pickup location" visible
      4. Assert: text "Pickup window" visible
      5. Assert: price range visible (contains "$")
      6. Assert: "Reserve My Box" button visible (if not sold out)
      7. Screenshot: .sisyphus/evidence/task-6-drop-detail.png
    Expected Result: Drop detail shows location, times, price, and reserve button
    Evidence: .sisyphus/evidence/task-6-drop-detail.png

  Scenario: Back navigation works
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/drop/drop-1
      2. Click: button with text "All drops" or back arrow
      3. Wait for: URL is "/" (timeout: 3s)
    Expected Result: Back button returns to landing
    Evidence: URL captured

  Scenario: Sold out drop shows waitlist
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/drop/drop-3 (sold out drop)
      2. Assert: text "Sold out" visible
      3. Assert: "Join Waitlist" button visible
      4. Assert: "Reserve My Box" button NOT visible
    Expected Result: Sold out drop shows waitlist option instead of reserve
    Evidence: Screenshot captured
  ```

  **Commit**: YES
  - Message: `feat: migrate DropDetail page with all states`
  - Files: `src/routes/drop/[id]/+page.svelte`

---

- [ ] 7. Migrate ReserveConfirm Page (/drop/[id]/reserve)

  **What to do**:
  - Create `src/routes/drop/[id]/reserve/+page.svelte`
  - Get drop from store using route param
  - Convert payment method selection UI
  - Show/hide credit option based on user membership
  - Wire confirm button → call store action → `goto(`/pickup/${reservation.id}`)`
  - Wire back button → `goto(`/drop/${drop.id}`)`

  **Must NOT do**:
  - Do NOT skip the payment method radio group styling
  - Do NOT skip the "How pickup works" section

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Form UI with payment selection
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/reserve-confirm.tsx` (archived): Lines 1-247

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Reserve confirmation page renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/drop/drop-1/reserve
      2. Wait for: text "Confirm your box" visible (timeout: 5s)
      3. Assert: text "Rescue Box" visible
      4. Assert: text "Payment method" visible
      5. Assert: at least 2 payment options visible
      6. Assert: confirm button visible
      7. Screenshot: .sisyphus/evidence/task-7-reserve.png
    Expected Result: Reserve page shows summary and payment options
    Evidence: .sisyphus/evidence/task-7-reserve.png

  Scenario: Confirm reservation creates pickup code
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/drop/drop-1/reserve
      2. Click: confirm button (contains "Reserve" or "Confirm")
      3. Wait for: URL contains "/pickup/" (timeout: 5s)
      4. Assert: 6-character pickup code visible
    Expected Result: Confirming creates reservation and navigates to pickup
    Evidence: URL and code captured
  ```

  **Commit**: YES
  - Message: `feat: migrate ReserveConfirm page with payment selection`
  - Files: `src/routes/drop/[id]/reserve/+page.svelte`

---

- [ ] 8. Migrate PickupCode Page (/pickup/[id])

  **What to do**:
  - Create `src/routes/pickup/[id]/+page.svelte`
  - Get reservation from store using route param
  - Implement countdown timer with `$effect`:
    ```svelte
    let minutesLeft = $state(90);
    $effect(() => {
      const interval = setInterval(() => {
        minutesLeft = Math.max(0, minutesLeft - 1);
      }, 60000);
      return () => clearInterval(interval);
    });
    ```
  - Implement copy to clipboard functionality
  - Show cancel confirmation modal (inline, not separate route)
  - Wire "I Picked Up" → `goto('/rating')`
  - Wire cancel → store action → `goto('/')`

  **Must NOT do**:
  - Do NOT skip the countdown timer color changes (red/amber/blue)
  - Do NOT skip the cancel confirmation modal

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Interactive UI with timer and modal
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/pickup-code.tsx` (archived): Lines 1-240

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Pickup code page displays correctly
    Tool: Playwright
    Steps:
      1. Complete reservation flow to reach /pickup/[id]
      2. Assert: text "You rescued a meal!" visible
      3. Assert: 6-character code visible (monospace, large)
      4. Assert: timer showing minutes remaining
      5. Assert: location and time details visible
      6. Assert: "I Picked Up My Box" button visible
      7. Assert: "Cancel Reservation" button visible
      8. Screenshot: .sisyphus/evidence/task-8-pickup.png
    Expected Result: Pickup page shows code, timer, and action buttons
    Evidence: .sisyphus/evidence/task-8-pickup.png

  Scenario: Copy button works
    Tool: Playwright
    Steps:
      1. Navigate to pickup page
      2. Click: copy button (near the code)
      3. Assert: button shows check icon or "copied" state
    Expected Result: Copy button provides feedback
    Evidence: Screenshot captured

  Scenario: Cancel flow shows confirmation
    Tool: Playwright
    Steps:
      1. Navigate to pickup page
      2. Click: "Cancel Reservation" button
      3. Assert: confirmation modal visible
      4. Assert: text "Cancel reservation?" visible
      5. Click: "Keep my reservation" button
      6. Assert: modal dismissed, still on pickup page
    Expected Result: Cancel shows confirmation before proceeding
    Evidence: Screenshots captured
  ```

  **Commit**: YES
  - Message: `feat: migrate PickupCode page with timer and cancel flow`
  - Files: `src/routes/pickup/[id]/+page.svelte`

---

- [ ] 9. Migrate PostRating Page (/rating)

  **What to do**:
  - Create `src/routes/rating/+page.svelte`
  - Implement star rating with hover/tap animations:
    - `whileHover={{ scale: 1.15 }}` → `class="hover:scale-115 transition-transform"`
    - `whileTap={{ scale: 0.9 }}` → `class="active:scale-90 transition-transform"`
  - Show thank you animation after rating (use `transition:scale`)
  - Wire rating submit → store action → wait 1.2s → `goto('/account')`
  - Wire skip → `goto('/account')`

  **Must NOT do**:
  - Do NOT use motion library for hover/tap (CSS is sufficient)
  - Do NOT skip the thank you feedback animation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Interactive rating with animations
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/post-rating.tsx` (archived): Lines 1-140

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Rating page renders correctly
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/rating
      2. Assert: text "How was your Rescue Box?" visible
      3. Assert: 5 star buttons visible
      4. Assert: "Skip for now" button visible
      5. Assert: environmental impact note visible
      6. Screenshot: .sisyphus/evidence/task-9-rating.png
    Expected Result: Rating page shows stars and skip option
    Evidence: .sisyphus/evidence/task-9-rating.png

  Scenario: Rating submission shows feedback
    Tool: Playwright
    Steps:
      1. Navigate to /rating
      2. Click: 4th star button
      3. Wait for: text "Thanks for the feedback!" visible (timeout: 3s)
      4. Assert: text "You rated" visible
      5. Wait for: URL is /account (timeout: 3s)
    Expected Result: Rating shows thank you then navigates to account
    Evidence: Screenshots captured

  Scenario: Skip navigates to account
    Tool: Playwright
    Steps:
      1. Navigate to /rating
      2. Click: "Skip for now" button
      3. Wait for: URL is /account (timeout: 2s)
    Expected Result: Skip immediately goes to account prompt
    Evidence: URL captured

  Scenario: Star hover uses CSS not motion
    Tool: Bash
    Steps:
      1. cat src/routes/rating/+page.svelte | grep "hover:scale" → Assert present
      2. cat src/routes/rating/+page.svelte | grep "motion" → Assert NOT present
    Expected Result: CSS transitions used for hover/tap
    Evidence: File content captured
  ```

  **Commit**: YES
  - Message: `feat: migrate PostRating page with star animations`
  - Files: `src/routes/rating/+page.svelte`

---

- [ ] 10. Migrate AccountPrompt Page (/account)

  **What to do**:
  - Create `src/routes/account/+page.svelte`
  - Convert membership plan selection UI
  - Show different content for first-time vs returning users
  - Wire plan selection → store action → toast → `goto('/')`
  - Wire dismiss → `goto('/')`

  **Must NOT do**:
  - Do NOT skip the membership pricing display
  - Do NOT skip the first-pickup special messaging

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Marketing-focused UI with plan cards
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/account-prompt.tsx` (archived): Full component

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Account prompt page renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/account
      2. Assert: membership plan options visible (Basic, Premium, or similar)
      3. Assert: pricing information visible ("$15", "$30" or similar)
      4. Assert: dismiss/skip option visible
      5. Screenshot: .sisyphus/evidence/task-10-account.png
    Expected Result: Account page shows membership options
    Evidence: .sisyphus/evidence/task-10-account.png

  Scenario: Dismiss returns to landing
    Tool: Playwright
    Steps:
      1. Navigate to /account
      2. Click: dismiss or "Maybe later" button
      3. Wait for: URL is "/" (timeout: 2s)
    Expected Result: Dismissing returns to landing page
    Evidence: URL captured
  ```

  **Commit**: YES
  - Message: `feat: migrate AccountPrompt page with membership options`
  - Files: `src/routes/account/+page.svelte`

---

- [ ] 11. Migrate AdminLogin Page (/admin)

  **What to do**:
  - Create `src/routes/admin/+page.svelte`
  - Implement PIN pad UI (4 digits)
  - Any 4-digit PIN logs in (mock behavior)
  - Wire successful login → `goto('/admin/dashboard')`
  - Wire back → `goto('/')`

  **Must NOT do**:
  - Do NOT implement real authentication
  - Do NOT skip the PIN pad visual feedback

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Interactive PIN pad UI
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12-15)
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/admin-login.tsx` (archived): Full component

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Admin login page renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/admin
      2. Assert: PIN pad visible (digits 0-9)
      3. Assert: PIN input display visible
      4. Assert: back button visible
      5. Screenshot: .sisyphus/evidence/task-11-admin-login.png
    Expected Result: PIN pad login interface shown
    Evidence: .sisyphus/evidence/task-11-admin-login.png

  Scenario: PIN entry navigates to dashboard
    Tool: Playwright
    Steps:
      1. Navigate to /admin
      2. Click: digit buttons to enter 4 digits (e.g., 1, 2, 3, 4)
      3. Wait for: URL is /admin/dashboard (timeout: 3s)
    Expected Result: Entering 4 digits logs in to dashboard
    Evidence: URL captured
  ```

  **Commit**: YES
  - Message: `feat: migrate AdminLogin page with PIN pad`
  - Files: `src/routes/admin/+page.svelte`

---

- [ ] 12. Migrate AdminDashboard Page (/admin/dashboard)

  **What to do**:
  - Create `src/routes/admin/dashboard/+page.svelte`
  - Convert stats grid, location caps, weekly chart, impact section
  - For the bar chart: use CSS transitions instead of motion:
    ```svelte
    <div 
      class="bg-primary transition-[height] duration-500"
      style="height: {(day.pickedUp / day.posted) * 100}%"
    />
    ```
  - Use `$effect` to trigger height animation on mount
  - Wire quick actions: New Drop → `/admin/create`, Redeem → `/admin/redeem`, No-shows → `/admin/no-shows`
  - Wire Exit → `goto('/')`

  **Must NOT do**:
  - Do NOT use a charting library (keep the simple bar chart)
  - Do NOT skip the forecast section

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex dashboard with charts and stats
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/admin-dashboard.tsx` (archived): Lines 1-370

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Admin dashboard renders all sections
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/admin/dashboard
      2. Assert: text "EcoPlate Staff" visible
      3. Assert: stats grid visible (Posted, Picked Up, Reserved, etc.)
      4. Assert: weekly chart visible (7 bars)
      5. Assert: environmental impact section visible
      6. Assert: quick action buttons visible (New Drop, Redeem, No-shows)
      7. Screenshot: .sisyphus/evidence/task-12-dashboard.png
    Expected Result: Dashboard shows all sections with data
    Evidence: .sisyphus/evidence/task-12-dashboard.png

  Scenario: Quick actions navigate correctly
    Tool: Playwright
    Steps:
      1. Navigate to /admin/dashboard
      2. Click: "New Drop" button
      3. Assert: URL is /admin/create
      4. Navigate back to /admin/dashboard
      5. Click: "Redeem" button
      6. Assert: URL is /admin/redeem
    Expected Result: Quick actions navigate to correct admin pages
    Evidence: URLs captured

  Scenario: Bar chart uses CSS transitions
    Tool: Bash
    Steps:
      1. cat src/routes/admin/dashboard/+page.svelte | grep "transition-" → Assert present
      2. cat src/routes/admin/dashboard/+page.svelte | grep "motion" → Assert NOT present
    Expected Result: Chart animations use CSS, not motion library
    Evidence: File content captured
  ```

  **Commit**: YES
  - Message: `feat: migrate AdminDashboard with stats and chart`
  - Files: `src/routes/admin/dashboard/+page.svelte`

---

- [ ] 13. Migrate AdminCreateDrop Page (/admin/create)

  **What to do**:
  - Create `src/routes/admin/create/+page.svelte`
  - Convert form with location select, box count, time pickers, price, description
  - Wire submit → store action → toast → wait 1.5s → `goto('/admin/dashboard')`
  - Wire back → `goto('/admin/dashboard')`

  **Must NOT do**:
  - Do NOT implement real form validation (keep mock behavior)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Form UI with multiple inputs
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/admin-create-drop.tsx` (archived): Full component

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Create drop form renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/admin/create
      2. Assert: form inputs visible (location, boxes, times, price)
      3. Assert: submit button visible
      4. Screenshot: .sisyphus/evidence/task-13-create.png
    Expected Result: Create form with all fields
    Evidence: .sisyphus/evidence/task-13-create.png

  Scenario: Form submission works
    Tool: Playwright
    Steps:
      1. Navigate to /admin/create
      2. Fill form fields with valid data
      3. Click: submit button
      4. Wait for: toast notification visible
      5. Wait for: URL is /admin/dashboard (timeout: 3s)
    Expected Result: Submission shows toast and navigates back
    Evidence: Screenshots captured
  ```

  **Commit**: YES
  - Message: `feat: migrate AdminCreateDrop form page`
  - Files: `src/routes/admin/create/+page.svelte`

---

- [ ] 14. Migrate AdminRedeem Page (/admin/redeem)

  **What to do**:
  - Create `src/routes/admin/redeem/+page.svelte`
  - Implement code input and validation UI
  - Show recent redemptions list
  - Wire redeem → store action → update lists
  - Wire back → `goto('/admin/dashboard')`

  **Must NOT do**:
  - Do NOT skip the expired code error handling

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Input validation UI
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/admin-redeem.tsx` (archived): Full component

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Redeem page renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/admin/redeem
      2. Assert: code input field visible
      3. Assert: recent redemptions list visible
      4. Screenshot: .sisyphus/evidence/task-14-redeem.png
    Expected Result: Redeem page with input and history
    Evidence: .sisyphus/evidence/task-14-redeem.png
  ```

  **Commit**: YES
  - Message: `feat: migrate AdminRedeem page`
  - Files: `src/routes/admin/redeem/+page.svelte`

---

- [ ] 15. Migrate AdminNoShows Page (/admin/no-shows)

  **What to do**:
  - Create `src/routes/admin/no-shows/+page.svelte`
  - Display no-show statistics and list
  - Wire back → `goto('/admin/dashboard')`

  **Must NOT do**:
  - Do NOT add complex no-show management features

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: List/table UI
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Task 4

  **References**:
  - `src/app/components/admin-no-shows.tsx` (archived): Full component

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: No-shows page renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/admin/no-shows
      2. Assert: no-shows content visible
      3. Assert: back button visible
      4. Screenshot: .sisyphus/evidence/task-15-noshows.png
    Expected Result: No-shows management page
    Evidence: .sisyphus/evidence/task-15-noshows.png
  ```

  **Commit**: YES
  - Message: `feat: migrate AdminNoShows page`
  - Files: `src/routes/admin/no-shows/+page.svelte`

---

- [ ] 16. Wire All Navigation and Guards

  **What to do**:
  - Verify all `goto()` calls are correct across all pages
  - Add guard logic for pages that require state:
    - /pickup/[id] → redirect to / if no reservation exists
    - /drop/[id]/reserve → redirect to / if drop not found
    - Admin pages → could add simple session check
  - Test all navigation paths work correctly
  - Verify View Transitions are working for page changes

  **Must NOT do**:
  - Do NOT add complex auth guards (keep mock behavior)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Verification and small fixes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 - Sequential
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 5-15

  **References**:
  - `src/app/App.tsx` (archived): Lines 302-387 - renderScreen function for routing logic

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Invalid pickup ID redirects to home
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:5173/pickup/invalid-id
      2. Wait for: URL is "/" (timeout: 3s)
    Expected Result: Invalid routes redirect gracefully
    Evidence: URL captured

  Scenario: All routes are accessible
    Tool: Bash
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 → Assert 200
      2. curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/drop/drop-1 → Assert 200
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/admin → Assert 200
    Expected Result: All routes return 200
    Evidence: Response codes captured
  ```

  **Commit**: YES
  - Message: `feat: wire navigation guards and verify all routes`
  - Files: Various route files with guard logic

---

- [ ] 17. Full Integration Tests with Playwright

  **What to do**:
  - Create Playwright test file for full user flows
  - Test complete student flow:
    1. Landing → click drop → drop detail
    2. Click reserve → reserve confirmation
    3. Click confirm → pickup code page
    4. Click picked up → rating page
    5. Click star → account prompt
    6. Dismiss → landing
  - Test complete admin flow:
    1. Landing → click Staff → admin login
    2. Enter PIN → admin dashboard
    3. Click each action button → correct page
    4. Exit → landing
  - Compare screenshots with React version if available

  **Must NOT do**:
  - Do NOT write flaky tests with hard-coded waits
  - Use proper wait conditions

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E testing requires careful setup
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation expertise

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 - Sequential
  - **Blocks**: Task 18
  - **Blocked By**: Task 16

  **References**:
  - All route files for expected behavior

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Complete student flow E2E
    Tool: Playwright
    Steps:
      1. Navigate to /
      2. Click first drop card → Assert URL /drop/*
      3. Click "Reserve My Box" → Assert URL /drop/*/reserve
      4. Click confirm button → Assert URL /pickup/*
      5. Assert 6-char code visible
      6. Click "I Picked Up My Box" → Assert URL /rating
      7. Click 4th star → Wait for "Thanks" → Assert URL /account
      8. Click dismiss → Assert URL /
      9. Screenshot at each step
    Expected Result: Complete flow works without errors
    Evidence: .sisyphus/evidence/task-17-student-flow/*.png

  Scenario: Complete admin flow E2E
    Tool: Playwright
    Steps:
      1. Navigate to /
      2. Click "Staff" → Assert URL /admin
      3. Enter 4-digit PIN → Assert URL /admin/dashboard
      4. Click "New Drop" → Assert URL /admin/create
      5. Navigate back → Click "Redeem" → Assert URL /admin/redeem
      6. Navigate back → Click "No-shows" → Assert URL /admin/no-shows
      7. Navigate to /admin/dashboard → Click "Exit" → Assert URL /
    Expected Result: Admin flow works without errors
    Evidence: .sisyphus/evidence/task-17-admin-flow/*.png
  ```

  **Commit**: YES
  - Message: `test: add Playwright E2E tests for student and admin flows`
  - Files: `tests/e2e/*.spec.ts`, `playwright.config.ts`

---

- [ ] 18. Write Component Tests with Vitest

  **What to do**:
  - Install testing dependencies: `npm install -D vitest @testing-library/svelte jsdom`
  - Configure Vitest in vite.config.ts
  - Write tests for:
    - `$lib/types.ts`: generatePickupCode (returns 6 chars, no ambiguous chars), formatTime (formats correctly)
    - `$lib/stores/app.svelte.ts`: state mutations work correctly
    - Key components: DropCard renders with props, renders correct status badges
  - Ensure all tests pass

  **Must NOT do**:
  - Do NOT write tests for every component (focus on critical paths)
  - Do NOT test DaisyUI components themselves

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard unit testing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 - Sequential
  - **Blocks**: Task 19
  - **Blocked By**: Task 17

  **References**:
  - `$lib/types.ts`, `$lib/stores/app.svelte.ts`, `$lib/components/DropCard.svelte`
  - Vitest docs: https://vitest.dev/

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Unit tests pass
    Tool: Bash
    Steps:
      1. npm test → Assert exit code 0
      2. npm test -- --reporter=verbose → Assert all tests listed as passing
    Expected Result: All tests pass
    Evidence: Test output captured

  Scenario: Test files exist
    Tool: Bash
    Steps:
      1. ls src/lib/*.test.ts → Assert at least 1 file exists
      2. cat src/lib/types.test.ts | grep "generatePickupCode" → Assert test exists
      3. cat src/lib/types.test.ts | grep "formatTime" → Assert test exists
    Expected Result: Required test files created
    Evidence: File listings captured
  ```

  **Commit**: YES
  - Message: `test: add Vitest unit tests for types, stores, and components`
  - Files: `src/lib/*.test.ts`, `vite.config.ts`

---

- [ ] 19. Final Build Verification and Cleanup

  **What to do**:
  - Run `npm run build` and verify zero errors
  - Run `npm run preview` and verify app works in production mode
  - Clean up any console.log statements
  - Verify no TypeScript errors: `npx tsc --noEmit`
  - Delete .archive/react-src/ if conversion is successful (optional, confirm with user)
  - Update README.md with new tech stack and run instructions

  **Must NOT do**:
  - Do NOT delete archive without confirmation
  - Do NOT skip the production build test

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Final verification steps
  - **Skills**: [`git-master`]
    - `git-master`: May need final commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 - Final
  - **Blocks**: None (final)
  - **Blocked By**: Task 18

  **References**:
  - SvelteKit build docs: https://svelte.dev/docs/kit/building-your-app

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Production build succeeds
    Tool: Bash
    Steps:
      1. npm run build → Assert exit code 0
      2. npm run build 2>&1 | grep -i error → Assert no matches
      3. npm run build 2>&1 | grep -i warning → Capture (warnings OK but note them)
      4. ls build/ OR ls .svelte-kit/output/ → Assert build output exists
    Expected Result: Build completes without errors
    Evidence: Build output captured

  Scenario: Preview server works
    Tool: Bash
    Steps:
      1. npm run preview & sleep 3
      2. curl -s http://localhost:4173 → Assert HTML response
      3. kill %1
    Expected Result: Production preview serves correctly
    Evidence: Response captured

  Scenario: No TypeScript errors
    Tool: Bash
    Steps:
      1. npx tsc --noEmit → Assert exit code 0
    Expected Result: Type checking passes
    Evidence: Output captured

  Scenario: No console.log pollution
    Tool: Bash
    Steps:
      1. grep -r "console.log" src/routes/ src/lib/ | grep -v ".test." | wc -l → Assert 0 or minimal
    Expected Result: No debug logs in production code
    Evidence: Count captured
  ```

  **Commit**: YES
  - Message: `chore: final build verification and README update`
  - Files: `README.md`, any cleanup fixes

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore: scaffold SvelteKit project, archive React source` | package.json, svelte.config.js, src/, .archive/ | npm run dev |
| 2 | `feat: configure DaisyUI emerald theme with CSS variable bridge` | src/app.css, package.json | npm run build |
| 3 | `feat: migrate TypeScript types and mock data` | src/lib/types.ts, src/lib/data.ts | npx tsc --noEmit |
| 4 | `feat: create centralized state store and root layout` | src/lib/stores/, src/routes/+layout.svelte | npm run dev |
| 5 | `feat: migrate StudentLanding page with DropCard component` | src/routes/+page.svelte, src/lib/components/DropCard.svelte | npm run dev |
| 6 | `feat: migrate DropDetail page` | src/routes/drop/[id]/+page.svelte | npm run dev |
| 7 | `feat: migrate ReserveConfirm page` | src/routes/drop/[id]/reserve/+page.svelte | npm run dev |
| 8 | `feat: migrate PickupCode page` | src/routes/pickup/[id]/+page.svelte | npm run dev |
| 9 | `feat: migrate PostRating page` | src/routes/rating/+page.svelte | npm run dev |
| 10 | `feat: migrate AccountPrompt page` | src/routes/account/+page.svelte | npm run dev |
| 11 | `feat: migrate AdminLogin page` | src/routes/admin/+page.svelte | npm run dev |
| 12 | `feat: migrate AdminDashboard` | src/routes/admin/dashboard/+page.svelte | npm run dev |
| 13 | `feat: migrate AdminCreateDrop` | src/routes/admin/create/+page.svelte | npm run dev |
| 14 | `feat: migrate AdminRedeem` | src/routes/admin/redeem/+page.svelte | npm run dev |
| 15 | `feat: migrate AdminNoShows` | src/routes/admin/no-shows/+page.svelte | npm run dev |
| 16 | `feat: wire navigation guards` | Various route files | npm run dev |
| 17 | `test: add Playwright E2E tests` | tests/e2e/, playwright.config.ts | npx playwright test |
| 18 | `test: add Vitest unit tests` | src/lib/*.test.ts, vite.config.ts | npm test |
| 19 | `chore: final build verification` | README.md | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run dev          # Expected: Dev server starts at localhost:5173
npm run build        # Expected: Zero errors, build directory created
npm test             # Expected: All tests pass
npx playwright test  # Expected: All E2E tests pass
npx tsc --noEmit     # Expected: No TypeScript errors
```

### Final Checklist
- [ ] All "Must Have" present (Svelte 5 runes, SvelteKit routing, DaisyUI, transitions)
- [ ] All "Must NOT Have" absent (no motion library, no shadcn, no legacy Svelte patterns)
- [ ] All 11 routes render correctly
- [ ] Full student flow works (browse → reserve → pickup → rate → account)
- [ ] Full admin flow works (login → dashboard → actions → logout)
- [ ] Visual appearance matches React version
- [ ] All tests pass
- [ ] Production build succeeds
