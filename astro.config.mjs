import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	output: "server",
	adapter: cloudflare({
		// Connects remote Cloudflare bindings (e.g. EMAIL) during local dev.
		// No effect on production builds. Set to false to log instead of send.
		remoteBindings: true,
	}),
	vite: {
		plugins: [tailwindcss()],
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	devToolbar: { enabled: false },
});
