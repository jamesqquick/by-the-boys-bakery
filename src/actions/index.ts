import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";

export const server = {
	submitInquiry: defineAction({
		accept: "form",
		input: z.object({
			name: z.string().min(1, "Name is required"),
			email: z.string().email("A valid email address is required"),
			phone: z.string().nullable().optional(),
			occasion: z.string().min(1, "Occasion is required"),
			date: z.string().min(1, "Date is required"),
			// Multiple checked boxes arrive as repeated fields → array
			treats: z.array(z.string()).optional().default([]),
			quantity: z.string().min(1, "Quantity is required"),
			budget: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
		}),
		handler: async (input) => {
			const { name, email, phone, occasion, date, treats, quantity, budget, notes } = input;

			const treatsText = treats.length > 0 ? treats.join(", ") : "Not specified";
			const subject = `New Inquiry from ${name} — ${occasion} on ${date}`;

			const html = `
				<h2 style="font-family:sans-serif;color:#3b1f0c;">New Bakery Inquiry</h2>
				<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:480px;">
					${row("Name", name)}
					${row("Email", `<a href="mailto:${email}">${email}</a>`)}
					${phone ? row("Phone", phone) : ""}
					${row("Occasion", occasion)}
					${row("Date needed", date)}
					${row("Treats", treatsText)}
					${row("Quantity", quantity)}
					${budget ? row("Budget", budget) : ""}
					${notes ? row("Notes", notes) : ""}
				</table>
			`;

			const text = [
				"New Bakery Inquiry",
				"",
				`Name: ${name}`,
				`Email: ${email}`,
				phone ? `Phone: ${phone}` : null,
				`Occasion: ${occasion}`,
				`Date needed: ${date}`,
				`Treats: ${treatsText}`,
				`Quantity: ${quantity}`,
				budget ? `Budget: ${budget}` : null,
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
					occasion,
					date,
					treats,
					quantity,
					budget,
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
			<td style="padding:8px 12px;font-weight:bold;background:#fdf6e3;border:1px solid #d4b896;white-space:nowrap;">${label}</td>
			<td style="padding:8px 12px;border:1px solid #d4b896;">${value}</td>
		</tr>`;
}
