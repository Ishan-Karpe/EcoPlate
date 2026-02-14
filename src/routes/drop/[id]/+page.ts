import { MOCK_DROPS } from '$lib/data';
import type { EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => MOCK_DROPS.map((drop) => ({ id: drop.id }));
