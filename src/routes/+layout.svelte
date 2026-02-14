<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ReloadPrompt from '$lib/components/ReloadPrompt.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();
	const pathname = $derived(page.url.pathname);
	const isAdminRoute = $derived(pathname.startsWith('/admin'));

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html pwaInfo ? pwaInfo.webManifest.linkTag : ''}
</svelte:head>

<div class="fixed right-3 top-3 z-[60]">
	<ThemeToggle />
</div>

<div class="min-h-screen bg-base-200 {!isAdminRoute ? 'pb-16 lg:pb-0' : ''}">
	{@render children()}
</div>

<Toaster richColors position="top-center" />
<ReloadPrompt />

{#if !isAdminRoute}
	<OfflineIndicator />
	<InstallPrompt />
	<BottomNav />
{/if}
