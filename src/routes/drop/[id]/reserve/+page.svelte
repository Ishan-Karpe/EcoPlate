<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, Banknote, Clock, CreditCard, MapPin, ShieldCheck, Wallet } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { formatTime } from '$lib/types';

	const dropId = $derived(page.params.id);
	const drop = $derived(dropId ? appState.getDropById(dropId) : undefined);
	const user = $derived(appState.user);

	$effect(() => {
		if (!drop) {
			goto('/');
		}
	});

	// Capture initial value non-reactively to avoid warning
	let paymentMethod = $state<'card' | 'credit' | 'pay_at_pickup'>(
		untrack(() => {
			const u = appState.user;
			return u.membership && u.creditsRemaining > 0 ? 'credit' : 'pay_at_pickup';
		})
	);

	const hasCredits = $derived(user.membership && user.creditsRemaining > 0);

	interface PaymentOption {
		value: 'card' | 'credit' | 'pay_at_pickup';
		label: string;
		desc: string;
		available: boolean;
	}

	const paymentOptions = $derived<PaymentOption[]>([
		...(hasCredits
			? [
					{
						value: 'credit' as const,
						label: 'Use Rescue Credit',
						desc: `${user.creditsRemaining} credits remaining`,
						available: true
					}
				]
			: []),
		{
			value: 'pay_at_pickup' as const,
			label: 'Pay at pickup',
			desc: drop ? `$${drop.priceMin}-$${drop.priceMax} cash or card` : '',
			available: true
		},
		{
			value: 'card' as const,
			label: 'Pay now by card',
			desc: drop ? `$${drop.priceMin}-$${drop.priceMax} charged immediately` : '',
			available: true
		}
	]);

	const steps = ["You'll get a 6-digit pickup code", 'Show it to staff at the pickup window', 'Grab your box and enjoy!'];
	let showCelebration = $state(false);

	function handleConfirm() {
		if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
			navigator.vibrate(50);
		}

		const reservation = appState.confirmReservation(paymentMethod);
		if (reservation) {
			showCelebration = true;
			setTimeout(() => {
				goto(`/pickup/${reservation.id}`);
			}, 700);
		}
	}

	function handleBack() {
		goto(`/drop/${dropId}`);
	}
</script>

{#if drop}
	<div class="min-h-screen bg-base-200 flex flex-col">
		{#if showCelebration}
			<div class="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
				{#each Array.from({ length: 16 }) as _, i}
					<span
						class="confetti-piece"
						style={`left: ${5 + i * 6}%; animation-delay: ${i * 30}ms;`}
					></span>
				{/each}
			</div>
		{/if}

		<div class="px-5 pt-12 pb-4 max-w-3xl mx-auto w-full">
			<button
				onclick={handleBack}
				class="flex items-center gap-1 text-base-content/60 text-[0.875rem] mb-4"
			>
				<ArrowLeft class="w-4 h-4" />
				Back
			</button>
			<h1 class="text-[1.5rem] lg:text-[1.75rem] font-bold">Confirm your box</h1>
			<p class="text-base-content/60 text-[0.875rem] lg:text-[1rem] mt-1">
				You're about to rescue a meal. Nice.
			</p>
		</div>

		<div class="flex-1 px-5 py-4 space-y-4 overflow-y-auto max-w-3xl mx-auto w-full">
			<div
				in:fly={{ y: 10, duration: 300 }}
				class="bg-base-100 rounded-2xl border border-base-300 p-5 space-y-4"
			>
				<div class="flex items-center gap-3 pb-4 border-b border-base-300">
					<div class="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-[1.5rem]">
						{drop.emoji}
					</div>
					<div>
						<p class="text-[1rem] font-semibold">Rescue Box</p>
						<p class="text-[0.8rem] text-base-content/60">{drop.location}</p>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<MapPin class="w-4 h-4 text-primary shrink-0" />
						<p class="text-[0.875rem] font-medium">{drop.locationDetail}</p>
					</div>
					<div class="flex items-center gap-3">
						<Clock class="w-4 h-4 text-primary shrink-0" />
						<div>
							<p class="text-[0.875rem] font-medium">
								{formatTime(drop.windowStart)} - {formatTime(drop.windowEnd)}
							</p>
							<p class="text-[0.75rem] text-base-content/60">90-minute pickup window</p>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between pt-4 border-t border-base-300">
					<span class="text-[0.875rem] text-base-content/60">Estimated price</span>
					<span class="text-[1.25rem] text-primary font-bold">
						${drop.priceMin}-${drop.priceMax}
					</span>
				</div>
			</div>

			<div in:fly={{ y: 10, delay: 100, duration: 300 }}>
				<p class="text-[0.8rem] text-base-content/60 mb-2 font-semibold">Payment method</p>
				<div class="space-y-2">
					{#each paymentOptions.filter((opt) => opt.available) as opt (opt.value)}
						<button
							onclick={() => (paymentMethod = opt.value)}
							class="w-full bg-base-100 rounded-xl border-2 p-3.5 flex items-center gap-3 text-left transition-colors {paymentMethod ===
							opt.value
								? 'border-primary bg-primary/5'
								: 'border-base-300 hover:border-primary/30'}"
						>
							<div
								class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 {paymentMethod ===
								opt.value
									? 'bg-primary text-white'
									: 'bg-base-200 text-base-content/60'}"
							>
								{#if opt.value === 'credit'}
									<Wallet class="w-4 h-4" />
								{:else if opt.value === 'pay_at_pickup'}
									<Banknote class="w-4 h-4" />
								{:else}
									<CreditCard class="w-4 h-4" />
								{/if}
							</div>
							<div class="min-w-0">
								<p class="text-[0.875rem] font-semibold">{opt.label}</p>
								<p class="text-[0.75rem] text-base-content/60">{opt.desc}</p>
							</div>
							<div
								class="w-5 h-5 rounded-full border-2 shrink-0 ml-auto flex items-center justify-center {paymentMethod ===
								opt.value
									? 'border-primary'
									: 'border-gray-300'}"
							>
								{#if paymentMethod === opt.value}
									<div class="w-2.5 h-2.5 bg-primary rounded-full"></div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</div>

			<div in:fly={{ y: 10, delay: 150, duration: 300 }} class="bg-base-200 rounded-2xl p-4 space-y-3">
				<p class="text-[0.8rem] text-base-content font-semibold">How pickup works</p>
				<div class="space-y-2">
					{#each steps as step, i}
						<div class="flex items-center gap-2.5">
							<div
								class="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-[0.65rem] font-bold"
							>
								{i + 1}
							</div>
							<span class="text-[0.8rem] text-base-content">{step}</span>
						</div>
					{/each}
				</div>
			</div>

			<div in:fade={{ delay: 200, duration: 300 }} class="bg-amber-50 border border-amber-200 rounded-xl p-3">
				<p class="text-[0.75rem] text-amber-800">
					<strong>No-show policy:</strong> If you can't make it, cancel before the window starts to
					keep your credit. Repeat no-shows may lose early access privileges.
				</p>
			</div>

			<div class="flex items-center gap-2 justify-center py-1">
				<ShieldCheck class="w-4 h-4 text-primary" />
				<span class="text-[0.75rem] text-base-content/60">Food handled by campus dining staff</span>
			</div>
		</div>

		<div in:fly={{ y: 20, delay: 150, duration: 300 }} class="px-5 pb-8 pt-2 max-w-3xl mx-auto w-full">
			<button
				onclick={handleConfirm}
				class="btn btn-primary btn-lg w-full lg:w-auto lg:px-12 lg:mx-auto lg:flex shadow-lg shadow-primary/25"
			>
				{paymentMethod === 'credit'
					? 'Use 1 Credit & Reserve'
					: paymentMethod === 'card'
						? `Pay $${drop.priceMin} & Reserve`
						: 'Confirm Reservation'}
			</button>
			<p class="text-center text-[0.7rem] lg:text-[0.8rem] text-base-content/60 mt-2">
				{paymentMethod === 'pay_at_pickup'
					? "Pay at pickup. No-show? Box goes to someone else."
					: 'Confirmed instantly. Cancel before window for a refund.'}
			</p>
		</div>
	</div>
{/if}

<style>
	.confetti-piece {
		position: absolute;
		top: -1rem;
		width: 0.5rem;
		height: 0.8rem;
		background: hsl(calc(120 + var(--hue-shift, 0)), 70%, 55%);
		opacity: 0;
		transform: translateY(0) rotate(0deg);
		animation: confetti-fall 0.95s ease-out forwards;
	}

	.confetti-piece:nth-child(odd) {
		background: #22c55e;
	}

	.confetti-piece:nth-child(3n) {
		background: #16a34a;
	}

	.confetti-piece:nth-child(4n) {
		background: #86efac;
	}

	@keyframes confetti-fall {
		0% {
			opacity: 0;
			transform: translateY(0) rotate(0deg);
		}
		10% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(105vh) rotate(520deg);
		}
	}
</style>
