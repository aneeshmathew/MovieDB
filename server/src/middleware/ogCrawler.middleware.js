// Known social/link-preview crawler user agents. Not an exhaustive list —
// covers the platforms people actually paste MovieDB links into.
const BOT_USER_AGENT_PATTERNS = [
  /facebookexternalhit/i,
  /Twitterbot/i,
  /Slackbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /Discordbot/i,
  /TelegramBot/i,
  /Pinterest/i,
  /redditbot/i,
  /vkShare/i,
  /Applebot/i,
  /Googlebot/i,
  /Bingbot/i,
];

function isCrawler(userAgent = "") {
  return BOT_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// TMDB overviews/titles can contain quotes, ampersands, etc. — escape before
// interpolating into HTML attributes to avoid breaking markup or, worse,
// enabling injection via crawler-rendered pages.
function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(str = "", maxLength) {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1).trimEnd()}…`;
}

// Renders a minimal, crawler-only HTML shell with Open Graph + Twitter Card
// meta tags. Real users never see this — see the route handler for the
// isCrawler() branch that decides who gets this vs. the real SPA.
function renderOgHtml({ title, description, imageUrl, pageUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(truncate(description || "", 200));
  const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : null;
  const safePageUrl = escapeHtml(pageUrl);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle} — MovieDB</title>
    <meta property="og:type" content="video.movie" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safePageUrl}" />
    ${safeImageUrl ? `<meta property="og:image" content="${safeImageUrl}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    ${safeImageUrl ? `<meta name="twitter:image" content="${safeImageUrl}" />` : ""}
  </head>
  <body>
    <p>${safeTitle}</p>
  </body>
</html>`;
}

module.exports = { isCrawler, renderOgHtml, truncate, escapeHtml, BOT_USER_AGENT_PATTERNS };
