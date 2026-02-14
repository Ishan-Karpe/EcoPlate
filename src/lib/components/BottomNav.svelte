<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Home, Ticket, TrendingUp, User } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';

	const pathname = $derived(page.url.pathname);
	const pickupHref = $derived(appState.reservation ? `/pickup/${appState.reservation.id}` : '/');

	const dropsActive = $derived(pathname === '/');
	const pickupActive = $derived(pathname.startsWith('/pickup'));
	const impactActive = $derived(pathname === '/impact');
	const profileActive = $derived(pathname === '/profile');
</script>

<nav class="btm-nav fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100 lg:hidden" style="padding-bottom: env(safe-area-inset-bottom);">
	<button class:text-primary={dropsActive} aria-label="Drops" onclick={() => goto('/')}>
		<Home class="h-5 w-5" />
		<span class="btm-nav-label">Drops</span>
	</button>

	<button
		class:text-primary={pickupActive}
		aria-label="My Pickup"
		onclick={() => goto(pickupHref)}
	>
		<Ticket class="h-5 w-5" />
		<span class="btm-nav-label">My Pickup</span>
	</button>

	<button class:text-primary={impactActive} aria-label="Impact" onclick={() => goto('/impact')}>
		<TrendingUp class="h-5 w-5" />
		<span class="btm-nav-label">Impact</span>
	</button>

	<button class:text-primary={profileActive} aria-label="Profile" onclick={() => goto('/profile')}>
		<User class="h-5 w-5" />
		<span class="btm-nav-label">Profile</span>
	</button>
</nav>
