# Draft: React to Svelte 5 Conversion

## Requirements (confirmed)
- **Framework**: Svelte 5 + SvelteKit (latest versions)
- **Component Library**: DaisyUI (replacing shadcn/ui)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (Motion for Svelte)
- **Goal**: Perfect translation of existing UI with minimal differences and no errors

## Source Codebase Analysis
- **Current Stack**: React 18 + Vite + TypeScript + shadcn/ui + Tailwind + Framer Motion
- **Components to migrate**: 
  - 4 main screens: StudentLanding, DropDetail, ReserveConfirm, PickupCode
  - Supporting screens: PostRating, AccountPrompt, AdminLogin, AdminDashboard, AdminCreateDrop, AdminRedeem, AdminNoShows
  - 40+ shadcn/ui components in `src/app/components/ui/`
  - Types file: ecoplate-types.ts
- **State Management**: Local useState in App.tsx, prop drilling
- **Routing**: Screen-state based (`screen` state variable), no router
- **Mock Data**: In-memory, no backend

## Technical Decisions
- Types (ecoplate-types.ts): Copy over as-is
- Tailwind classes: Identical, no changes needed
- Icons: lucide-react → lucide-svelte
- Toasts: sonner → svelte-sonner

## Decisions Made
- **Routing**: SvelteKit file-based routing (proper routes like /drop/[id], /admin/dashboard)
- **Test strategy**: Basic component tests after conversion (Vitest + Testing Library)
- **DaisyUI theme**: emerald (green - matches sustainability branding)
- **File structure**: SvelteKit conventions (src/routes/, src/lib/components/)
- **Animation strategy**: Svelte built-in transitions (fly, fade, scale) + View Transitions API - NO motion library
- **CSS tokens**: DaisyUI emerald theme + CSS variable bridge (shadcn tokens aliased to DaisyUI equivalents)
- **Project structure**: Replace React in-place (delete src/, replace package.json)

## Metis Findings (Critical)
- 50 shadcn/ui components are DEAD CODE (none imported by screens) - do NOT migrate
- Motion/Framer Motion has NO Svelte bindings - using native Svelte transitions instead
- Custom theme.css defines exact color values - will map to DaisyUI via CSS bridge
- Only 1 shared child component (DropCard) - rest are self-contained screens
- 141 motion usages but only 3 patterns: enter animations, progress bars, gesture animations
- Use @lucide/svelte (NOT lucide-svelte) for Svelte 5 compatibility

## Scope Boundaries
- INCLUDE: All screens, all functionality, all animations
- EXCLUDE: Backend integration (staying mock data)
