<script lang="ts">
	import { onMount } from 'svelte';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { toast } from 'svelte-sonner';

	let shownUpdateToast = false;
	let shownOfflineToast = false;

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		immediate: true,
		onRegisteredSW(swUrl, registration) {
			// Service worker registered successfully
		}
	});

	onMount(() => {
		const unsubscribeNeedRefresh = needRefresh.subscribe((value) => {
			if (value && !shownUpdateToast) {
				shownUpdateToast = true;
				toast.info('A new EcoPlate version is ready.', {
					action: {
						label: 'Reload',
						onClick: () => updateServiceWorker(true)
					}
				});
			}
		});

		const unsubscribeOfflineReady = offlineReady.subscribe((value) => {
			if (value && !shownOfflineToast) {
				shownOfflineToast = true;
				toast.success('EcoPlate is ready for offline use.');
			}
		});

		return () => {
			unsubscribeNeedRefresh();
			unsubscribeOfflineReady();
		};
	});
</script>

<span class="hidden" aria-hidden="true"></span>
