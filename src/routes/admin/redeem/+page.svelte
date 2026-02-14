<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Search, CheckCircle2, Clock, XCircle, AlertTriangle } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';

	const validCodes = $derived(appState.validCodes);
	const expiredCodes = $derived(appState.expiredCodes);
	const recentRedemptions = $derived(appState.recentRedemptions);

	let code = $state('');
	let result = $state<'success' | 'expired' | 'invalid' | null>(null);
	let redeemedCode = $state('');

	function handleCheck() {
		const upperCode = code.toUpperCase().trim();
		if (validCodes.includes(upperCode)) {
			result = 'success';
			redeemedCode = upperCode;
			appState.redeemCode(upperCode);
			setTimeout(() => {
				result = null;
				code = '';
			}, 3000);
		} else if (expiredCodes.includes(upperCode)) {
			result = 'expired';
			setTimeout(() => (result = null), 3000);
		} else {
			result = 'invalid';
			setTimeout(() => (result = null), 2500);
		}
	}

	function handleBack() {
		goto('/admin/dashboard');
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div class="px-5 pt-12 pb-4 max-w-3xl mx-auto w-full">
		<button
			onclick={handleBack}
			class="flex items-center gap-1 text-base-content/60 text-[0.875rem] mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Dashboard
		</button>
		<h1 class="text-[1.5rem] lg:text-[1.75rem] font-bold">Redeem Pickup</h1>
		<p class="text-base-content/60 text-[0.875rem] lg:text-[1rem] mt-1">
			Enter or scan the student's 6-digit code
		</p>
	</div>

	<div class="flex-1 px-5 py-6 flex flex-col items-center max-w-3xl mx-auto w-full">
		<div in:fly={{ y: 15, duration: 300 }} class="w-full max-w-sm">
			<div class="bg-base-100 rounded-2xl border border-base-300 p-6 text-center space-y-4">
				<div class="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto">
					<Search class="w-7 h-7 text-primary" />
				</div>

				<input
					type="text"
					bind:value={code}
					oninput={() => {
						code = code.toUpperCase().slice(0, 6);
						result = null;
					}}
					placeholder="XXXXXX"
					maxlength="6"
					class="input input-bordered w-full text-center text-[2rem] tracking-[0.2em] font-bold font-mono placeholder:text-gray-300"
					onkeydown={(e) => {
						if (e.key === 'Enter') handleCheck();
					}}
				/>

				<button
					onclick={handleCheck}
					disabled={code.length < 6}
					class="btn btn-primary w-full text-[1rem] disabled:opacity-40 font-semibold"
				>
					Verify & Redeem
				</button>
			</div>

			{#if result === 'success'}
				<div
					in:scale={{ duration: 300 }}
					class="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
				>
					<CheckCircle2 class="w-8 h-8 text-green-600 shrink-0" />
					<div>
						<p class="text-[0.875rem] text-green-800 font-semibold">Pickup confirmed!</p>
						<p class="text-[0.8rem] text-green-600">
							Code {redeemedCode} verified. Hand the box to the student.
						</p>
					</div>
				</div>
			{/if}

			{#if result === 'expired'}
				<div
					in:scale={{ duration: 300 }}
					class="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
				>
					<Clock class="w-8 h-8 text-amber-500 shrink-0" />
					<div>
						<p class="text-[0.875rem] text-amber-800 font-semibold">Code expired</p>
						<p class="text-[0.8rem] text-amber-600">
							This code's pickup window has ended or the reservation was cancelled. Please ask the
							student to make a new reservation.
						</p>
					</div>
				</div>
			{/if}

			{#if result === 'invalid'}
				<div
					in:scale={{ duration: 300 }}
					class="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
				>
					<XCircle class="w-8 h-8 text-red-500 shrink-0" />
					<div>
						<p class="text-[0.875rem] text-red-800 font-semibold">Code not found</p>
						<p class="text-[0.8rem] text-red-600">
							This code doesn't match any active reservation. Check for typos and try again.
						</p>
					</div>
				</div>
			{/if}

			{#if result === 'expired' || result === 'invalid'}
				<div in:fade={{ delay: 200, duration: 300 }} class="mt-3 bg-base-200 rounded-xl p-3 flex items-start gap-2">
					<AlertTriangle class="w-4 h-4 text-primary mt-0.5 shrink-0" />
					<p class="text-[0.75rem] text-base-content/60">
						<strong>Support fallback:</strong> If the student insists they have a valid reservation,
						check the admin dashboard for their reservation details or contact EcoPlate support.
					</p>
				</div>
			{/if}
		</div>

		<div in:fade={{ delay: 300, duration: 300 }} class="w-full max-w-sm mt-8">
			<p class="text-[0.8rem] text-base-content/60 mb-3 font-semibold">Recent pickups tonight</p>
			<div class="space-y-2">
				{#if recentRedemptions.length > 0}
					{#each recentRedemptions as entry (entry.code)}
						<div
							class="bg-base-100 rounded-lg border border-base-300 px-4 py-3 flex items-center justify-between"
						>
							<span class="text-[0.875rem] tracking-wide font-mono font-medium">{entry.code}</span>
							<div class="flex items-center gap-1.5">
								<CheckCircle2 class="w-3.5 h-3.5 text-green-500" />
								<span class="text-[0.75rem] text-base-content/60">{entry.time}</span>
							</div>
						</div>
					{/each}
				{:else}
					<p class="text-center text-[0.8rem] text-base-content/60 py-4">No pickups tonight yet</p>
				{/if}
			</div>
		</div>
	</div>
</div>
