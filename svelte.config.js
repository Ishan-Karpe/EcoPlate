import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html',
			precompress: true
		}),
		serviceWorker: {
			register: false
		},
		prerender: {
			handleMissingId: 'ignore',
			handleHttpError: 'ignore',
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
