import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";
import { getEmDashCollection } from "emdash";
import { getPricingOptions } from "../lib/pricing-options";
import { inquiryReferralSources } from "../lib/inquiry-referral-sources";
import type { CatalogProduct } from "../lib/seasonal-campaigns";
import { getActiveCampaign, getCampaignProducts } from "../lib/seasonal-campaigns";
import {
	formatInquiryPrice,
	InquiryPricingError,
	makeInquiryPackages,
	priceInquiry,
} from "../lib/inquiry-pricing";

const contactFields = {
	name: z.string().min(1, "Name is required"),
	email: z.string().email("A valid email address is required"),
	phone: z.string().nullable().optional(),
	referralSource: z.enum(inquiryReferralSources).or(z.literal("")).optional(),
	referralSourceDetails: z.string().nullable().optional(),
};

const requestFields = {
	order: z.string().max(5000),
	notes: z.string().nullable().optional(),
};

export const server = {
	submitInquiry: defineAction({
		accept: "form",
		input: z.object({
			...contactFields,
			...requestFields,
			occasion: z.string().min(1, "Occasion is required"),
			date: z.string().min(1, "Date is required"),
			quantity: z.string().min(1, "Quantity is required"),
		}),
		handler: async ({ name, email, phone, referralSource, referralSourceDetails, occasion, date, quantity, order, notes }) => {
			const items = await getStandardItems();
			const pricedOrder = await priceSelectedOrder(items, order, notes);
			const { lines, estimate } = describeOrder(pricedOrder);
			const referralSourceAnswer = describeReferralSource(referralSource, referralSourceDetails);
			const subject = `New Inquiry from ${name} — ${occasion} on ${date}`;
			const html = `
				<h2 style="font-family:sans-serif;color:#3b1f0c;">New Bakery Inquiry</h2>
				<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:480px;">
					${row("Name", name)}
					${row("Email", email)}
					${phone ? row("Phone", phone) : ""}
					${referralSourceAnswer ? row("How did you hear about us?", referralSourceAnswer) : ""}
					${row("Occasion", occasion)}
					${row("Date needed", date)}
					${row("Guests", quantity)}
					${row("Requested packages", lines.length > 0 ? lines.join("\n") : "Custom request (see notes)")}
					${row("Estimated subtotal", estimate)}
					${notes ? row("Notes", notes) : ""}
				</table>
				<p style="font-family:sans-serif;">Estimate covers standard packages only. Confirm availability and final price with the customer.</p>
			`;
			const text = [
				"New Bakery Inquiry",
				"",
				`Name: ${name}`,
				`Email: ${email}`,
				phone ? `Phone: ${phone}` : null,
				referralSourceAnswer ? `How did you hear about us: ${referralSourceAnswer}` : null,
				`Occasion: ${occasion}`,
				`Date needed: ${date}`,
				`Guests: ${quantity}`,
				"Requested packages:",
				...(lines.length > 0 ? lines : ["Custom request (see notes)"]),
				`Estimated subtotal: ${estimate}`,
				"Estimate covers standard packages only. Confirm availability and final price with the customer.",
				notes ? `Notes: ${notes}` : null,
			]
				.filter((line) => line !== null)
				.join("\n");

			await sendInquiryEmail({
				replyTo: email,
				subject,
				html,
				text,
				logDetails: { name, email, phone, referralSource, referralSourceDetails, occasion, date, quantity, lines, estimate, notes },
			});

			return { success: true as const };
		},
	}),

	submitSeasonalInquiry: defineAction({
		accept: "form",
		input: z.object({
			...contactFields,
			...requestFields,
			campaign: z.string().min(1, "Campaign is required").max(100),
		}),
		handler: async ({ name, email, phone, referralSource, referralSourceDetails, campaign, order, notes }) => {
			const { title: campaignTitle, items } = await getCampaignItems(campaign);
			const pricedOrder = await priceSelectedOrder(items, order, notes, false);
			const { lines, estimate } = describeOrder(pricedOrder);
			const referralSourceAnswer = describeReferralSource(referralSource, referralSourceDetails);
			const subject = `New ${campaignTitle} Inquiry from ${name}`;
			const html = `
				<h2 style="font-family:sans-serif;color:#3b1f0c;">New Seasonal Inquiry</h2>
				<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:480px;">
					${row("Name", name)}
					${row("Email", email)}
					${phone ? row("Phone", phone) : ""}
					${referralSourceAnswer ? row("How did you hear about us?", referralSourceAnswer) : ""}
					${row("Seasonal campaign", campaignTitle)}
					${row("Requested packages", lines.join("\n"))}
					${row("Estimated subtotal", estimate)}
					${notes ? row("Notes", notes) : ""}
				</table>
				<p style="font-family:sans-serif;">Confirm availability and final price with the customer.</p>
			`;
			const text = [
				"New Seasonal Inquiry",
				"",
				`Name: ${name}`,
				`Email: ${email}`,
				phone ? `Phone: ${phone}` : null,
				referralSourceAnswer ? `How did you hear about us: ${referralSourceAnswer}` : null,
				`Seasonal campaign: ${campaignTitle}`,
				"Requested packages:",
				...lines,
				`Estimated subtotal: ${estimate}`,
				"Confirm availability and final price with the customer.",
				notes ? `Notes: ${notes}` : null,
			]
				.filter((line) => line !== null)
				.join("\n");

			await sendInquiryEmail({
				replyTo: email,
				subject,
				html,
				text,
				logDetails: { name, email, phone, referralSource, referralSourceDetails, campaign: campaignTitle, lines, estimate, notes },
			});

			return { success: true as const };
		},
	}),
};

async function getStandardItems(): Promise<CatalogProduct[]> {
	const itemsResult = await getEmDashCollection("pricing_items", {
		status: "published",
		orderBy: { sort: "asc" },
	});
	if (itemsResult.error) {
		throw new ActionError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Pricing is unavailable right now. Please try again shortly.",
		});
	}

	return itemsResult.entries
		.map((item) => item.data as CatalogProduct)
		.filter((item) => item.show_in_standard_catalog !== false);
}

async function getCampaignItems(campaignSlug: string): Promise<{ title: string; items: CatalogProduct[] }> {
	const campaignResult = await getActiveCampaign(campaignSlug);
	if (campaignResult.error) {
		throw new ActionError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Seasonal pricing is unavailable right now. Please try again shortly.",
		});
	}
	if (!campaignResult.campaign) {
		throw new ActionError({
			code: "BAD_REQUEST",
			message: "This seasonal special is no longer accepting requests.",
		});
	}

	const productsResult = await getCampaignProducts(campaignResult.campaign.id);
	if (productsResult.error) {
		throw new ActionError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Seasonal pricing is unavailable right now. Please try again shortly.",
		});
	}

	return {
		title: campaignResult.campaign.data.title,
		items: productsResult.products.map((product) => product.data),
	};
}

async function priceSelectedOrder(
	items: CatalogProduct[],
	order: string,
	notes: string | null | undefined,
	allowCustomRequest = true,
) {
	const optionsResult = await getPricingOptions("published");
	if (optionsResult.error) {
		throw new ActionError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Pricing is unavailable right now. Please try again shortly.",
		});
	}

	try {
		return priceInquiry(
			order,
			makeInquiryPackages(items, optionsResult.entries.map((option) => option.data)),
			notes ?? "",
			allowCustomRequest,
		);
	} catch (error) {
		if (error instanceof InquiryPricingError) {
			throw new ActionError({ code: "BAD_REQUEST", message: error.message });
		}
		throw error;
	}
}

function describeOrder(pricedOrder: ReturnType<typeof priceInquiry>) {
	const lines = pricedOrder.lines.map((line) => line.amount === null
		? `${line.title} — ${line.label}: ${line.quantity} × quote required`
		: `${line.title} — ${line.label}: ${line.quantity} × ${formatInquiryPrice(line.amount)} = ${formatInquiryPrice(line.lineTotal ?? 0)}`,
	);
	const hasQuotedItems = pricedOrder.lines.some((line) => line.amount === null);
	const estimate = pricedOrder.lines.length > 0
		? pricedOrder.total > 0
			? `${formatInquiryPrice(pricedOrder.total)}${hasQuotedItems ? " plus quoted items" : ""}`
			: "Quote to follow"
		: "Custom request — quote to follow";

	return { lines, estimate };
}

function describeReferralSource(
	referralSource: string | undefined,
	referralSourceDetails: string | null | undefined,
): string | undefined {
	if (referralSource !== "Other") return referralSource || undefined;

	const details = referralSourceDetails?.trim();
	return details ? `Other — ${details}` : "Other";
}

interface InquiryEmail {
	replyTo: string;
	subject: string;
	html: string;
	text: string;
	logDetails: Record<string, unknown>;
}

async function sendInquiryEmail({ replyTo, subject, html, text, logDetails }: InquiryEmail) {
	if (!env.EMAIL) {
		console.info("[inquiry] EMAIL binding not available — would have sent:", {
			to: "james.q.quick@gmail.com",
			subject,
			...logDetails,
		});
		return;
	}

	try {
		await env.EMAIL.send({
			to: "james.q.quick@gmail.com",
			from: { email: "hello@bytheboysbakery.com", name: "By the Boys Bakery" },
			replyTo,
			subject,
			html,
			text,
		});
	} catch (error) {
		console.error("Email send failed:", error);
		throw new ActionError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to send your inquiry. Please try again.",
		});
	}
}

function row(label: string, value: string): string {
	return `
		<tr>
			<td style="padding:8px 12px;font-weight:bold;background:#fdf6e3;border:1px solid #d4b896;white-space:nowrap;">${escapeHtml(label)}</td>
			<td style="padding:8px 12px;border:1px solid #d4b896;white-space:pre-line;">${escapeHtml(value)}</td>
		</tr>`;
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	})[char] ?? char);
}
