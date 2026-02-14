<script lang="ts">
	import { browser } from '$app/environment';
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { appState } from '$lib/stores/app.svelte';

	type ThemePreference = 'light' | 'dark' | 'system';

	const themeOrder: ThemePreference[] = ['light', 'dark', 'system'];
	let systemPrefersDark = $state(false);

	const currentTheme = $derived(appState.theme);
	const resolvedTheme = $derived(
		currentTheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : currentTheme
	);

	function applyTheme(theme: 'light' | 'dark') {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', theme);
	}

	function cycleTheme() {
		const currentIndex = themeOrder.indexOf(appState.theme);
		const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
		appState.theme = nextTheme;
	}

	onMount(() => {
		if (!browser) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const syncSystemPreference = () => {
			systemPrefersDark = mediaQuery.matches;
		};

		syncSystemPreference();

		if (typeof mediaQuery.addEventListener === 'function') {
			mediaQuery.addEventListener('change', syncSystemPreference);
		} else {
			mediaQuery.addListener(syncSystemPreference);
		}

		return () => {
			if (typeof mediaQuery.removeEventListener === 'function') {
				mediaQuery.removeEventListener('change', syncSystemPreference);
			} else {
				mediaQuery.removeListener(syncSystemPreference);
			}
		};
	});

	$effect(() => {
		applyTheme(resolvedTheme);
	});
</script>

<button
	type="button"
	class="btn btn-ghost btn-sm gap-2"
	onclick={cycleTheme}
	aria-label="Toggle theme"
	title={`Theme: ${currentTheme}`}
>
	{#if currentTheme === 'dark'}
		<Moon class="h-4 w-4" />
		<span class="text-xs">Dark</span>
	{:else if currentTheme === 'system'}
		<Sun class="h-4 w-4" />
		<span class="text-xs">System</span>
	{:else}
		<Sun class="h-4 w-4" />
		<span class="text-xs">Light</span>
	{/if}
</button>
