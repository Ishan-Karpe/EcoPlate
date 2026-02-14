<script lang="ts">
	import { goto } from '$app/navigation';
	import { Bell, CreditCard, Leaf, Shield, User } from '@lucide/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { appState } from '$lib/stores/app.svelte';

	const user = $derived(appState.user);
	const membership = $derived(user.membership);
	const accountStatus = $derived(user.hasAccount ? 'Account active' : 'Guest mode');

	function resetData() {
		appState.resetState();
		goto('/');
	}
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
	<div class="bg-primary text-primary-content px-5 pt-12 pb-6 lg:rounded-none rounded-b-[2rem]">
		<div class="max-w-5xl mx-auto flex items-center gap-2">
			<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
				<User class="w-5 h-5" />
			</div>
			<h1 class="text-[1.25rem] lg:text-[1.5rem] font-bold">Profile</h1>
		</div>
	</div>

	<div class="px-5 py-5 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="card bg-base-100 border border-base-300">
			<div class="card-body">
				<div class="flex items-center gap-2 mb-1">
					<Leaf class="w-4 h-4 text-primary" />
					<h2 class="card-title text-base">Account</h2>
				</div>
				<p class="text-sm"><span class="font-medium">Status:</span> {accountStatus}</p>
				<p class="text-sm"><span class="font-medium">Plan:</span> {membership ? membership.plan : 'none'}</p>
				<p class="text-sm"><span class="font-medium">Credits left:</span> {user.creditsRemaining}</p>

				{#if !user.hasAccount}
					<div class="card-actions mt-2">
						<a href="/account" class="btn btn-primary btn-sm">Create Account</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="card bg-base-100 border border-base-300">
			<div class="card-body">
				<div class="flex items-center gap-2 mb-1">
					<CreditCard class="w-4 h-4 text-primary" />
					<h2 class="card-title text-base">Membership</h2>
				</div>
				{#if membership}
					<p class="text-sm">${membership.monthlyPrice}/month · {membership.creditsPerMonth} credits</p>
					<p class="text-sm text-base-content/70">Credits used this month: {membership.creditsPerMonth - user.creditsRemaining}</p>
					<p class="text-sm text-base-content/70">Early access: {membership.earlyAccess ? 'Enabled' : 'Off'}</p>
				{:else}
					<p class="text-sm text-base-content/70">No subscription active.</p>
				{/if}
				<div class="card-actions mt-2">
					<a href="/account" class="btn btn-outline btn-sm">Manage Plan</a>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 border border-base-300">
			<div class="card-body">
				<div class="flex items-center gap-2 mb-2">
					<Shield class="w-4 h-4 text-primary" />
					<h2 class="card-title text-base">Settings</h2>
				</div>
				<div class="flex items-center justify-between py-2">
					<span class="text-sm">Theme</span>
					<ThemeToggle />
				</div>
				<div class="flex items-center justify-between py-2">
					<span class="text-sm flex items-center gap-1"><Bell class="w-3.5 h-3.5" /> Notifications</span>
					<input type="checkbox" class="toggle toggle-sm toggle-primary" checked disabled />
				</div>
			</div>
		</div>

		<div class="card bg-base-100 border border-base-300">
			<div class="card-body">
				<h2 class="card-title text-base">Actions</h2>
				<div class="card-actions justify-start mt-1 flex-wrap">
					<a href="/admin" class="btn btn-outline btn-sm">Staff Access</a>
					<button type="button" class="btn btn-error btn-sm" onclick={resetData}>Reset Data</button>
				</div>
			</div>
		</div>
	</div>
</div>
