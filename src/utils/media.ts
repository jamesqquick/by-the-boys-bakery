// Resolve an EmDash image field to a usable <img> src.
//
// EmDash's query layer normalizes media objects but intentionally strips `src`
// for the local storage provider (see normalizeMediaValue in the emdash package),
// leaving the URL to be rebuilt from the storage key. This mirrors the internal
// media file endpoint the CMS uses everywhere, and also passes through an
// explicit `src` for external-provider media.
const INTERNAL_MEDIA_PREFIX = "/_emdash/api/media/file/";

export interface EmDashImage {
	id?: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	meta?: Record<string, unknown>;
}

export function mediaSrc(image?: EmDashImage | null): string | undefined {
	if (!image) return undefined;
	if (image.src) return image.src;
	const storageKey = image.meta?.storageKey;
	if (typeof storageKey === "string" && storageKey) {
		return `${INTERNAL_MEDIA_PREFIX}${storageKey}`;
	}
	return undefined;
}
