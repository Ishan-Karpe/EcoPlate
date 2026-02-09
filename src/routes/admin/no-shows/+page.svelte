<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { ArrowLeft, UserX, AlertTriangle, RotateCcw, Gift, Shield } from '@lucide/svelte';

	interface NoShowEntry {
		code: string;
		location: string;
		time: string;
		repeatOffender: boolean;
		boxStatus: 'released' | 'donated' | 'disposed';
	}

	const MOCK_NO_SHOWS: NoShowEntry[] = [
		{ code: 'HK4M8R', location: 'North Dining Hall', time: '9:15 PM', repeatOffender: true, boxStatus: 'released' },
		{ code: 'W9P3TN', location: 'South Dining Hall', time: '9:45 PM', repeatOffender: false, boxStatus: 'donated' },
		{ code: 'Q5L7VB', location: 'North Dining Hall', time: '10:02 PM', repeatOffender: false, boxStatus: 'released' },
		{ code: 'M2X6KD', location: 'Student Center Cafe', time: '8:35 PM', repeatOffender: true, boxStatus: 'disposed' }
	];

	function handleBack() {
		goto('/admin/dashboard');
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div class="px-5 pt-12 pb-4">
		<button
			onclick={handleBack}
			class="flex items-center gap-1 text-base-content/60 text-[0.875rem] mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Dashboard
		</button>
		<h1 class="text-[1.5rem] font-bold">No-show Management</h1>
		<p class="text-base-content/60 text-[0.875rem] mt-1">
			Track unclaimed reservations and apply policies
		</p>
	</div>

	<div class="flex-1 px-5 py-4 space-y-4 overflow-y-auto pb-8">
		<div in:fly={{ y: 10, duration: 300 }} class="bg-base-200 rounded-xl p-4 space-y-3">
			<div class="flex items-center gap-2">
				<Shield class="w-4 h-4 text-primary" />
				<span class="text-[0.8rem] text-base-content font-semibold">No-show Policy</span>
			</div>
			<div class="space-y-2 text-[0.75rem] text-base-content/60">
				<div class="flex items-start gap-2">
					<span class="text-primary mt-0.5">1.</span>
					<p>Reservation held until pickup window ends</p>
				</div>
				<div class="flex items-start gap-2">
					<span class="text-primary mt-0.5">2.</span>
					<p>If not picked up: marked as no-show</p>
				</div>
				<div class="flex items-start gap-2">
					<span class="text-primary mt-0.5">3.</span>
					<p>Repeat no-shows (3+): lose early access privileges</p>
				</div>
				<div class="flex items-start gap-2">
					<span class="text-primary mt-0.5">4.</span>
					<p>Credit returned only if cancelled before window starts</p>
				</div>
				<div class="flex items-start gap-2">
					<span class="text-primary mt-0.5">5.</span>
					<p>Unclaimed boxes: released back to app OR directed to campus donation/disposal</p>
				</div>
			</div>
		</div>

		<div in:fly={{ y: 10, delay: 100, duration: 300 }} class="grid grid-cols-3 gap-2">
			<div class="bg-base-100 rounded-xl border border-base-300 p-3 text-center">
				<p class="text-[1.25rem] text-red-500 font-extrabold">{MOCK_NO_SHOWS.length}</p>
				<p class="text-[0.65rem] text-base-content/60">No-shows tonight</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3 text-center">
				<p class="text-[1.25rem] text-green-600 font-extrabold">
					{MOCK_NO_SHOWS.filter((n) => n.boxStatus === 'released').length}
				</p>
				<p class="text-[0.65rem] text-base-content/60">Boxes released</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3 text-center">
				<p class="text-[1.25rem] text-amber-600 font-extrabold">
					{MOCK_NO_SHOWS.filter((n) => n.repeatOffender).length}
				</p>
				<p class="text-[0.65rem] text-base-content/60">Repeat offenders</p>
			</div>
		</div>

		<div in:fly={{ y: 10, delay: 150, duration: 300 }}>
			<p class="text-[0.8rem] text-base-content/60 mb-2 font-semibold">Tonight's No-shows</p>
			<div class="space-y-2">
				{#each MOCK_NO_SHOWS as noShow (noShow.code)}
					<div class="bg-base-100 rounded-xl border border-base-300 p-3.5">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								<span class="text-[0.875rem] tracking-wider font-mono font-semibold">
									{noShow.code}
								</span>
								{#if noShow.repeatOffender}
									<span
										class="bg-red-100 text-red-600 text-[0.6rem] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-semibold"
									>
										<AlertTriangle class="w-2.5 h-2.5" />
										Repeat
									</span>
								{/if}
							</div>
							<span class="text-[0.75rem] text-base-content/60">{noShow.time}</span>
						</div>
						<p class="text-[0.75rem] text-base-content/60 mb-2">{noShow.location}</p>
						<div class="flex items-center gap-2">
							<span
								class="text-[0.7rem] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium {noShow.boxStatus ===
								'released'
									? 'bg-green-100 text-green-700'
									: noShow.boxStatus === 'donated'
										? 'bg-blue-100 text-blue-700'
										: 'bg-gray-100 text-gray-600'}"
							>
								{#if noShow.boxStatus === 'released'}
									<RotateCcw class="w-3 h-3" />
									Released to app
								{:else if noShow.boxStatus === 'donated'}
									<Gift class="w-3 h-3" />
									Sent to donation
								{:else}
									<UserX class="w-3 h-3" />
									Disposed
								{/if}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div
			in:fly={{ y: 10, delay: 250, duration: 300 }}
			class="bg-green-50 border border-green-200 rounded-xl p-4"
		>
			<p class="text-[0.8rem] text-green-800 mb-2 font-semibold">Unclaimed Box Handling</p>
			<p class="text-[0.75rem] text-green-700">
				Unclaimed boxes during remaining window time are automatically released back to the app for
				other students. After the window closes, remaining boxes are redirected to campus-approved
				donation channels or responsible disposal.
			</p>
		</div>
	</div>
</div>
