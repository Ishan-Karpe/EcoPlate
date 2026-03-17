<script lang="ts">
  import { onMount } from "svelte";
  import { Motion } from "svelte-motion";
  import { Heart, Leaf, Star } from "lucide-svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { authStore } from "$lib/stores/auth.svelte";

  let selectedRating = $state<number | null>(null);
  let submitted = $state(false);

  const labels = ["", "Not great", "Okay", "Good", "Great", "Amazing!"];

  onMount(async () => {
    await authStore.bootstrap();
  });

  async function handleRate(rating: number) {
    selectedRating = rating;
    submitted = true;
    setTimeout(async () => {
      await appStore.handleRate(rating, authStore.userId, authStore.isGuest);
    }, 1200);
  }

  async function handleSkip() {
    await appStore.handleSkipRating(authStore.isGuest);
  }
</script>

{#if submitted && selectedRating}
  <div
    class="min-h-screen flex flex-col items-center justify-center px-5"
    style="background-color: #F9F6F1"
  >
    <Motion
      let:motion
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div use:motion class="text-center">
        <div
          class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style="background-color: #E8F5EE"
        >
          <Heart class="w-10 h-10" style="color: #006838" fill="#006838" />
        </div>
        <h2 style="font-size: 1.375rem; font-weight: 700; color: #1C2B1C">
          Thanks for the feedback!
        </h2>
        <p class="mt-2" style="font-size: 0.875rem; color: #7A6B5A">
          You rated your Fresh Box {selectedRating}/5
        </p>
        <div class="flex justify-center gap-1 mt-3">
          {#each [1, 2, 3, 4, 5] as star}
            <Star
              class="w-6 h-6"
              style="color: {star <= selectedRating ? '#F59E0B' : '#E5E7EB'}"
              fill={star <= selectedRating ? "#F59E0B" : "none"}
            />
          {/each}
        </div>
      </div>
    </Motion>
  </div>
{:else}
  <div class="min-h-screen flex flex-col" style="background-color: #F9F6F1">
    <div class="px-5 pt-14 pb-4 text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style="background-color: #E8F5EE"
      >
        <Leaf class="w-8 h-8" style="color: #006838" />
      </div>
      <h1 style="font-size: 1.5rem; font-weight: 700; color: #1C2B1C">How was your Fresh Box?</h1>
      <p class="mt-1" style="font-size: 0.875rem; color: #7A6B5A">
        Quick tap helps us make it better
      </p>
    </div>

    <div class="flex-1 flex flex-col items-center justify-center px-5">
      <div
        class="rounded-2xl p-8 w-full max-w-sm text-center"
        style="background-color: white; border: 1px solid rgba(0,104,56,0.1)"
      >
        <div class="flex justify-center gap-3 mb-4">
          {#each [1, 2, 3, 4, 5] as star}
            <button onclick={() => handleRate(star)} class="p-1">
              <Star
                class="w-10 h-10"
                style="color: {selectedRating && star <= selectedRating ? '#F59E0B' : '#E5E7EB'}"
                fill={selectedRating && star <= selectedRating ? "#F59E0B" : "none"}
              />
            </button>
          {/each}
        </div>
        {#if selectedRating}
          <p style="font-size: 0.875rem; font-weight: 500; color: #006838">
            {labels[selectedRating]}
          </p>
        {/if}
      </div>

      <button onclick={handleSkip} class="mt-6" style="font-size: 0.875rem; color: #7A6B5A"
        >Skip for now</button
      >
    </div>

    <div class="px-5 pb-24">
      <div class="rounded-xl p-3.5" style="background-color: #E8F5EE">
        <div class="flex items-start gap-2">
          <Leaf class="w-4 h-4 mt-0.5 shrink-0" style="color: #006838" />
          <p style="font-size: 0.8rem; color: #004D28">
            You just saved approximately 1 lb of food from going to waste. Every box counts.
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
