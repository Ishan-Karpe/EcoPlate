import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			kit: {
				adapterFallback: '404.html',
				spa: true
			},
			manifest: {
				name: 'EcoPlate',
				short_name: 'EcoPlate',
				description: 'Campus food rescue — $3-$5 meals, right on campus',
				theme_color: '#16a34a',
				background_color: '#f8faf8',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: '/icon-192x192.svg',
						sizes: '192x192',
						type: 'image/svg+xml'
					},
					{
						src: '/icon-512x512.svg',
						sizes: '512x512',
						type: 'image/svg+xml'
					},
					{
						src: '/icon-maskable.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true
	}
});
