import { test, expect } from '@playwright/test';

test.describe('Student Flow', () => {
	test('complete reservation flow', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('EcoPlate')).toBeVisible();
		await expect(page.getByText('Available now')).toBeVisible();

		const firstDropCard = page.locator('button').filter({ hasText: 'North Dining Hall' }).first();
		await firstDropCard.click();
		await expect(page).toHaveURL(/\/drop\/drop-1/);

		await expect(page.getByText('North Dining Hall')).toBeVisible();
		await expect(page.getByText('Reserve My Box')).toBeVisible();
		await page.getByText('Reserve My Box').click();

		await expect(page).toHaveURL(/\/drop\/drop-1\/reserve/);
		await expect(page.getByText('Confirm your box')).toBeVisible();
		await expect(page.getByText('Payment method')).toBeVisible();

		await page.getByRole('button', { name: /Confirm Reservation|Pay.*Reserve|Use.*Credit.*Reserve/ }).click();

		await expect(page).toHaveURL(/\/pickup\//);
		await expect(page.getByText('You rescued a meal!')).toBeVisible();

		const codeElement = page.locator('.font-mono.text-primary');
		await expect(codeElement).toBeVisible();
		const code = await codeElement.textContent();
		expect(code).toHaveLength(6);

		await page.getByText('I Picked Up My Box').click();
		await expect(page).toHaveURL('/rating');

		await expect(page.getByText('How was your Rescue Box?')).toBeVisible();
		const stars = page.locator('button').filter({ has: page.locator('svg') });
		await stars.nth(3).click();

		await expect(page.getByText(/Thanks|Thank you/)).toBeVisible({ timeout: 3000 });
		await expect(page).toHaveURL('/account', { timeout: 5000 });

		await page.getByRole('button', { name: /Maybe later|Browse|Skip|Back to drops/ }).click();
		await expect(page).toHaveURL('/');
	});

	test('staff button navigates to admin', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Staff' }).click();
		await expect(page).toHaveURL('/admin');
	});

	test('back button on drop detail returns to landing', async ({ page }) => {
		await page.goto('/drop/drop-1');
		await page.getByRole('button', { name: 'All drops' }).click();
		await expect(page).toHaveURL('/');
	});
});

test.describe('Admin Flow', () => {
	test('complete admin login and navigation', async ({ page }) => {
		await page.goto('/admin');
		await expect(page.getByText(/Staff PIN|Enter your PIN|PIN/i)).toBeVisible();

		const digitButtons = page.locator('button').filter({ hasText: /^[0-9]$/ });
		await digitButtons.filter({ hasText: '1' }).click();
		await digitButtons.filter({ hasText: '2' }).click();
		await digitButtons.filter({ hasText: '3' }).click();
		await digitButtons.filter({ hasText: '4' }).click();

		await expect(page).toHaveURL('/admin/dashboard', { timeout: 3000 });
		await expect(page.getByText('EcoPlate Staff')).toBeVisible();

		await page.getByRole('button', { name: /New Drop/i }).click();
		await expect(page).toHaveURL('/admin/create');
		await page.goBack();

		await page.getByRole('button', { name: /Redeem/i }).click();
		await expect(page).toHaveURL('/admin/redeem');
		await page.goBack();

		await page.getByRole('button', { name: /No-shows/i }).click();
		await expect(page).toHaveURL('/admin/no-shows');
		await page.goBack();

		await page.getByRole('button', { name: /Exit|Back|Home/i }).click();
		await expect(page).toHaveURL('/');
	});
});

test.describe('Navigation Guards', () => {
	test('invalid pickup ID redirects to home', async ({ page }) => {
		await page.goto('/pickup/invalid-id');
		await expect(page).toHaveURL('/', { timeout: 3000 });
	});

	test('invalid drop ID redirects to home', async ({ page }) => {
		await page.goto('/drop/nonexistent');
		await expect(page).toHaveURL('/', { timeout: 3000 });
	});
});
