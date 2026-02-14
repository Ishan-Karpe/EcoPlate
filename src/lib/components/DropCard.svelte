<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ChevronRight, Clock, MapPin, Package } from '@lucide/svelte';
	import type { Drop } from '$lib/types';
	import { formatTime } from '$lib/types';

	interface Props {
		drop: Drop;
		onSelect: () => void;
		delay?: number;
		soldOut?: boolean;
		upcoming?: boolean;
	}

	let { drop, onSelect, delay = 0, soldOut = false, upcoming = false }: Props = $props();

	const urgency = $derived(!soldOut && !upcoming && drop.remainingBoxes <= 5);
</script>

<button
	in:fly={{ y: 10, delay, duration: 300 }}
	onclick={onSelect}
	class="card card-compact bg-base-100 shadow-sm w-full text-left active:scale-[0.98] transition-transform {soldOut
		? 'opacity-60'
		: ''}"
>
	<div class="flex items-stretch">
		<div
			class="w-20 flex items-center justify-center shrink-0 {soldOut
				? 'bg-gray-100'
				: upcoming
					? 'bg-blue-50'
					: 'bg-gradient-to-b from-green-50 to-emerald-100'}"
		>
			<span class="text-[2rem]">{drop.emoji}</span>
		</div>

		<div class="card-body p-3.5 min-w-0">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h3 class="card-title text-[0.9rem] truncate">
							{drop.location}
						</h3>
						{#if urgency}
							<span class="badge badge-warning badge-sm">{drop.remainingBoxes} left!</span>
						{/if}
						{#if soldOut}
							<span class="badge badge-ghost badge-sm">Sold out</span>
						{/if}
						{#if upcoming}
							<span class="badge badge-info badge-sm">Soon</span>
						{/if}
					</div>
					<p class="text-[0.75rem] text-base-content/60 mt-0.5 line-clamp-1">
						{drop.description}
					</p>
				</div>
				<ChevronRight class="w-4 h-4 text-base-content/60 shrink-0 mt-1" />
			</div>

			<div class="flex items-center gap-3 mt-2 text-[0.7rem] text-base-content/60">
				<span class="flex items-center gap-1">
					<Clock class="w-3 h-3" />
					{formatTime(drop.windowStart)}-{formatTime(drop.windowEnd)}
				</span>
				<span class="flex items-center gap-1">
					<MapPin class="w-3 h-3" />
					{drop.locationDetail}
				</span>
			</div>

			<div class="card-actions justify-between items-center mt-2">
				<div class="flex items-center gap-1.5">
					<Package class="w-3 h-3 text-primary" />
					<span class="text-[0.75rem] font-semibold">
						{#if soldOut}
							0 left
						{:else if upcoming}
							{drop.totalBoxes} boxes
						{:else}
							{drop.remainingBoxes} of {drop.totalBoxes} left
						{/if}
					</span>
				</div>
				<span class="badge badge-primary badge-outline font-bold">
					${drop.priceMin}-${drop.priceMax}
				</span>
			</div>
		</div>
	</div>
</button>
