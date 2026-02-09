<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MapPin, Clock, CheckCircle2, Copy, Check, X, Timer, AlertTriangle } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { formatTime } from '$lib/types';

	const pickupId = $derived(page.params.id);
	const reservation = $derived(appState.reservation);
	const drop = $derived(appState.selectedDrop);

	// Guard: redirect if no valid reservation for this ID
	$effect(() => {
		if (!reservation || reservation.id !== pickupId) {
			goto('/');
		}
	});

	let copied = $state(false);
	let showCancelConfirm = $state(false);
	let minutesLeft = $state(90);

	$effect(() => {
		const interval = setInterval(() => {
			minutesLeft = Math.max(0, minutesLeft - 1);
		}, 60000);
		return () => clearInterval(interval);
	});

	function handleCopy() {
		if (reservation) {
			navigator.clipboard?.writeText(reservation.pickupCode);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function handlePickedUp() {
		appState.markPickedUp();
		goto('/rating');
	}

	function handleCancel() {
		appState.cancelReservation();
		goto('/');
	}
</script>

{#if showCancelConfirm}
	<div class="min-h-screen bg-base-200 flex flex-col items-center justify-center px-5">
		<div
			in:scale={{ duration: 300 }}
			class="card bg-base-100 shadow-xl w-full max-w-sm"
		>
			<div class="card-body items-center text-center">
				<div class="w-14 h-14 bg-warning/20 rounded-full flex items-center justify-center">
					<AlertTriangle class="w-7 h-7 text-warning" />
				</div>
				<h2 class="card-title">Cancel reservation?</h2>
				<p class="text-base-content/60">
					Your box will be released back for other students to claim.
					{#if reservation?.paymentMethod === 'credit'}
						Your Rescue Credit will be returned.
					{/if}
					{#if reservation?.paymentMethod === 'card'}
						Your payment will be refunded.
					{/if}
				</p>
				<div class="card-actions flex-col w-full pt-2">
					<button onclick={handleCancel} class="btn btn-error btn-block">
						Yes, cancel reservation
					</button>
					<button onclick={() => (showCancelConfirm = false)} class="btn btn-ghost btn-block">
						Keep my reservation
					</button>
				</div>
			</div>
		</div>
	</div>
{:else if reservation && drop}
	<div class="min-h-screen bg-base-200 flex flex-col">
		<div
			in:scale={{ duration: 300 }}
			class="bg-primary text-primary-content px-5 pt-14 pb-8 rounded-b-[2rem] text-center"
		>
			<div
				in:scale={{ delay: 200, duration: 300 }}
				class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"
			>
				<CheckCircle2 class="w-8 h-8" />
			</div>
			<h1 class="text-[1.375rem] font-bold">You rescued a meal!</h1>
			<p class="text-white/80 text-[0.875rem] mt-1">Show this code at the pickup window</p>
		</div>

		<div class="flex-1 px-5 py-6 space-y-4">
			<div
				in:fly={{ y: 10, delay: 250, duration: 300 }}
				class="rounded-xl p-3 flex items-center justify-center gap-2 {minutesLeft <= 15
					? 'bg-red-50 border border-red-200'
					: minutesLeft <= 30
						? 'bg-amber-50 border border-amber-200'
						: 'bg-blue-50 border border-blue-200'}"
			>
				<Timer
					class="w-4 h-4 {minutesLeft <= 15
						? 'text-red-600'
						: minutesLeft <= 30
							? 'text-amber-600'
							: 'text-blue-600'}"
				/>
				<span
					class="text-[0.8rem] font-semibold {minutesLeft <= 15
						? 'text-red-700'
						: minutesLeft <= 30
							? 'text-amber-700'
							: 'text-blue-700'}"
				>
					{minutesLeft > 0 ? `${minutesLeft} min left in pickup window` : 'Window closing soon!'}
				</span>
			</div>

			<div
				in:fly={{ y: 20, delay: 300, duration: 300 }}
				class="bg-base-100 rounded-2xl border-2 border-primary/20 p-6 text-center"
			>
				<p
					class="text-[0.75rem] text-base-content/60 mb-2 font-medium uppercase tracking-widest"
				>
					Your pickup code
				</p>
				<div class="flex items-center justify-center gap-3">
					<p class="text-[2.5rem] tracking-[0.15em] text-primary font-extrabold font-mono">
						{reservation.pickupCode}
					</p>
					<button
						onclick={handleCopy}
						class="p-2 rounded-lg bg-base-200 text-primary hover:bg-accent transition-colors"
					>
						{#if copied}
							<Check class="w-4 h-4" />
						{:else}
							<Copy class="w-4 h-4" />
						{/if}
					</button>
				</div>
				<p class="text-[0.7rem] text-base-content/60 mt-2">
					Payment: {reservation.paymentMethod === 'credit'
						? '1 Rescue Credit used'
						: reservation.paymentMethod === 'card'
							? 'Card charged'
							: `Pay $${drop.priceMin}-$${drop.priceMax} at pickup`}
				</p>
			</div>

			<div
				in:fly={{ y: 15, delay: 400, duration: 300 }}
				class="bg-base-100 rounded-2xl border border-base-300 p-4 space-y-3"
			>
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
						<MapPin class="w-4 h-4 text-primary" />
					</div>
					<div>
						<p class="text-[0.875rem] font-semibold">{drop.location}</p>
						<p class="text-[0.75rem] text-base-content/60">{drop.locationDetail}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
						<Clock class="w-4 h-4 text-primary" />
					</div>
					<div>
						<p class="text-[0.875rem] font-semibold">
							{formatTime(drop.windowStart)} - {formatTime(drop.windowEnd)}
						</p>
						<p class="text-[0.75rem] text-base-content/60">Don't miss your window!</p>
					</div>
				</div>
			</div>

			<div
				in:fade={{ delay: 500, duration: 300 }}
				class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"
			>
				<p class="text-[0.8rem] text-amber-800">
					If you can't make it, cancel below so someone else can claim your box. No-shows without
					cancellation may affect your future access.
				</p>
			</div>
		</div>

		<div in:fly={{ y: 20, delay: 500, duration: 300 }} class="px-5 pb-8 pt-2 space-y-2">
			<button
				onclick={handlePickedUp}
				class="btn btn-primary btn-lg w-full shadow-lg shadow-primary/25"
			>
				I Picked Up My Box
			</button>
			<button
				onclick={() => (showCancelConfirm = true)}
				class="btn btn-ghost btn-block"
			>
				<X class="w-4 h-4" />
				Cancel Reservation
			</button>
		</div>
	</div>
{:else}
	<!-- Guard will redirect, show nothing while redirecting -->
	<div class="min-h-screen bg-base-200 flex items-center justify-center">
		<span class="loading loading-spinner loading-lg text-primary"></span>
	</div>
{/if}
