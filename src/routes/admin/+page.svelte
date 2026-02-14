<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Leaf, ShieldCheck } from '@lucide/svelte';

	let pin = $state('');
	let error = $state(false);

	function handleSubmit() {
		if (pin.length === 4) {
			goto('/admin/dashboard');
		} else {
			error = true;
			setTimeout(() => (error = false), 2000);
		}
	}

	function handleBack() {
		goto('/');
	}

	function handleKeyPress(num: number | 'del' | null) {
		if (num === 'del') {
			pin = pin.slice(0, -1);
		} else if (num !== null && pin.length < 4) {
			pin = pin + num;
		}
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div class="px-5 pt-12 pb-4 max-w-2xl mx-auto w-full">
		<button
			onclick={handleBack}
			class="flex items-center gap-1 text-base-content/60 text-[0.875rem] mb-6"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to student view
		</button>
	</div>

	<div class="flex-1 px-5 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
		<div in:fly={{ y: 20, duration: 300 }} class="w-full max-w-sm text-center">
			<div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
				<Leaf class="w-8 h-8 text-primary" />
			</div>
			<h1 class="text-[1.5rem] mb-1 font-bold">EcoPlate Staff</h1>
			<p class="text-base-content/60 text-[0.875rem] mb-8">Enter your staff PIN to manage drops</p>

			<div class="space-y-4">
				<div class="flex justify-center gap-3">
					{#each [0, 1, 2, 3] as i}
						<div
							class="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-[1.5rem] transition-colors font-bold {pin.length >
							i
								? 'border-primary bg-primary/5 text-primary'
								: error
									? 'border-error'
									: 'border-base-300 bg-base-100'}"
						>
							{pin[i] ? '●' : ''}
						</div>
					{/each}
				</div>

				{#if error}
					<p in:fade class="text-error text-[0.8rem]">Please enter a 4-digit PIN</p>
				{/if}

				<div class="grid grid-cols-3 gap-2 max-w-[16rem] mx-auto mt-4">
					{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'] as num}
						<button
							onclick={() => handleKeyPress(num as number | 'del' | null)}
							disabled={num === null}
							class="h-14 rounded-xl text-[1.25rem] transition-colors font-medium {num === null
								? 'invisible'
								: num === 'del'
									? 'bg-base-300 text-base-content/60 text-[0.875rem]'
									: 'bg-base-100 border border-base-300 hover:bg-accent active:bg-primary/10'}"
						>
							{num === 'del' ? '⌫' : num === null ? '' : num}
						</button>
					{/each}
				</div>

				<button
					onclick={handleSubmit}
					disabled={pin.length < 4}
					class="w-full bg-primary text-primary-content py-3.5 rounded-2xl text-[1rem] disabled:opacity-40 transition-opacity mt-4 active:scale-[0.98] transition-transform font-semibold"
				>
					Sign In
				</button>
			</div>

			<div class="flex items-center gap-2 justify-center mt-6">
				<ShieldCheck class="w-4 h-4 text-base-content/60" />
				<span class="text-[0.75rem] text-base-content/60">Demo: enter any 4 digits</span>
			</div>
		</div>
	</div>
</div>
