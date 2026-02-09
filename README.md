# EcoPlate

Campus food rescue app prototype built with SvelteKit, Svelte 5, DaisyUI, and Tailwind CSS.

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Styling**: Tailwind CSS v4 + DaisyUI v5 (Emerald theme)
- **Icons**: @lucide/svelte
- **Notifications**: svelte-sonner
- **Testing**: Vitest (unit) + Playwright (E2E)

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Testing

```bash
# Run unit tests
bun run test

# Run E2E tests (requires dev server or starts one)
bun run test:e2e
```

## Project Structure

```
src/
├── app.css                    # Tailwind + DaisyUI config
├── app.html                   # HTML template (emerald theme)
├── lib/
│   ├── types.ts               # TypeScript interfaces
│   ├── data.ts                # Mock data (MOCK_DROPS, MOCK_USER, MOCK_STATS)
│   ├── stores/
│   │   └── app.svelte.ts      # Centralized Svelte 5 runes store
│   └── components/
│       └── DropCard.svelte    # Reusable drop card component
└── routes/
    ├── +layout.svelte         # App shell with Toaster
    ├── +page.svelte           # Student landing (/)
    ├── account/               # Account prompt (/account)
    ├── rating/                # Post-pickup rating (/rating)
    ├── drop/[id]/             # Drop detail (/drop/[id])
    │   └── reserve/           # Reserve confirmation (/drop/[id]/reserve)
    ├── pickup/[id]/           # Pickup code (/pickup/[id])
    └── admin/
        ├── +page.svelte       # Admin PIN login (/admin)
        ├── dashboard/         # Admin dashboard (/admin/dashboard)
        ├── create/            # Create new drop (/admin/create)
        ├── redeem/            # Redeem pickup codes (/admin/redeem)
        └── no-shows/          # No-show management (/admin/no-shows)
```

## Features

### Student Flow
1. Browse available food drops
2. View drop details and availability
3. Reserve a box with payment options
4. Get a 6-digit pickup code
5. Rate experience after pickup
6. Optional membership signup

### Admin Flow
1. PIN-based staff login
2. Dashboard with stats and weekly chart
3. Create new drops
4. Redeem pickup codes
5. Manage no-shows

## Development Notes

- Uses Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- Native Svelte transitions (fly, fade, scale) for animations
- DaisyUI components with Tailwind utility classes
- Mock data for all features (no backend required)
- Mobile-first responsive design (max-w-md centered)
