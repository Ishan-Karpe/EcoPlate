import { toast } from 'svelte-sonner';
import { browser } from '$app/environment';
import { MOCK_DROPS, MOCK_USER, MOCK_STATS } from '$lib/data';
import type { Drop, Reservation, UserState, AdminStats } from '$lib/types';
import { generatePickupCode } from '$lib/types';

// ============================================================================
// localStorage Helpers (SSR-safe)
// ============================================================================

function persistToLocalStorage(key: string, value: unknown): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.warn(`Failed to persist ${key} to localStorage:`, e);
	}
}

function loadFromLocalStorage<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : fallback;
	} catch (e) {
		console.warn(`Failed to load ${key} from localStorage:`, e);
		return fallback;
	}
}

function clearLocalStorage(): void {
	if (!browser) return;
	try {
		localStorage.removeItem('ecoplate-user');
		localStorage.removeItem('ecoplate-reservation');
		localStorage.removeItem('ecoplate-theme');
		localStorage.removeItem('ecoplate-has-completed-first-pickup');
		localStorage.removeItem('ecoplate-drops');
	} catch (e) {
		console.warn('Failed to clear localStorage:', e);
	}
}

// ============================================================================
// Debounce Helper for Write Batching
// ============================================================================

const persistenceTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedPersist(key: string, value: unknown, delayMs = 500): void {
	const existingTimeout = persistenceTimeouts.get(key);
	if (existingTimeout) {
		clearTimeout(existingTimeout);
	}

	const timeout = setTimeout(() => {
		persistToLocalStorage(key, value);
		persistenceTimeouts.delete(key);
	}, delayMs);

	persistenceTimeouts.set(key, timeout);
}

// ============================================================================
// State Initialization (with localStorage fallback)
// ============================================================================

let drops = $state<Drop[]>(loadFromLocalStorage<Drop[]>('ecoplate-drops', MOCK_DROPS));
let selectedDrop = $state<Drop | null>(null);
let reservation = $state<Reservation | null>(
	loadFromLocalStorage<Reservation | null>('ecoplate-reservation', null)
);
let user = $state<UserState>(loadFromLocalStorage<UserState>('ecoplate-user', MOCK_USER));
let theme = $state<'light' | 'dark' | 'system'>(
	loadFromLocalStorage<'light' | 'dark' | 'system'>('ecoplate-theme', 'system')
);
let hasCompletedFirstPickup = $state<boolean>(
	loadFromLocalStorage<boolean>('ecoplate-has-completed-first-pickup', false)
);
let validCodes = $state<string[]>([]);
let expiredCodes = $state<string[]>(['EXP123', 'OLD456']);
let recentRedemptions = $state<{ code: string; time: string }[]>([
	{ code: 'XK7M2P', time: '8:15 PM' },
	{ code: 'B4N9QR', time: '8:27 PM' },
	{ code: 'T5W8JL', time: '8:39 PM' }
]);
let stats = $state<AdminStats>(MOCK_STATS);

// ============================================================================
// Persistence Effects (debounced writes)
// ============================================================================

$effect.root(() => {
	$effect(() => {
		// Persist user state whenever it changes
		debouncedPersist('ecoplate-user', user);
	});

	$effect(() => {
		// Persist reservation state whenever it changes
		debouncedPersist('ecoplate-reservation', reservation);
	});

	$effect(() => {
		// Persist drops state whenever it changes
		debouncedPersist('ecoplate-drops', drops);
	});

	$effect(() => {
		// Persist theme preference
		persistToLocalStorage('ecoplate-theme', theme);
	});

	$effect(() => {
		// Persist first pickup completion flag
		persistToLocalStorage('ecoplate-has-completed-first-pickup', hasCompletedFirstPickup);
	});
});

export const appState = {
	get drops() {
		return drops;
	},
	get selectedDrop() {
		return selectedDrop;
	},
	get reservation() {
		return reservation;
	},
	get user() {
		return user;
	},
	get validCodes() {
		return validCodes;
	},
	get expiredCodes() {
		return expiredCodes;
	},
	get recentRedemptions() {
		return recentRedemptions;
	},
	get stats() {
		return stats;
	},
	get theme() {
		return theme;
	},
	set theme(value: 'light' | 'dark' | 'system') {
		theme = value;
	},
	get hasCompletedFirstPickup() {
		return hasCompletedFirstPickup;
	},
	set hasCompletedFirstPickup(value: boolean) {
		hasCompletedFirstPickup = value;
	},

	selectDrop(drop: Drop) {
		selectedDrop = drop;
	},

	clearSelectedDrop() {
		selectedDrop = null;
	},

	joinWaitlist() {
		toast.success("You're on the waitlist!", {
			description: "We'll notify you if a box opens up at this location."
		});
	},

	confirmReservation(paymentMethod: 'card' | 'credit' | 'pay_at_pickup') {
		if (!selectedDrop) return null;

		const code = generatePickupCode();
		const newReservation: Reservation = {
			id: `res-${Date.now()}`,
			dropId: selectedDrop.id,
			pickupCode: code,
			status: 'reserved',
			createdAt: new Date().toISOString(),
			paymentMethod
		};
		reservation = newReservation;
		validCodes = [...validCodes, code];

		drops = drops.map((d) =>
			d.id === selectedDrop!.id
				? {
						...d,
						remainingBoxes: Math.max(0, d.remainingBoxes - 1),
						reservedBoxes: d.reservedBoxes + 1
					}
				: d
		);

		selectedDrop = {
			...selectedDrop,
			remainingBoxes: Math.max(0, selectedDrop.remainingBoxes - 1),
			reservedBoxes: selectedDrop.reservedBoxes + 1
		};

		if (paymentMethod === 'credit') {
			user = { ...user, creditsRemaining: Math.max(0, user.creditsRemaining - 1) };
		}

		stats = { ...stats, totalReservations: stats.totalReservations + 1 };

		hasCompletedFirstPickup = true;

		return newReservation;
	},

	cancelReservation() {
		if (!reservation || !selectedDrop) return;

		drops = drops.map((d) =>
			d.id === selectedDrop!.id
				? {
						...d,
						remainingBoxes: d.remainingBoxes + 1,
						reservedBoxes: Math.max(0, d.reservedBoxes - 1)
					}
				: d
		);

		validCodes = validCodes.filter((c) => c !== reservation!.pickupCode);
		expiredCodes = [...expiredCodes, reservation!.pickupCode];

		if (reservation.paymentMethod === 'credit') {
			user = { ...user, creditsRemaining: user.creditsRemaining + 1 };
		}

		reservation = null;
		toast.success('Reservation cancelled', {
			description: 'Your box has been released for someone else.'
		});
	},

	markPickedUp() {
		if (reservation) {
			reservation = { ...reservation, status: 'picked_up' };
		}
	},

	submitRating(rating: number) {
		if (reservation) {
			reservation = { ...reservation, rating };
		}
		user = { ...user, totalPickups: user.totalPickups + 1 };
	},

	skipRating() {
		user = { ...user, totalPickups: user.totalPickups + 1 };
	},

	signUp(plan: 'none' | 'basic' | 'premium') {
		const updated: UserState = {
			...user,
			hasAccount: true,
			isFirstTime: false
		};

		if (plan === 'basic') {
			updated.membership = {
				plan: 'basic',
				monthlyPrice: 15,
				creditsPerMonth: 7,
				earlyAccess: false,
				monthsUnderUsed: 0
			};
			updated.creditsRemaining = 7;
		} else if (plan === 'premium') {
			updated.membership = {
				plan: 'premium',
				monthlyPrice: 30,
				creditsPerMonth: 15,
				earlyAccess: true,
				monthsUnderUsed: 0
			};
			updated.creditsRemaining = 15;
		}

		user = updated;
		toast.success(
			plan === 'none'
				? 'Account created!'
				: `${plan === 'basic' ? 'Basic' : 'Premium'} plan activated!`,
			{
				description:
					plan === 'none'
						? "You'll get drop notifications and impact tracking."
						: `You now have ${plan === 'basic' ? 7 : 15} Rescue Credits this month.`
			}
		);
	},

	dismissAccount() {
		user = { ...user, isFirstTime: false };
	},

	createDrop(dropData: {
		location: string;
		boxes: number;
		windowStart: string;
		windowEnd: string;
		price: string;
		description: string;
	}) {
		const [priceMin, priceMax] = dropData.price.split('-').map(Number);
		const emojis = ['🍝', '🍜', '🥪', '🍖', '🥗', '🍛', '🌮'];
		const newDrop: Drop = {
			id: `drop-${Date.now()}`,
			location: dropData.location,
			locationDetail: 'Pickup window',
			date: new Date().toISOString().split('T')[0],
			windowStart: dropData.windowStart,
			windowEnd: dropData.windowEnd,
			totalBoxes: dropData.boxes,
			remainingBoxes: dropData.boxes,
			reservedBoxes: 0,
			priceMin,
			priceMax,
			status: 'active',
			description:
				dropData.description || "Tonight's Rescue Box: freshly prepared and packed by dining staff.",
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
			dailyCap: stats.locationCaps.find((c) => c.location === dropData.location)?.currentCap ?? 30,
			consecutiveWeeksAbove85:
				stats.locationCaps.find((c) => c.location === dropData.location)?.consecutiveWeeksAbove85 ??
				0
		};

		drops = [newDrop, ...drops];
		stats = {
			...stats,
			totalDrops: stats.totalDrops + 1,
			totalBoxesPosted: stats.totalBoxesPosted + dropData.boxes
		};
	},

	redeemCode(code: string) {
		validCodes = validCodes.filter((c) => c !== code);
		recentRedemptions = [
			{
				code,
				time: new Date().toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true
				})
			},
			...recentRedemptions
		];
		stats = {
			...stats,
			totalBoxesPickedUp: stats.totalBoxesPickedUp + 1,
			pickupRate: Math.round(((stats.totalBoxesPickedUp + 1) / stats.totalBoxesPosted) * 100)
		};
	},

	getDropById(id: string): Drop | undefined {
		return drops.find((d) => d.id === id);
	},

	isValidCode(code: string): boolean {
		return validCodes.includes(code);
	},

	isExpiredCode(code: string): boolean {
		return expiredCodes.includes(code);
	},

	resetState() {
		clearLocalStorage();
		drops = MOCK_DROPS;
		user = MOCK_USER;
		reservation = null;
		theme = 'system';
		hasCompletedFirstPickup = false;
		selectedDrop = null;
		validCodes = [];
		expiredCodes = ['EXP123', 'OLD456'];
		recentRedemptions = [
			{ code: 'XK7M2P', time: '8:15 PM' },
			{ code: 'B4N9QR', time: '8:27 PM' },
			{ code: 'T5W8JL', time: '8:39 PM' }
		];
		stats = MOCK_STATS;
		toast.success('State reset', {
			description: 'All data has been cleared and reset to defaults.'
		});
	}
};
