# Learnings - React to Svelte Conversion

This file accumulates conventions, patterns, and wisdom discovered during the conversion.

---

## Task 1: SvelteKit Scaffolding - Completed

### SvelteKit Version & Setup
- **SvelteKit Version**: 2.50.2 (latest stable)
- **Svelte Version**: 5.x (latest)
- **TypeScript**: 5.9.3 (included by default)
- **Adapter**: @sveltejs/adapter-auto (default, suitable for deployment flexibility)

### Scaffolding Command
```bash
npx sv create . --template minimal --types ts --no-add-ons --no-dir-check --no-download-check
```

**Key Flags Used:**
- `--template minimal`: Minimal starter template (no demo code)
- `--types ts`: TypeScript support
- `--no-add-ons`: Skips ESLint, Prettier, Vitest, Playwright prompts
- `--no-dir-check`: Allows scaffolding in non-empty directory
- `--no-download-check`: Skips download confirmation prompts

### Project Structure Created
```
src/
├── routes/
│   ├── +layout.svelte    (Root layout)
│   └── +page.svelte      (Home page)
├── lib/
│   ├── assets/
│   │   └── favicon.svg
│   └── index.ts          (Lib exports)
├── app.d.ts              (Type definitions)
└── app.html              (HTML template)

static/
└── robots.txt

svelte.config.js          (SvelteKit config)
vite.config.ts            (Vite config)
tsconfig.json             (TypeScript config)
```

### Important Observations
1. **No Tailwind CSS v4 in minimal template**: The `sv create` command with `--no-add-ons` does NOT include Tailwind CSS. This must be added manually in Task 2.
2. **Git Tracking**: React source files were correctly tracked as renames to `.archive/react-src/` by git, preserving history.
3. **Dev Server**: `npm run dev` starts successfully on localhost:5173 with hot module reloading.
4. **Package.json**: Automatically updated with SvelteKit dependencies, no manual edits needed.

### Tailwind CSS v4 Setup (Next Task)
- Will need to install `tailwindcss@4.1.12` and `@tailwindcss/vite@4.1.12`
- Configure in `svelte.config.js` and `vite.config.ts`
- Create `tailwind.config.ts` and `app.css` with Tailwind directives

### Lessons for Future Tasks
- The `sv create` CLI is the recommended way to scaffold SvelteKit projects
- Minimal template is ideal for custom setups (like DaisyUI instead of shadcn/ui)
- TypeScript is included by default and properly configured
- The project is immediately runnable after scaffolding


## Task 3: TypeScript Types & Mock Data Migration - Completed

### Files Created
- **src/lib/types.ts**: All 7 interfaces + 2 utility functions
- **src/lib/data.ts**: 3 mock data constants with proper type imports

### Key Decisions
1. **Screen Type Removal**: Removed the `Screen` type union (14 screen variants) as SvelteKit uses file-based routing instead of screen state management
2. **Separate Data File**: Moved mock data to `data.ts` to keep types clean and allow independent updates
3. **Type Imports**: Used `import type { ... }` in data.ts to avoid circular dependencies and reduce bundle size

### Interfaces Migrated (7 total)
- Drop (16 properties including status, pricing, capacity)
- Reservation (6 properties including pickup code and payment method)
- WaitlistEntry (4 properties)
- UserState (6 properties including membership reference)
- Membership (5 properties)
- LocationCap (3 properties)
- AdminStats (9 properties including nested recentDrops array)

### Utility Functions Migrated (2 total)
- `generatePickupCode()`: Creates 6-character alphanumeric codes (excludes I, O, L for clarity)
- `formatTime()`: Converts 24-hour format (HH:MM) to 12-hour AM/PM format

### Mock Data Constants (3 total)
- **MOCK_DROPS**: 4 dining location drops with varying availability (12, 3, 0, 30 remaining boxes)
- **MOCK_USER**: First-time user with no account, no membership, no credits
- **MOCK_STATS**: 14 total drops, 85% pickup rate, 4.3 avg rating, 7-day breakdown

### TypeScript Compilation
- Full `npx tsc --noEmit` passes with zero errors
- Config: target="esnext", lib=["esnext", "DOM", "DOM.Iterable"]
- No type errors despite padStart() usage (properly supported in esnext target)

### Observations for Future Tasks
1. **Type Safety**: All mock data is properly typed - no `any` types used
2. **Naming Conventions**: Consistent UPPER_CASE for constants, camelCase for functions
3. **Import Pattern**: data.ts uses `import type` to avoid runtime dependencies on types
4. **Reusability**: Types are ready for store creation (Task 4) and component usage (Tasks 5+)


## Task 4: Centralized State Store with Svelte 5 Runes - Completed

### State Store Architecture
- **File**: `src/lib/stores/app.svelte.ts`
- **Pattern**: Module-level $state runes with exported object interface
- **State Variables**: 8 reactive variables (drops, selectedDrop, reservation, user, validCodes, expiredCodes, recentRedemptions, stats)

### Svelte 5 Runes Pattern
```typescript
// Module-level $state declarations
let drops = $state<Drop[]>(MOCK_DROPS);
let selectedDrop = $state<Drop | null>(null);
// ... more state variables

// Exported object with getters and methods
export const appState = {
  get drops() { return drops; },
  selectDrop(drop: Drop) { selectedDrop = drop; },
  // ... more getters and methods
};
```

### Key Implementation Details
1. **No Svelte 4 Patterns**: Zero usage of `writable()`, `derived()`, or `$:` reactive declarations
2. **Getters for State Access**: All state variables exposed via getter functions for proper reactivity tracking
3. **Direct Mutation in Methods**: Methods directly mutate module-level $state variables (reactive by default)
4. **Toast Integration**: Import `toast` from `svelte-sonner` for user feedback (joinWaitlist, cancelReservation, signUp)
5. **Type Safety**: All state variables and methods are fully typed with TypeScript

### Action Methods Ported (14 total)
**Student Flow (10 methods)**:
- `selectDrop()`: Set selected drop for detail view
- `clearSelectedDrop()`: Clear selection
- `joinWaitlist()`: Add to waitlist with toast notification
- `confirmReservation()`: Create reservation, generate pickup code, update inventory
- `cancelReservation()`: Release box, expire code, refund credit, show toast
- `markPickedUp()`: Update reservation status to picked_up
- `submitRating()`: Store rating and increment pickup count
- `skipRating()`: Skip rating, just increment pickups
- `signUp()`: Create account with membership plan, show toast
- `dismissAccount()`: Mark user as not first-time

**Admin Flow (4 methods)**:
- `createDrop()`: Add new drop with random emoji, update stats
- `redeemCode()`: Mark code as redeemed, add to recent redemptions, update stats
- `getDropById()`: Find drop by ID (utility)
- `isValidCode()` / `isExpiredCode()`: Code validation utilities

### Root Layout Enhancements
- **Container**: `max-w-md mx-auto` for mobile-first centered layout
- **Toaster**: svelte-sonner component with richColors and top-center position
- **View Transitions API**: Native page transition animations via `onNavigate` hook
- **Theme**: Preserved existing emerald theme and app.css import

### Dependencies Verified
- ✅ `svelte-sonner@1.0.7`: Toast notifications
- ✅ `@lucide/svelte@0.563.1`: Icon library (for future components)

### TypeScript Compilation
- Full `npx tsc --noEmit` passes with zero errors
- All state variables and methods properly typed
- No `any` types used

### Observations for Future Tasks
1. **Store Import Pattern**: Components will import `{ appState }` from `$lib/stores/app.svelte`
2. **Reactivity**: Accessing state via getters (e.g., `appState.drops`) automatically subscribes to changes
3. **Method Calls**: Components call methods directly (e.g., `appState.selectDrop(drop)`)
4. **No Screen State**: SvelteKit routing eliminates need for React's screen state management
5. **Toast Position**: Toaster already in root layout, components just call `toast.success()`

### Differences from React Version
1. **No useCallback**: Svelte doesn't need memoization for event handlers
2. **No useState**: Replaced with $state runes (more ergonomic)
3. **No Context Provider**: Module-level state is globally accessible
4. **Simpler Mutations**: Direct assignment instead of setter functions
5. **Type Inference**: TypeScript infers types from $state generics

### Lessons for Component Migration (Tasks 5-15)
1. Import appState at component top: `import { appState } from '$lib/stores/app.svelte';`
2. Access state in templates: `{#each appState.drops as drop}`
3. Call methods in event handlers: `onclick={() => appState.selectDrop(drop)}`
4. No prop drilling needed - all components can access global state
5. Toast notifications already wired up - just trigger actions


## Tasks 5-15: Component Migration - Completed

### Routes Created (11 total)
- `/` - StudentLanding with DropCard component
- `/drop/[id]` - DropDetail with availability states
- `/drop/[id]/reserve` - ReserveConfirm with payment options
- `/pickup/[id]` - PickupCode with countdown timer
- `/rating` - PostRating with star selection
- `/account` - AccountPrompt with membership plans
- `/admin` - AdminLogin with PIN pad
- `/admin/dashboard` - AdminDashboard with stats and chart
- `/admin/create` - AdminCreateDrop form
- `/admin/redeem` - AdminRedeem code input
- `/admin/no-shows` - AdminNoShows management

### Svelte 5 Patterns Used
1. **$props()**: `let { drop, onSelect }: Props = $props()`
2. **$derived()**: `const soldOut = $derived(drop.remainingBoxes === 0)`
3. **$effect()**: Timer intervals, navigation guards
4. **$state()**: Local component state (e.g., `let copied = $state(false)`)

### DaisyUI Components Used
- `btn` variants: btn-primary, btn-ghost, btn-lg, btn-block, btn-error
- `card` structure: card, card-body, card-title, card-actions
- `badge` variants: badge-warning, badge-info, badge-ghost, badge-primary
- `input`: input, input-bordered
- `loading`: loading-spinner

### Animation Patterns (Svelte transitions replacing Framer Motion)
```svelte
import { fly, fade, scale } from 'svelte/transition';
<div in:fly={{ y: 10, delay: 150, duration: 300 }}>
<div in:scale={{ duration: 300 }}>
```

### Navigation Guards Pattern
```svelte
$effect(() => {
  if (!drop) {
    goto('/');
  }
});
```

## Tasks 16-19: Integration & Testing - Completed

### Playwright E2E Tests
- `tests/e2e/app.spec.ts`: Student flow, admin flow, navigation guards
- Configuration in `playwright.config.ts`

### Vitest Unit Tests
- `src/lib/types.test.ts`: 10 tests for generatePickupCode and formatTime
- Configuration added to `vite.config.ts`

### Test Scripts
```json
"test": "vitest run",
"test:e2e": "playwright test",
"test:unit": "vitest run"
```

### Final Verification
- Build: `bun run build` passes
- Unit tests: 10/10 pass
- No console.log in production code

## Color Scheme
Original React colors restored:
- Primary: `#16a34a` (emerald green)
- Background: `#f8faf8` (light greenish white)
- Accent: `#dcfce7` (light green)

## Key Lessons
1. Use `data-theme="light"` with custom CSS variables to override DaisyUI theme
2. DaisyUI v5 requires `@plugin "daisyui"` syntax for Tailwind v4
3. Svelte 5 `$effect()` replaces React's useEffect for side effects
4. Navigation guards use $effect with goto() for redirects
5. Props in Svelte 5: `$props()` replaces `export let`
