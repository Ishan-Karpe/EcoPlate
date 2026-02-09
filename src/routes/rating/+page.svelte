<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Star, PartyPopper } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';

	let selectedRating = $state<number | null>(null);
	let submitted = $state(false);

	const labels = ['', 'Not great', 'Okay', 'Good', 'Great', 'Amazing!'];

	function handleRate(rating: number) {
		selectedRating = rating;
		submitted = true;
		setTimeout(() => {
			appState.submitRating(rating);
			goto('/account');
		}, 1200);
	}

	function handleSkip() {
		appState.skipRating();
		goto('/account');
	}
</script>

{#if submitted && selectedRating}
	<div class="min-h-screen bg-base-200 flex flex-col items-center justify-center px-5">
		<div in:scale={{ duration: 300 }} class="text-center">
			<div class="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
				<PartyPopper class="w-10 h-10 text-primary" />
			</div>
			<h2 class="text-[1.375rem] mb-2 font-bold">Thanks for the feedback!</h2>
			<p class="text-base-content/60 text-[0.875rem]">
				You rated your Rescue Box {selectedRating}/5
			</p>
			<div class="flex justify-center gap-1 mt-3">
				{#each [1, 2, 3, 4, 5] as star}
					<Star
						class="w-6 h-6 {star <= selectedRating
							? 'text-amber-400 fill-amber-400'
							: 'text-gray-200'}"
					/>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-200 flex flex-col">
		<div in:fly={{ y: -10, duration: 300 }} class="px-5 pt-14 pb-4 text-center">
			<div class="text-[3rem] mb-2">&#127881;</div>
			<h1 class="text-[1.5rem] font-bold">How was your Rescue Box?</h1>
			<p class="text-base-content/60 text-[0.875rem] mt-1">Quick tap helps us make it better</p>
		</div>

		<div class="flex-1 flex flex-col items-center justify-center px-5">
			<div
				in:scale={{ delay: 200, duration: 300 }}
				class="bg-base-100 rounded-2xl border border-base-300 p-8 w-full max-w-sm text-center"
			>
				<div class="flex justify-center gap-3 mb-4">
					{#each [1, 2, 3, 4, 5] as star}
						<button
							onclick={() => handleRate(star)}
							class="p-1 hover:scale-115 active:scale-90 transition-transform"
						>
							<Star
								class="w-10 h-10 transition-colors {selectedRating && star <= selectedRating
									? 'text-amber-400 fill-amber-400'
									: 'text-gray-200 hover:text-amber-300'}"
							/>
						</button>
					{/each}
				</div>
				{#if selectedRating}
					<p in:fade class="text-[0.875rem] text-primary font-medium">
						{labels[selectedRating]}
					</p>
				{/if}
			</div>

			<button
				in:fade={{ delay: 500, duration: 300 }}
				onclick={handleSkip}
				class="mt-6 text-base-content/60 text-[0.875rem]"
			>
				Skip for now
			</button>
		</div>

		<div in:fade={{ delay: 600, duration: 300 }} class="px-5 pb-8 text-center">
			<div class="bg-accent rounded-xl p-3">
				<p class="text-[0.8rem] text-accent-content">
					&#127757; You just saved ~1 lb of food from going to waste. That's 1.5 kg of CO2 prevented.
				</p>
			</div>
		</div>
	</div>
{/if}
