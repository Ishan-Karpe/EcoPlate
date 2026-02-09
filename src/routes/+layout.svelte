<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

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
</svelte:head>

<div class="min-h-screen bg-base-200">
	{@render children()}
</div>

<Toaster richColors position="top-center" />
