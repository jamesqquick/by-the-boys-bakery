export function getMetadataImage(data: unknown, origin: string): string | null {
	if (!data || typeof data !== "object") return null;

	const metadataImage = (data as {
		metadata_image?: {
			id?: string;
			src?: string;
			previewUrl?: string;
			meta?: Record<string, unknown>;
		} | null;
	}).metadata_image;
	const storageKey = typeof metadataImage?.meta?.storageKey === "string"
		? metadataImage.meta.storageKey
		: null;
	const imagePath = metadataImage?.src ??
		(storageKey ? `/_emdash/api/media/file/${storageKey}` : metadataImage?.previewUrl);

	if (!imagePath || /\s/.test(imagePath) || imagePath.startsWith("//")) return null;

	try {
		const url = new URL(imagePath, origin);
		return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
	} catch {
		return null;
	}
}
