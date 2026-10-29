import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";
import { getEmDashCollection } from "emdash";
import { getPricingOptions } from "../lib/pricing-options";
import type { CatalogProduct } from "../lib/seasonal-campaigns";
import { getActiveCampaign, getCampaignProducts } from "../lib/seasonal-campaigns";
import {
	formatInquiryPrice,
	InquiryPricingError,
	makeInquiryPackages,
	priceInquiry,
} from "../lib/inquiry-pricing";

export const server = {
	submitInquiry: defineAction({
		accept: "form",
		input: z.object({
			name: z.string().min(1, "Name is required"),
			email: z.string().email("A valid email address is required"),
			phone: z.string().nullable().optional(),
			occasion: z.string().min(1, "Occasion is required"),
			date: z.string().min(1, "Date is required"),
			quantity: z.string().min(1, "Quantity is required"),
			order: z.string().max(5000),
			notes: z.string().nullable().optional(),
			campaign: z.string().max(100).nullable().optional(),
		}),
		handler: async (input) => {
			const { name, email, phone, occasion, date, quantity, order, notes, campaign } = input;
			const optionsResult = await getPricingOptions("published");
			if (optionsResult.error) {
				throw new ActionError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Pricing is unavailable right now. Please try again shortly.",
				});
			}

			let items: CatalogProduct[];
			let campaignTitle: string | undefined;

			if (campaign) {
				const campaignResult = await getActiveCampaign(campaign);
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

				const productsResult = await getCampaignProducts(campaignResult.campaign.data.id);
				if (productsResult.error) {
					throw new ActionError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Seasonal pricing is unavailable right now. Please try again shortly.",
					});
				}

				campaignTitle = campaignResult.campaign.data.title;
				items = productsResult.products.map((product) => product.data);
			} else {
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
				items = itemsResult.entries
					.map((item) => item.data as CatalogProduct)
					.filter((item) => item.show_in_standard_catalog !== false);
			}

			let pricedOrder;
			try {
				pricedOrder = priceInquiry(
					order,
					makeInquiryPackages(
						items,
						optionsResult.entries.map((option) => option.data),
					),
					notes ?? "",
				);
			} catch (error) {
				if (error instanceof InquiryPricingError) {
					throw new ActionError({ code: "BAD_REQUEST", message: error.message });
				}
				throw error;
			}

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
			const subject = `New${campaignTitle ? ` ${campaignTitle}` : ""} Inquiry from ${name} — ${occasion} on ${date}`;

			const html = `
				<h2 style="font-family:sans-serif;color:#3b1f0c;">New Bakery Inquiry</h2>
				<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:480px;">
					${row("Name", name)}
					${row("Email", email)}
					${phone ? row("Phone", phone) : ""}
					${campaignTitle ? row("Seasonal campaign", campaignTitle) : ""}
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
				campaignTitle ? `Seasonal campaign: ${campaignTitle}` : null,
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

			if (!env.EMAIL) {
				console.info("[inquiry] EMAIL binding not available — would have sent:", {
					to: "james.q.quick@gmail.com",
					subject,
					name,
					email,
					phone,
					campaign: campaignTitle,
					occasion,
					date,
					lines,
					quantity,
					estimate,
					notes,
				});
			} else {
				try {
					await env.EMAIL.send({
						to: "james.q.quick@gmail.com",
						from: { email: "hello@bytheboysbakery.com", name: "By the Boys Bakery" },
						replyTo: email,
						subject,
						html,
						text,
					});
				} catch (err) {
					console.error("Email send failed:", err);
					throw new ActionError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to send your inquiry. Please try again.",
					});
				}
			}

			return { success: true as const };
		},
	}),
};

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
