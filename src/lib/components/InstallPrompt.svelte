<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { appState } from '$lib/stores/app.svelte';

	interface DeferredInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	}

	const DISMISS_KEY = 'ecoplate-install-dismissed-until';
	const INSTALLED_KEY = 'ecoplate-installed';
	const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

	let deferredPrompt: DeferredInstallPromptEvent | null = null;
	let isInstalled = $state(false);
	let dismissUntil = $state(0);

	const canShowPrompt = $derived(
		Boolean(deferredPrompt) &&
			appState.hasCompletedFirstPickup &&
			!isInstalled &&
			Date.now() > dismissUntil
	);

	function dismissPrompt() {
		const nextDismissUntil = Date.now() + DISMISS_DURATION_MS;
		dismissUntil = nextDismissUntil;
		localStorage.setItem(DISMISS_KEY, String(nextDismissUntil));
		deferredPrompt = null;
	}

	async function installApp() {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();
		const choice = await deferredPrompt.userChoice;

		if (choice.outcome === 'accepted') {
			isInstalled = true;
			localStorage.setItem(INSTALLED_KEY, 'true');
		} else {
			dismissPrompt();
		}
	}

	onMount(() => {
		const storedDismissUntil = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
		dismissUntil = Number.isFinite(storedDismissUntil) ? storedDismissUntil : 0;
		isInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			deferredPrompt = event as DeferredInstallPromptEvent;
		};

		const handleInstalled = () => {
			isInstalled = true;
			deferredPrompt = null;
			localStorage.setItem(INSTALLED_KEY, 'true');
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			window.removeEventListener('appinstalled', handleInstalled);
		};
	});
</script>

{#if canShowPrompt}
	<div
		in:fly={{ y: 16, duration: 250 }}
		class="fixed bottom-20 left-3 right-3 z-[55] mx-auto max-w-md"
	>
		<div class="card border border-primary/30 bg-base-100 shadow-lg">
			<div class="card-body p-4">
				<p class="text-sm font-semibold">Add EcoPlate to Home Screen</p>
				<p class="text-xs text-base-content/70">Get faster access and offline support on campus.</p>
				<div class="card-actions justify-end">
					<button type="button" class="btn btn-ghost btn-sm" onclick={dismissPrompt}>Maybe Later</button>
					<button type="button" class="btn btn-primary btn-sm" onclick={installApp}>Install</button>
				</div>
			</div>
		</div>
	</div>
{/if}
