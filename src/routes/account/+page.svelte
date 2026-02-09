<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Bell, CreditCard, TrendingUp, X, Check, Zap, Shield } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { toast } from 'svelte-sonner';

	const user = $derived(appState.user);
	const isFirstPickup = $derived(user.isFirstTime);

	let selectedPlan = $state<'none' | 'basic' | 'premium'>('none');
	let step = $state<'intro' | 'plans'>(isFirstPickup ? 'intro' : 'plans');

	interface Perk {
		title: string;
		desc: string;
	}

	const perks: Perk[] = [
		{ title: 'Drop alerts', desc: "Get notified when tonight's boxes go live" },
		{ title: 'Rescue Credits', desc: 'Subscribe and never miss a meal' },
		{ title: 'Your impact', desc: 'Track meals rescued and waste prevented' }
	];

	function handleSignUp() {
		appState.signUp(selectedPlan);
		if (selectedPlan !== 'none') {
			toast.success(`Welcome to Rescue ${selectedPlan === 'basic' ? 'Basic' : 'Premium'}!`);
		} else {
			toast.success('Account created!');
		}
		goto('/');
	}

	function handleDismiss() {
		appState.dismissAccount();
		goto('/');
	}
</script>

{#if step === 'plans'}
	<div class="min-h-screen bg-base-200 flex flex-col">
		<div class="px-5 pt-12 flex justify-end">
			<button onclick={handleDismiss} class="p-2 rounded-full bg-base-300 text-base-content/60">
				<X class="w-5 h-5" />
			</button>
		</div>

		<div class="flex-1 px-5 py-4 flex flex-col">
			<div in:fly={{ y: 10, duration: 300 }} class="text-center mb-6">
				<h1 class="text-[1.375rem] font-bold">Choose your plan</h1>
				<p class="text-base-content/60 text-[0.875rem] mt-1">
					Unlock credits, early access, and notifications
				</p>
			</div>

			<div class="space-y-3 mb-4">
				<button
					in:fly={{ y: 10, delay: 50, duration: 300 }}
					onclick={() => (selectedPlan = 'none')}
					class="w-full bg-base-100 rounded-xl border-2 p-4 text-left transition-colors {selectedPlan ===
					'none'
						? 'border-primary'
						: 'border-base-300'}"
				>
					<div class="flex items-center justify-between mb-2">
						<p class="text-[0.9375rem] font-semibold">Free Account</p>
						<div
							class="w-5 h-5 rounded-full border-2 flex items-center justify-center {selectedPlan ===
							'none'
								? 'border-primary bg-primary'
								: 'border-gray-300'}"
						>
							{#if selectedPlan === 'none'}
								<Check class="w-3 h-3 text-white" />
							{/if}
						</div>
					</div>
					<p class="text-[0.8rem] text-base-content/60">
						Pay per box. Get drop alerts and impact tracking.
					</p>
				</button>

				<button
					in:fly={{ y: 10, delay: 100, duration: 300 }}
					onclick={() => (selectedPlan = 'basic')}
					class="w-full rounded-xl border-2 p-4 text-left transition-colors relative overflow-hidden {selectedPlan ===
					'basic'
						? 'border-primary bg-primary/5'
						: 'border-base-300 bg-base-100'}"
				>
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<p class="text-[0.9375rem] font-semibold">Rescue Basic</p>
							<span class="bg-primary/10 text-primary text-[0.6rem] px-2 py-0.5 rounded-full font-semibold">
								Popular
							</span>
						</div>
						<div
							class="w-5 h-5 rounded-full border-2 flex items-center justify-center {selectedPlan ===
							'basic'
								? 'border-primary bg-primary'
								: 'border-gray-300'}"
						>
							{#if selectedPlan === 'basic'}
								<Check class="w-3 h-3 text-white" />
							{/if}
						</div>
					</div>
					<div class="flex items-baseline gap-1 mb-2">
						<span class="text-[1.5rem] text-primary font-extrabold">$15</span>
						<span class="text-[0.8rem] text-base-content/60">/month</span>
					</div>
					<div class="space-y-1.5">
						<div class="flex items-center gap-2">
							<Check class="w-3.5 h-3.5 text-primary shrink-0" />
							<span class="text-[0.8rem]">Up to 7 Rescue Credits/month</span>
						</div>
						<div class="flex items-center gap-2">
							<Check class="w-3.5 h-3.5 text-primary shrink-0" />
							<span class="text-[0.8rem]">~$2.14 per meal</span>
						</div>
						<div class="flex items-center gap-2">
							<Check class="w-3.5 h-3.5 text-primary shrink-0" />
							<span class="text-[0.8rem]">Unused credits roll for 30 days</span>
						</div>
					</div>
				</button>

				<button
					in:fly={{ y: 10, delay: 150, duration: 300 }}
					onclick={() => (selectedPlan = 'premium')}
					class="w-full rounded-xl border-2 p-4 text-left transition-colors {selectedPlan ===
					'premium'
						? 'border-primary bg-primary/5'
						: 'border-base-300 bg-base-100'}"
				>
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<p class="text-[0.9375rem] font-semibold">Rescue Premium</p>
							<Zap class="w-3.5 h-3.5 text-amber-500" />
						</div>
						<div
							class="w-5 h-5 rounded-full border-2 flex items-center justify-center {selectedPlan ===
							'premium'
								? 'border-primary bg-primary'
								: 'border-gray-300'}"
						>
							{#if selectedPlan === 'premium'}
								<Check class="w-3 h-3 text-white" />
							{/if}
						</div>
					</div>
					<div class="flex items-baseline gap-1 mb-2">
						<span class="text-[1.5rem] text-primary font-extrabold">$30</span>
						<span class="text-[0.8rem] text-base-content/60">/month</span>
					</div>
					<div class="space-y-1.5">
						<div class="flex items-center gap-2">
							<Check class="w-3.5 h-3.5 text-primary shrink-0" />
							<span class="text-[0.8rem]">Up to 15 Rescue Credits/month</span>
						</div>
						<div class="flex items-center gap-2">
							<Check class="w-3.5 h-3.5 text-primary shrink-0" />
							<span class="text-[0.8rem]">~$2.00 per meal</span>
						</div>
						<div class="flex items-center gap-2">
							<Zap class="w-3.5 h-3.5 text-amber-500 shrink-0" />
							<span class="text-[0.8rem] font-medium">Early access: reserve first</span>
						</div>
						<div class="flex items-center gap-2">
							<Check class="w-3.5 h-3.5 text-primary shrink-0" />
							<span class="text-[0.8rem]">Unused credits roll for 30 days</span>
						</div>
					</div>
				</button>
			</div>

			<div in:fade={{ delay: 250, duration: 300 }} class="bg-base-200 rounded-xl p-3 flex items-start gap-2 mb-4">
				<Shield class="w-4 h-4 text-primary mt-0.5 shrink-0" />
				<p class="text-[0.7rem] text-base-content/60">
					<strong>Fairness policy:</strong> If you use less than 50% of credits for 2 months due to
					low supply, you can auto-downgrade the next month. We keep it fair.
				</p>
			</div>

			<div class="mt-auto"></div>

			<div in:fly={{ y: 15, delay: 300, duration: 300 }} class="pb-8">
				<button
					onclick={handleSignUp}
					class="w-full bg-primary text-primary-content py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform font-bold"
				>
					{selectedPlan === 'none'
						? 'Create Free Account'
						: selectedPlan === 'basic'
							? 'Start Basic - $15/mo'
							: 'Start Premium - $30/mo'}
				</button>
				<button onclick={handleDismiss} class="w-full py-3 text-base-content/60 text-[0.875rem] mt-1">
					Maybe later
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-200 flex flex-col">
		<div class="px-5 pt-12 flex justify-end">
			<button onclick={handleDismiss} class="p-2 rounded-full bg-base-300 text-base-content/60">
				<X class="w-5 h-5" />
			</button>
		</div>

		<div class="flex-1 px-5 py-4 flex flex-col">
			<div in:fly={{ y: 15, duration: 300 }} class="text-center mb-8">
				<div class="text-[3.5rem] mb-3">&#127793;</div>
				<h1 class="text-[1.5rem] mb-2 font-bold">You just rescued your first box!</h1>
				<p class="text-base-content/60 text-[1rem]">Want to make it a habit?</p>
			</div>

			<div class="space-y-3 mb-8">
				{#each perks as perk, i}
					<div
						in:fly={{ x: -20, delay: 150 + i * 100, duration: 300 }}
						class="bg-base-100 rounded-xl border border-base-300 p-4 flex items-start gap-3"
					>
						<div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
							{#if i === 0}
								<Bell class="w-5 h-5 text-primary" />
							{:else if i === 1}
								<CreditCard class="w-5 h-5 text-primary" />
							{:else}
								<TrendingUp class="w-5 h-5 text-primary" />
							{/if}
						</div>
						<div>
							<p class="text-[0.875rem] font-semibold">{perk.title}</p>
							<p class="text-[0.8rem] text-base-content/60">{perk.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-auto"></div>

			<div in:fly={{ y: 20, delay: 500, duration: 300 }} class="pb-8">
				<button
					onclick={() => (step = 'plans')}
					class="w-full bg-primary text-primary-content py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform font-bold"
				>
					See Plans & Create Account
				</button>
				<button onclick={handleDismiss} class="w-full py-3 text-base-content/60 text-[0.875rem] mt-1">
					Maybe later
				</button>
			</div>
		</div>
	</div>
{/if}
