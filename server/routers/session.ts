import { z } from "zod";
import * as cheerio from "cheerio";
import { publicProcedure, router } from "../_core/trpc";

export const sessionRouter = router({
  /**
   * Fetch a URL server-side and extract readable text content.
   * Returns the cleaned body text (up to 12 000 chars) for use as AI source material.
   */
  fetchUrl: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const res = await fetch(input.url, {
        headers: {
          // Mimic a browser so sites don't block the request
          "User-Agent":
            "Mozilla/5.0 (compatible; SessionBuilder/1.0; +https://sessionbuild.manus.space)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch URL: HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("html")) {
        // For plain text / PDF links just return the raw text
        const text = await res.text();
        return { text: text.slice(0, 12_000) };
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Remove noise elements
      $(
        "script, style, noscript, nav, footer, header, aside, [role=navigation], [role=banner], [role=complementary], .nav, .navbar, .footer, .header, .sidebar, .menu, .cookie, .ad, .advertisement"
      ).remove();

      // Prefer <article> or <main>, fall back to <body>
      const container =
        $("article").first().text() ||
        $("main").first().text() ||
        $("body").text();

      // Collapse whitespace
      const cleaned = container
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12_000);

      if (!cleaned) {
        throw new Error("No readable text found on that page.");
      }

      return { text: cleaned };
    }),
});
