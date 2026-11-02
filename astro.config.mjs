import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import tailwindcss from "@tailwindcss/vite";
import { homedir } from "node:os";
import { join } from "node:path";

const localStatePath = process.env.EMDASH_LOCAL_STATE_PATH ??
	join(homedir(), ".local", "share", "by-the-boys-bakery", "wrangler");

export default defineConfig({
	output: "server",
	adapter: cloudflare({
		remoteBindings: false,
		persistState: { path: localStatePath },
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
