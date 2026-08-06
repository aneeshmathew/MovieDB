import { describe, it, expect } from "vitest";

const { isCrawler, renderOgHtml, truncate, escapeHtml } = require("../src/middleware/ogCrawler.middleware");

describe("isCrawler", () => {
  it.each([
    ["facebookexternalhit/1.1", true],
    ["Twitterbot/1.0", true],
    ["Slackbot-LinkExpanding 1.0", true],
    ["LinkedInBot/1.0", true],
    ["WhatsApp/2.23", true],
    ["Discordbot/2.0", true],
    ["TelegramBot (like TwitterBot)", true],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125", false],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", false],
    ["", false],
  ])("classifies %s as crawler=%s", (userAgent, expected) => {
    expect(isCrawler(userAgent)).toBe(expected);
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("short", 200)).toBe("short");
  });

  it("truncates long strings and appends an ellipsis", () => {
    const long = "a".repeat(250);
    const result = truncate(long, 200);
    expect(result.length).toBe(200);
    expect(result.endsWith("…")).toBe(true);
  });

  it("handles an empty string without throwing", () => {
    expect(truncate("", 200)).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes all five special characters", () => {
    expect(escapeHtml(`<script>alert("x") & 'y'</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;"
    );
  });

  it("handles an empty/undefined input without throwing", () => {
    expect(escapeHtml()).toBe("");
    expect(escapeHtml("")).toBe("");
  });
});

describe("renderOgHtml", () => {
  const base = {
    title: `A "Great" Movie & Sons`,
    description: "A story about <family> ties.",
    imageUrl: "/poster.jpg",
    pageUrl: "https://example.com/movies/278",
  };

  it("includes escaped title, description, and page URL in the meta tags", () => {
    const html = renderOgHtml(base);

    expect(html).toContain('og:title" content="A &quot;Great&quot; Movie &amp; Sons"');
    expect(html).toContain("og:description");
    expect(html).toContain("&lt;family&gt;");
    expect(html).toContain('og:url" content="https://example.com/movies/278"');
  });

  it("includes an og:image tag when imageUrl is provided", () => {
    const html = renderOgHtml(base);
    expect(html).toContain('og:image" content="/poster.jpg"');
    expect(html).toContain('twitter:image" content="/poster.jpg"');
  });

  it("omits the image meta tags entirely when imageUrl is null", () => {
    const html = renderOgHtml({ ...base, imageUrl: null });
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("twitter:image");
  });

  it("never leaves raw, unescaped quotes or angle brackets from the input in the output", () => {
    const html = renderOgHtml(base);
    // The only literal `<` characters allowed are real HTML tags we wrote
    // ourselves (meta, title, html, etc.) — none should come from the
    // movie's own title/description content.
    expect(html).not.toContain("<family>");
    expect(html).not.toContain(`"Great"`);
  });
});
