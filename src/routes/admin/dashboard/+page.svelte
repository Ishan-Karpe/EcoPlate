<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Leaf, ArrowLeft, Plus, ScanLine, UserX, Package, CheckCircle2, Bookmark, TrendingUp, Star, AlertTriangle, ArrowUpRight, BarChart3 } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';
	import { formatTime } from '$lib/types';
	import { onMount } from 'svelte';

	const stats = $derived(appState.stats);
	const activeDrops = $derived(
		appState.drops.filter((d) => d.status === 'active' || d.status === 'upcoming')
	);

	const maxPosted = $derived(Math.max(...stats.recentDrops.map((d) => d.posted)));

	let chartHeights = $state<number[]>([]);

	onMount(() => {
		setTimeout(() => {
			chartHeights = stats.recentDrops.map((day) => (day.posted / maxPosted) * 100);
		}, 200);
	});

	function handleLogout() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div class="bg-primary text-primary-content px-5 pt-12 pb-6 lg:rounded-none rounded-b-[2rem]">
		<div class="max-w-6xl mx-auto">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
						<Leaf class="w-5 h-5" />
					</div>
					<span class="text-[1.125rem] lg:text-[1.375rem] font-bold">EcoPlate Staff</span>
				</div>
				<button
					onclick={handleLogout}
					class="flex items-center gap-1 text-white/70 text-[0.8rem] px-3 py-1.5 rounded-full border border-white/20"
				>
					<ArrowLeft class="w-3.5 h-3.5" />
					Exit
				</button>
			</div>

			<div class="flex gap-2 mt-2 lg:gap-4">
				<a
					href="/admin/create"
					class="flex-1 lg:flex-none lg:px-8 bg-white/20 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-1.5 active:bg-white/30 transition-colors"
				>
					<Plus class="w-4 h-4" />
					<span class="text-[0.8rem] font-semibold">New Drop</span>
				</a>
				<a
					href="/admin/redeem"
					class="flex-1 lg:flex-none lg:px-8 bg-white/20 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-1.5 active:bg-white/30 transition-colors"
				>
					<ScanLine class="w-4 h-4" />
					<span class="text-[0.8rem] font-semibold">Redeem</span>
				</a>
				<a
					href="/admin/no-shows"
					class="flex-1 lg:flex-none lg:px-8 bg-white/20 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-1.5 active:bg-white/30 transition-colors"
				>
					<UserX class="w-4 h-4" />
					<span class="text-[0.8rem] font-semibold">No-shows</span>
				</a>
			</div>
		</div>
	</div>

	<div class="px-5 py-5 space-y-4 flex-1 overflow-y-auto pb-8 max-w-6xl mx-auto w-full">
		{#if activeDrops.length > 0}
			<div in:fly={{ y: 10, duration: 300 }}>
				<p class="text-[0.8rem] text-base-content/60 mb-2 font-semibold">Active Drops Tonight</p>
				<div class="space-y-2">
					{#each activeDrops as drop (drop.id)}
						<div class="bg-base-100 rounded-xl border border-base-300 p-3 flex items-center gap-3">
							<div
								class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-[1.25rem]"
							>
								{drop.emoji}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-[0.8rem] truncate font-semibold">{drop.location}</p>
								<p class="text-[0.7rem] text-base-content/60">
									{formatTime(drop.windowStart)}-{formatTime(drop.windowEnd)}
								</p>
							</div>
							<div class="text-right">
								<p class="text-[0.875rem] text-primary font-bold">
									{drop.remainingBoxes}/{drop.totalBoxes}
								</p>
								<p class="text-[0.65rem] text-base-content/60">remaining</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div in:fly={{ y: 15, delay: 50, duration: 300 }} class="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-4">
			<div class="bg-base-100 rounded-xl border border-base-300 p-3">
				<div class="flex items-center gap-1.5 mb-1">
					<Package class="w-3.5 h-3.5 text-primary" />
					<span class="text-[0.6rem] text-base-content/60 font-medium">Posted</span>
				</div>
				<p class="text-[1.375rem] text-base-content font-extrabold">{stats.totalBoxesPosted}</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3">
				<div class="flex items-center gap-1.5 mb-1">
					<CheckCircle2 class="w-3.5 h-3.5 text-primary" />
					<span class="text-[0.6rem] text-base-content/60 font-medium">Picked Up</span>
				</div>
				<p class="text-[1.375rem] text-base-content font-extrabold">{stats.totalBoxesPickedUp}</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3">
				<div class="flex items-center gap-1.5 mb-1">
					<Bookmark class="w-3.5 h-3.5 text-blue-500" />
					<span class="text-[0.6rem] text-base-content/60 font-medium">Reserved</span>
				</div>
				<p class="text-[1.375rem] text-base-content font-extrabold">{stats.totalReservations}</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3">
				<div class="flex items-center gap-1.5 mb-1">
					<TrendingUp class="w-3.5 h-3.5 text-primary" />
					<span class="text-[0.6rem] text-base-content/60 font-medium">Pickup Rate</span>
				</div>
				<p class="text-[1.375rem] text-base-content font-extrabold">{stats.pickupRate}%</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3">
				<div class="flex items-center gap-1.5 mb-1">
					<UserX class="w-3.5 h-3.5 text-red-400" />
					<span class="text-[0.6rem] text-base-content/60 font-medium">No-show</span>
				</div>
				<p class="text-[1.375rem] text-base-content font-extrabold">{stats.noShowRate}%</p>
			</div>
			<div class="bg-base-100 rounded-xl border border-base-300 p-3">
				<div class="flex items-center gap-1.5 mb-1">
					<Star class="w-3.5 h-3.5 text-amber-400" />
					<span class="text-[0.6rem] text-base-content/60 font-medium">Rating</span>
				</div>
				<p class="text-[1.375rem] text-base-content font-extrabold">{stats.avgRating}</p>
			</div>
		</div>

		<div in:fly={{ y: 15, delay: 100, duration: 300 }} class="bg-base-100 rounded-xl border border-base-300 p-4">
			<div class="flex items-center gap-2 mb-3">
				<AlertTriangle class="w-4 h-4 text-amber-500" />
				<span class="text-[0.8rem] font-semibold">Daily Caps by Location</span>
			</div>
			<div class="space-y-2">
				{#each stats.locationCaps as cap (cap.location)}
					<div
						class="flex items-center justify-between py-1.5 border-b border-base-300 last:border-0"
					>
						<div>
							<p class="text-[0.8rem] font-medium">{cap.location}</p>
							<p class="text-[0.65rem] text-base-content/60">
								{#if cap.consecutiveWeeksAbove85 >= 2}
									<span class="text-green-600 flex items-center gap-0.5">
										<ArrowUpRight class="w-3 h-3" />
										Eligible for +10 increase
									</span>
								{:else}
									{cap.consecutiveWeeksAbove85}/2 weeks above 85%
								{/if}
							</p>
						</div>
						<div class="text-right">
							<p class="text-[0.9rem] text-primary font-bold">{cap.currentCap}</p>
							<p class="text-[0.6rem] text-base-content/60">boxes/day</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div in:fly={{ y: 15, delay: 150, duration: 300 }} class="bg-base-100 rounded-xl border border-base-300 p-4">
			<div class="flex items-center gap-2 mb-4">
				<BarChart3 class="w-4 h-4 text-primary" />
				<span class="text-[0.875rem] font-semibold">This Week</span>
			</div>

			<div class="flex items-end gap-2 h-32">
				{#each stats.recentDrops as day, i (day.date)}
					<div class="flex-1 flex flex-col items-center gap-1">
						<div class="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
							<div
								class="w-full bg-primary/15 rounded-t-md min-h-[4px] relative transition-[height] duration-500"
								style="height: {chartHeights[i] || 0}%"
							>
								<div
									class="w-full bg-primary rounded-t-md absolute bottom-0 transition-[height] duration-500"
									style="height: {(day.pickedUp / day.posted) * 100}%"
								></div>
							</div>
						</div>
						{#if day.noShows > 3}
							<div class="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
						{/if}
						<span class="text-[0.65rem] text-base-content/60">{day.date}</span>
					</div>
				{/each}
			</div>

			<div class="flex items-center gap-4 mt-3 pt-3 border-t border-base-300">
				<div class="flex items-center gap-1.5">
					<div class="w-2.5 h-2.5 bg-primary/15 rounded-sm"></div>
					<span class="text-[0.7rem] text-base-content/60">Posted</span>
				</div>
				<div class="flex items-center gap-1.5">
					<div class="w-2.5 h-2.5 bg-primary rounded-sm"></div>
					<span class="text-[0.7rem] text-base-content/60">Picked up</span>
				</div>
				<div class="flex items-center gap-1.5">
					<div class="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
					<span class="text-[0.7rem] text-base-content/60">High no-shows</span>
				</div>
			</div>
		</div>

		<div
			in:fly={{ y: 15, delay: 250, duration: 300 }}
			class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4"
		>
			<p class="text-[0.8rem] text-green-800 mb-3 font-semibold">Environmental Impact (Pilot)</p>
			<div class="grid grid-cols-3 gap-3 text-center">
				<div>
					<p class="text-[1.25rem] text-green-700 font-extrabold">{stats.totalBoxesPickedUp}</p>
					<p class="text-[0.65rem] text-green-600">meals rescued</p>
				</div>
				<div>
					<p class="text-[1.25rem] text-green-700 font-extrabold">
						~{Math.round(stats.totalBoxesPickedUp * 1.5)}
					</p>
					<p class="text-[0.65rem] text-green-600">lbs diverted</p>
				</div>
				<div>
					<p class="text-[1.25rem] text-green-700 font-extrabold">
						~{Math.round(stats.totalBoxesPickedUp * 1.5 * 0.68)}
					</p>
					<p class="text-[0.65rem] text-green-600">kg CO2 saved</p>
				</div>
			</div>
		</div>

		<div
			in:fly={{ y: 15, delay: 350, duration: 300 }}
			class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4"
		>
			<div class="flex items-center gap-2 mb-2">
				<span class="text-[0.875rem]">&#128302;</span>
				<span class="text-[0.8rem] text-blue-800 font-semibold">EcoPlate Forecast v0</span>
			</div>
			<p class="text-[0.8rem] text-blue-700">
				Based on {stats.totalDrops} drops, tomorrow's suggested count is
				<strong>{Math.round(stats.totalBoxesPickedUp / stats.totalDrops + 2)} boxes</strong>
				per location. Forecast improves as we collect more data.
			</p>
			<p class="text-[0.65rem] text-blue-500 mt-2">
				After 60+ days of data, Forecast v1 (ML-assisted) will be available.
			</p>
		</div>
	</div>
</div>
