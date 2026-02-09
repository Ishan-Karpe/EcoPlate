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

