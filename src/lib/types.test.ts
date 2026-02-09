import { describe, it, expect } from 'vitest';
import { generatePickupCode, formatTime } from './types';

describe('generatePickupCode', () => {
	it('returns a 6-character code', () => {
		const code = generatePickupCode();
		expect(code).toHaveLength(6);
	});

	it('only contains allowed characters (no I, O, 0, 1)', () => {
		const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		for (let i = 0; i < 100; i++) {
			const code = generatePickupCode();
			for (const char of code) {
				expect(allowedChars).toContain(char);
			}
		}
	});

	it('does not contain ambiguous characters (I, O, 0, 1)', () => {
		const ambiguous = ['I', 'O', '0', '1'];
		for (let i = 0; i < 100; i++) {
			const code = generatePickupCode();
			for (const char of ambiguous) {
				expect(code).not.toContain(char);
			}
		}
	});

	it('generates unique codes', () => {
		const codes = new Set<string>();
		for (let i = 0; i < 50; i++) {
			codes.add(generatePickupCode());
		}
		expect(codes.size).toBeGreaterThan(45);
	});
});

describe('formatTime', () => {
	it('formats morning time correctly', () => {
		expect(formatTime('09:30')).toBe('9:30 AM');
	});

	it('formats noon correctly', () => {
		expect(formatTime('12:00')).toBe('12:00 PM');
	});

	it('formats afternoon time correctly', () => {
		expect(formatTime('14:45')).toBe('2:45 PM');
	});

	it('formats midnight correctly', () => {
		expect(formatTime('00:00')).toBe('12:00 AM');
	});

	it('formats evening time correctly', () => {
		expect(formatTime('21:15')).toBe('9:15 PM');
	});

	it('pads single-digit minutes', () => {
		expect(formatTime('08:05')).toBe('8:05 AM');
	});
});
