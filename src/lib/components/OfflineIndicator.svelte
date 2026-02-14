<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let isOffline = $state(false);
	let showBackOnline = $state(false);
	let backOnlineTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		isOffline = !navigator.onLine;

		const handleOffline = () => {
			isOffline = true;
			showBackOnline = false;
			if (backOnlineTimeout) {
				clearTimeout(backOnlineTimeout);
				backOnlineTimeout = null;
			}
		};

		const handleOnline = () => {
			isOffline = false;
			showBackOnline = true;
			if (backOnlineTimeout) clearTimeout(backOnlineTimeout);
			backOnlineTimeout = setTimeout(() => {
				showBackOnline = false;
				backOnlineTimeout = null;
			}, 2200);
		};

		window.addEventListener('offline', handleOffline);
		window.addEventListener('online', handleOnline);

		return () => {
			window.removeEventListener('offline', handleOffline);
			window.removeEventListener('online', handleOnline);
			if (backOnlineTimeout) clearTimeout(backOnlineTimeout);
		};
	});
</script>

{#if isOffline}
	<div in:fade={{ duration: 200 }} class="fixed left-3 right-3 top-3 z-[65] mx-auto max-w-md">
		<div class="alert alert-warning text-sm">
			<span>You're offline — showing cached data</span>
		</div>
	</div>
{:else if showBackOnline}
	<div in:fade={{ duration: 200 }} class="fixed left-3 right-3 top-3 z-[65] mx-auto max-w-md">
		<div class="alert alert-success text-sm">
			<span>Back online!</span>
		</div>
	</div>
{/if}
