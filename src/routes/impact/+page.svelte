<script lang="ts">
	import { Leaf, TrendingUp } from '@lucide/svelte';
	import { appState } from '$lib/stores/app.svelte';

	const user = $derived(appState.user);
	const mealsRescued = $derived(user.totalPickups);
	const co2SavedKg = $derived(Number((mealsRescued * 2.5).toFixed(1)));
	const milesNotDriven = $derived(Math.round(co2SavedKg * 2.5));
	const showersSaved = $derived(Math.max(0, Math.round(mealsRescued * 1.5)));
	const streakDays = $derived(Math.min(14, Math.max(0, user.totalPickups)));
	const monthlyGoal = 12;
	const monthProgress = $derived(Math.min(100, Math.round((mealsRescued / monthlyGoal) * 100)));
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div class="bg-primary text-primary-content px-5 pt-12 pb-6 lg:rounded-none rounded-b-[2rem]">
		<div class="max-w-5xl mx-auto">
			<div class="flex items-center gap-2">
				<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
					<Leaf class="w-5 h-5" />
				</div>
				<h1 class="text-[1.25rem] lg:text-[1.5rem] font-bold">Your Impact</h1>
			</div>
			<p class="text-white/80 text-sm mt-2">Every rescue adds up for campus and the planet.</p>
		</div>
	</div>

	<div class="px-5 py-5 max-w-5xl mx-auto w-full space-y-4">
		{#if mealsRescued === 0}
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body text-center">
					<p class="text-lg font-semibold">Complete your first rescue to start tracking impact!</p>
					<p class="text-sm text-base-content/60">Your dashboard will unlock after your first pickup.</p>
				</div>
			</div>
		{:else}
			<div class="stats stats-vertical lg:stats-horizontal w-full bg-base-100 border border-base-300 shadow-sm">
				<div class="stat">
					<div class="stat-title">Meals Rescued</div>
					<div class="stat-value text-primary">{mealsRescued}</div>
				</div>
				<div class="stat">
					<div class="stat-title">CO2 Saved</div>
					<div class="stat-value text-primary">{co2SavedKg}kg</div>
				</div>
				<div class="stat">
					<div class="stat-title">Current Streak</div>
					<div class="stat-value text-primary">{streakDays}d</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<div class="flex items-center gap-2 mb-1">
							<TrendingUp class="w-4 h-4 text-primary" />
							<h2 class="card-title text-base">Relatable Wins</h2>
						</div>
						<ul class="text-sm space-y-2 text-base-content/80">
							<li>= {milesNotDriven} miles not driven</li>
							<li>= {showersSaved} short showers saved</li>
							<li>= {Math.max(1, Math.round(mealsRescued / 2))} campus bins avoided</li>
						</ul>
					</div>
				</div>

				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<h2 class="card-title text-base">Monthly Momentum</h2>
						<p class="text-sm text-base-content/70">Goal: {monthlyGoal} rescued meals this month</p>
						<progress class="progress progress-primary w-full" value={monthProgress} max="100"></progress>
						<p class="text-xs text-base-content/60">{monthProgress}% to goal</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
