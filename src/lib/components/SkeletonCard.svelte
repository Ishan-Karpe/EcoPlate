<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 1 }: Props = $props();
</script>

<div class="space-y-3">
	{#each Array.from({ length: count }) as _, i}
		<div class="card card-compact bg-base-100 shadow-sm w-full" aria-hidden="true" data-skeleton-index={i}>
			<div class="flex items-stretch">
				<div class="w-20 flex items-center justify-center shrink-0 bg-base-300/70">
					<div class="skeleton h-10 w-10 rounded-xl"></div>
				</div>

				<div class="card-body p-3.5 min-w-0">
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 space-y-2 w-full">
							<div class="skeleton h-4 w-40"></div>
							<div class="skeleton h-3 w-full"></div>
						</div>
						<div class="skeleton h-4 w-4 rounded-full mt-1"></div>
					</div>

					<div class="flex items-center gap-3 mt-2">
						<div class="skeleton h-3 w-24"></div>
						<div class="skeleton h-3 w-20"></div>
					</div>

					<div class="card-actions justify-between items-center mt-2">
						<div class="skeleton h-3 w-28"></div>
						<div class="skeleton h-5 w-20 rounded-full"></div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
