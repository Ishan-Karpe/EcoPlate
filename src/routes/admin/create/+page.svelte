<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		Package,
		MapPin,
		Clock,
		DollarSign,
		Sparkles,
		CheckCircle2,
		AlertTriangle,
		ArrowUpRight
	} from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { toast } from 'svelte-sonner';

	const stats = $derived(appState.stats);

	let location = $state('North Dining Hall');
	let boxes = $state('30');
	let windowStart = $state('20:30');
	let windowEnd = $state('22:00');
	let price = $state('3-5');
	let description = $state('');
	let submitted = $state(false);

	const currentCap = $derived(stats.locationCaps.find((c) => c.location === location));
	const capLimit = $derived(currentCap?.currentCap ?? 30);
	const weeksAbove85 = $derived(currentCap?.consecutiveWeeksAbove85 ?? 0);
	const canIncrease = $derived(weeksAbove85 >= 2);

	const forecastSuggestion = $derived(Math.min(capLimit, Math.round(capLimit * 0.85 + 2)));
	const forecastNote = $derived(
		`Based on this week's avg pickup rate (85%), we suggest ${forecastSuggestion} boxes for ${location}.`
	);

	function handleSubmit() {
		const boxCount = Math.min(parseInt(boxes) || 1, capLimit);
		submitted = true;
		setTimeout(() => {
			appState.createDrop({
				location,
				boxes: boxCount,
				windowStart,
				windowEnd,
				price,
				description
			});
			toast.success('Drop is live!');
			goto('/admin/dashboard');
		}, 1500);
	}

	function handleBack() {
		goto('/admin/dashboard');
	}
</script>

{#if submitted}
	<div class="min-h-screen bg-base-200 flex flex-col items-center justify-center px-5">
		<div in:scale={{ duration: 300 }} class="text-center">
			<div class="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
				<CheckCircle2 class="w-10 h-10 text-primary" />
			</div>
			<h2 class="text-[1.375rem] mb-2 font-bold">Drop is live!</h2>
			<p class="text-base-content/60 text-[0.875rem]">
				{Math.min(parseInt(boxes) || 1, capLimit)} Rescue Boxes at {location}
			</p>
			<p class="text-base-content/60 text-[0.8rem] mt-1">Students can start reserving now</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-200 flex flex-col">
		<div class="px-5 pt-12 pb-4 max-w-5xl mx-auto w-full">
			<button
				onclick={handleBack}
				class="flex items-center gap-1 text-base-content/60 text-[0.875rem] mb-4"
			>
				<ArrowLeft class="w-4 h-4" />
				Dashboard
			</button>
			<h1 class="text-[1.5rem] lg:text-[1.75rem] font-bold">Create Tonight's Drop</h1>
			<p class="text-base-content/60 text-[0.875rem] lg:text-[1rem] mt-1">Set up Rescue Boxes for students</p>
		</div>

		<div class="flex-1 px-5 py-4 space-y-4 overflow-y-auto max-w-5xl mx-auto w-full">
			<div
				in:fly={{ y: 10, duration: 300 }}
				class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
			>
				<div class="flex items-center gap-2 mb-2">
					<Sparkles class="w-4 h-4 text-blue-600" />
					<span class="text-[0.8rem] text-blue-800 font-semibold">EcoPlate Forecast v0</span>
				</div>
				<p class="text-[0.8rem] text-blue-700 mb-2">{forecastNote}</p>
				<button
					onclick={() => (boxes = forecastSuggestion.toString())}
					class="bg-blue-600 text-white text-[0.75rem] px-3 py-1.5 rounded-lg active:scale-[0.98] transition-transform font-semibold"
				>
					Use suggestion: {forecastSuggestion} boxes
				</button>
			</div>

			{#if currentCap}
				<div
					in:fly={{ y: 10, delay: 50, duration: 300 }}
					class="rounded-xl p-3 flex items-start gap-2 {canIncrease
						? 'bg-green-50 border border-green-200'
						: 'bg-amber-50 border border-amber-200'}"
				>
					{#if canIncrease}
						<ArrowUpRight class="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
					{:else}
						<AlertTriangle class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
					{/if}
					<div>
						<p class="text-[0.8rem] font-semibold {canIncrease ? 'text-green-800' : 'text-amber-800'}">
							{canIncrease
								? `Cap eligible for increase! Currently ${capLimit} boxes/day.`
								: `Daily cap: ${capLimit} boxes/day for ${location}`}
						</p>
						<p class="text-[0.7rem] {canIncrease ? 'text-green-600' : 'text-amber-600'}">
							{canIncrease
								? 'Pickup rate has been above 85% for 2+ weeks. You can increase the cap by 10.'
								: `${weeksAbove85}/2 consecutive weeks above 85% needed to increase cap.`}
						</p>
					</div>
				</div>
			{/if}

			<div in:fly={{ y: 10, delay: 100, duration: 300 }} class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div class="bg-base-100 rounded-xl border border-base-300 p-4">
					<label class="flex items-center gap-2 text-[0.8rem] text-base-content/60 mb-2">
						<MapPin class="w-3.5 h-3.5" />
						Location
					</label>
					<select bind:value={location} class="select select-bordered w-full">
						{#each stats.locationCaps as cap (cap.location)}
							<option value={cap.location}>{cap.location} (cap: {cap.currentCap})</option>
						{/each}
					</select>
				</div>

				<div class="bg-base-100 rounded-xl border border-base-300 p-4">
					<label class="flex items-center gap-2 text-[0.8rem] text-base-content/60 mb-2">
						<Package class="w-3.5 h-3.5" />
						Number of Rescue Boxes
					</label>
					<div class="flex items-center gap-3">
						<button
							onclick={() => (boxes = Math.max(1, parseInt(boxes) - 5).toString())}
							class="btn btn-square btn-ghost text-[1.25rem]"
						>
							-
						</button>
						<input
							type="number"
							bind:value={boxes}
							oninput={(e) => {
								const val = Math.min(parseInt(e.currentTarget.value) || 0, capLimit);
								boxes = val.toString();
							}}
							class="input input-bordered flex-1 text-center text-[1.25rem] font-bold"
						/>
						<button
							onclick={() => (boxes = Math.min(capLimit, parseInt(boxes) + 5).toString())}
							class="btn btn-square btn-ghost text-[1.25rem]"
						>
							+
						</button>
					</div>
					<div class="flex items-center justify-between mt-2">
						<p class="text-[0.7rem] text-base-content/60">
							Max: {capLimit} boxes/day for this location
						</p>
						{#if parseInt(boxes) >= capLimit}
							<p class="text-[0.7rem] text-amber-600 font-medium">At cap limit</p>
						{/if}
					</div>
				</div>

				<div class="bg-base-100 rounded-xl border border-base-300 p-4">
					<label class="flex items-center gap-2 text-[0.8rem] text-base-content/60 mb-2">
						<Clock class="w-3.5 h-3.5" />
						Pickup Window (90 min)
					</label>
					<div class="flex items-center gap-2">
						<input type="time" bind:value={windowStart} class="input input-bordered flex-1" />
						<span class="text-base-content/60">to</span>
						<input type="time" bind:value={windowEnd} class="input input-bordered flex-1" />
					</div>
				</div>

				<div class="bg-base-100 rounded-xl border border-base-300 p-4">
					<label class="flex items-center gap-2 text-[0.8rem] text-base-content/60 mb-2">
						<DollarSign class="w-3.5 h-3.5" />
						Price Range
					</label>
					<select bind:value={price} class="select select-bordered w-full">
						<option value="3-5">$3 - $5 (recommended)</option>
						<option value="2-4">$2 - $4</option>
						<option value="4-6">$4 - $6</option>
					</select>
				</div>

				<div class="bg-base-100 rounded-xl border border-base-300 p-4 lg:col-span-2">
					<label class="text-[0.8rem] text-base-content/60 mb-2 block">
						What's in tonight's box? (optional)
					</label>
					<textarea
						bind:value={description}
						placeholder="e.g., Pasta bar leftovers, grilled chicken, roasted veggies"
						rows="3"
						class="textarea textarea-bordered w-full resize-none"
					></textarea>
				</div>
			</div>
		</div>

		<div class="px-5 pb-8 pt-4 max-w-5xl mx-auto w-full">
			<button
				onclick={handleSubmit}
				class="w-full lg:w-auto lg:px-16 lg:mx-auto lg:flex bg-primary text-primary-content py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform font-bold"
			>
				Post Drop
			</button>
		</div>
	</div>
{/if}
