<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Leaf, Clock, AlertCircle } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { formatTime } from '$lib/types';
	import type { Drop } from '$lib/types';
	import DropCard from '$lib/components/DropCard.svelte';
	import SkeletonCard from '$lib/components/SkeletonCard.svelte';

	const activeDrops = $derived(
		appState.drops.filter((d) => d.status === 'active' && d.remainingBoxes > 0)
	);
	const soldOutDrops = $derived(
		appState.drops.filter((d) => d.status === 'active' && d.remainingBoxes === 0)
	);
	const upcomingDrops = $derived(appState.drops.filter((d) => d.status === 'upcoming'));
	let loading = $state(true);

	onMount(() => {
		const timer = setTimeout(() => {
			loading = false;
		}, 500);

		return () => clearTimeout(timer);
	});

	function handleSelectDrop(drop: Drop) {
		appState.selectDrop(drop);
		goto(`/drop/${drop.id}`);
	}

	function handleAdminAccess() {
		goto('/admin');
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div
		in:fly={{ y: -20, duration: 300 }}
		class="bg-primary text-primary-content px-5 pt-12 pb-6 lg:rounded-none rounded-b-[2rem]"
	>
		<div class="max-w-6xl mx-auto">
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-2">
					<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
						<Leaf class="w-5 h-5" />
					</div>
					<span class="text-[1.25rem] lg:text-[1.5rem] tracking-tight font-bold">EcoPlate</span>
				</div>
				<button
					onclick={handleAdminAccess}
					class="btn btn-ghost btn-sm text-white/60 border border-white/20"
				>
					Staff
				</button>
			</div>
			<p class="text-white/80 text-[0.875rem] lg:text-[1rem] mt-2">
				Freshly rescued meals. $3-$5 dinner. Right on campus.
			</p>
			<div class="flex items-center gap-4 mt-3 text-[0.75rem] lg:text-[0.875rem] text-white/60">
				<span>&#127793; 357 meals rescued</span>
				<span>&#183;</span>
				<span>&#11088; 4.3 avg rating</span>
			</div>
		</div>
	</div>

	<div class="flex-1 px-5 py-5 space-y-5 overflow-y-auto pb-8 max-w-6xl mx-auto w-full">
		{#if loading}
			<div in:fade={{ duration: 250 }}>
				<div class="flex items-center gap-2 mb-3">
					<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
					<span class="text-[0.8rem] text-primary font-semibold tracking-wider uppercase">
						Loading drops...
					</span>
				</div>
				<SkeletonCard count={3} />
			</div>
		{:else if activeDrops.length > 0}
			<div in:fly={{ y: 15, delay: 100, duration: 300 }}>
				<div class="flex items-center gap-2 mb-3">
					<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
					<span class="text-[0.8rem] text-primary font-semibold tracking-wider uppercase">
						Available now ({activeDrops.length})
					</span>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each activeDrops as drop, i (drop.id)}
						<DropCard {drop} onSelect={() => handleSelectDrop(drop)} delay={150 + i * 70} />
					{/each}
				</div>
			</div>
		{/if}

		{#if upcomingDrops.length > 0}
			<div in:fly={{ y: 15, delay: 300, duration: 300 }}>
				<div class="flex items-center gap-2 mb-3">
					<Clock class="w-3.5 h-3.5 text-blue-500" />
					<span class="text-[0.8rem] text-blue-600 font-semibold tracking-wider uppercase">
						Starting soon ({upcomingDrops.length})
					</span>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each upcomingDrops as drop, i (drop.id)}
						<DropCard
							{drop}
							onSelect={() => handleSelectDrop(drop)}
							delay={350 + i * 70}
							upcoming
						/>
					{/each}
				</div>
			</div>
		{/if}

		{#if soldOutDrops.length > 0}
			<div in:fly={{ y: 15, delay: 450, duration: 300 }}>
				<div class="flex items-center gap-2 mb-3">
					<AlertCircle class="w-3.5 h-3.5 text-base-content/60" />
					<span class="text-[0.8rem] text-base-content/60 font-semibold tracking-wider uppercase">
						Sold out ({soldOutDrops.length})
					</span>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each soldOutDrops as drop, i (drop.id)}
						<DropCard
							{drop}
							onSelect={() => handleSelectDrop(drop)}
							delay={500 + i * 70}
							soldOut
						/>
					{/each}
				</div>
			</div>
		{/if}

		{#if appState.drops.length === 0}
			<div in:fade={{ duration: 300 }} class="text-center py-16">
				<div class="text-[3rem] mb-3">&#127769;</div>
				<p class="text-[1rem] font-semibold">No drops tonight</p>
				<p class="text-[0.875rem] text-base-content/60 mt-1">
					Check back tomorrow for fresh Rescue Boxes!
				</p>
			</div>
		{/if}

		<div in:fade={{ delay: 600, duration: 300 }} class="text-center pt-2 pb-4">
			<p class="text-[0.75rem] text-base-content/60">
				No account needed to reserve. Just tap and go.
			</p>
		</div>
	</div>
</div>
