<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, Bell, ChevronRight, Clock, MapPin, Package, ShieldCheck } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { formatTime } from '$lib/types';

	const dropId = $derived(page.params.id);
	const drop = $derived(dropId ? appState.getDropById(dropId) : undefined);

	$effect(() => {
		if (!drop) {
			goto('/');
		} else {
			appState.selectDrop(drop);
		}
	});

	const soldOut = $derived(drop ? drop.remainingBoxes === 0 : false);
	const upcoming = $derived(drop ? drop.status === 'upcoming' : false);
	const urgency = $derived(drop ? !soldOut && !upcoming && drop.remainingBoxes <= 5 : false);

	let progressWidth = $state(0);

	$effect(() => {
		if (drop && !upcoming) {
			setTimeout(() => {
				progressWidth = (drop.reservedBoxes / drop.totalBoxes) * 100;
			}, 200);
		}
	});

	function handleReserve() {
		goto(`/drop/${dropId}/reserve`);
	}

	function handleJoinWaitlist() {
		goto('/');
	}

	function handleBack() {
		goto('/');
	}
</script>

{#if drop}
	<div class="min-h-screen bg-base-200 flex flex-col">
		<div class="px-5 pt-12 pb-2 max-w-4xl mx-auto w-full">
			<button
				onclick={handleBack}
				class="flex items-center gap-1 text-base-content/60 text-[0.875rem] mb-3"
			>
				<ArrowLeft class="w-4 h-4" />
				All drops
			</button>
		</div>

		<div class="flex-1 px-5 py-2 overflow-y-auto pb-4 max-w-4xl mx-auto w-full">
			<div class="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
				<div
					in:fly={{ y: 15, duration: 300 }}
					class="h-40 lg:h-64 rounded-2xl relative flex items-center justify-center {soldOut
						? 'bg-gray-100'
						: upcoming
							? 'bg-gradient-to-br from-blue-50 to-indigo-100'
							: 'bg-gradient-to-br from-green-50 to-emerald-100'}"
				>
				<div class="text-center">
					<div class="text-[3rem] mb-1">{drop.emoji}</div>
					<p
						class="text-[0.8rem] font-medium {soldOut
							? 'text-gray-500'
							: upcoming
								? 'text-blue-700'
								: 'text-emerald-700'}"
					>
						{soldOut ? 'All boxes claimed' : upcoming ? 'Pickup starts soon' : 'Packed fresh tonight'}
					</p>
				</div>

				{#if urgency}
					<div
						in:scale={{ duration: 300 }}
						class="absolute top-3 right-3 bg-amber-500 text-white text-[0.7rem] px-2.5 py-1 rounded-full font-semibold"
					>
						Only {drop.remainingBoxes} left!
					</div>
				{/if}
				{#if soldOut}
					<div
						class="absolute top-3 right-3 bg-gray-500 text-white text-[0.7rem] px-2.5 py-1 rounded-full font-semibold"
					>
						Sold out
					</div>
				{/if}
				{#if upcoming}
					<div
						class="absolute top-3 right-3 bg-blue-500 text-white text-[0.7rem] px-2.5 py-1 rounded-full font-semibold"
					>
						Starting soon
					</div>
				{/if}
			</div>

			<div
				in:fly={{ y: 10, delay: 100, duration: 300 }}
				class="bg-base-100 rounded-2xl border border-base-300 p-5 space-y-4"
			>
				<div>
					<h2 class="text-[1.25rem] font-bold">{drop.location}</h2>
					<p class="text-[0.875rem] text-base-content/60 mt-1 leading-relaxed">
						{drop.description}
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="flex items-start gap-2.5 bg-base-200 rounded-xl p-3">
						<MapPin class="w-4 h-4 text-primary mt-0.5 shrink-0" />
						<div>
							<p class="text-[0.8rem] font-semibold">Pickup location</p>
							<p class="text-[0.7rem] text-base-content/60">{drop.locationDetail}</p>
						</div>
					</div>
					<div class="flex items-start gap-2.5 bg-base-200 rounded-xl p-3">
						<Clock class="w-4 h-4 text-primary mt-0.5 shrink-0" />
						<div>
							<p class="text-[0.8rem] font-semibold">Pickup window</p>
							<p class="text-[0.7rem] text-base-content/60">
								{formatTime(drop.windowStart)}-{formatTime(drop.windowEnd)}
							</p>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between bg-accent/50 rounded-xl p-3">
					<div class="flex items-center gap-2">
						<Package class="w-4 h-4 text-primary" />
						<span class="text-[0.875rem] font-semibold">
							{soldOut
								? `${drop.totalBoxes} boxes (all claimed)`
								: upcoming
									? `${drop.totalBoxes} boxes available at drop`
									: `${drop.remainingBoxes} of ${drop.totalBoxes} boxes left`}
						</span>
					</div>
					<div class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[0.875rem] font-bold">
						${drop.priceMin}-${drop.priceMax}
					</div>
				</div>

				{#if !upcoming}
					<div>
						<div
							class="flex items-center justify-between text-[0.7rem] text-base-content/60 mb-1"
						>
							<span>{drop.reservedBoxes} reserved</span>
							<span>{drop.remainingBoxes} available</span>
						</div>
						<div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-[width] duration-600 {soldOut
									? 'bg-gray-400'
									: 'bg-primary'}"
								style="width: {progressWidth}%"
							></div>
						</div>
					</div>
				{/if}
			</div>
		</div>

			{#if soldOut}
				<div in:fly={{ y: 10, delay: 200, duration: 300 }} class="space-y-3">
					<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
						<p class="text-[0.875rem] text-amber-800 font-semibold">All boxes have been claimed</p>
						<p class="text-[0.8rem] text-amber-700 mt-1">
							Boxes may open up if someone cancels. Get notified!
						</p>
					</div>
					<button
						onclick={handleJoinWaitlist}
						class="w-full bg-amber-500 text-white py-3.5 rounded-2xl text-[1rem] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-semibold"
					>
						<Bell class="w-4 h-4" />
						Join Waitlist
					</button>
					<p class="text-center text-[0.7rem] text-base-content/60">
						We'll notify you if a box opens up
					</p>
				</div>
			{/if}

			{#if upcoming}
				<div
					in:fly={{ y: 10, delay: 200, duration: 300 }}
					class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"
				>
					<p class="text-[0.875rem] text-blue-800 font-semibold">
						Drop opens at {formatTime(drop.windowStart)}
					</p>
					<p class="text-[0.8rem] text-blue-700 mt-1">
						Reservations will be available when the pickup window starts.
					</p>
				</div>
			{/if}

			<div in:fade={{ delay: 300, duration: 300 }} class="flex items-center gap-2 justify-center py-1">
				<ShieldCheck class="w-4 h-4 text-primary" />
				<span class="text-[0.75rem] text-base-content/60">Food handled by campus dining staff</span>
			</div>
		</div>

		{#if !soldOut && !upcoming}
			<div in:fly={{ y: 20, delay: 200, duration: 300 }} class="px-5 pb-8 pt-3 max-w-4xl mx-auto w-full">
				<button
					onclick={handleReserve}
					class="btn btn-primary btn-lg w-full lg:w-auto lg:px-12 lg:mx-auto lg:flex shadow-lg shadow-primary/25"
				>
					Reserve My Box
					<ChevronRight class="w-5 h-5" />
				</button>
				<p class="text-center text-[0.75rem] text-base-content/60 mt-2">
					No account needed. Reserve in one tap.
				</p>
			</div>
		{/if}

		{#if upcoming}
			<div class="px-5 pb-8 pt-3 max-w-4xl mx-auto w-full">
				<button disabled class="btn btn-info btn-lg w-full lg:w-auto lg:px-12 lg:mx-auto lg:flex btn-disabled">
					Reservations open at {formatTime(drop.windowStart)}
				</button>
			</div>
		{/if}
	</div>
{/if}
