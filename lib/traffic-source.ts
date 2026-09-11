export type TrafficCategory = "search" | "ai" | "social" | "referral" | "email" | "direct";

// Which broad bucket each specific site's label rolls up into, so the
// admin dashboard can show both "Search engines: 412" and, underneath,
// "Google: 380 / Bing: 32" without maintaining two separate lists.
const LABEL_CATEGORIES: Record<string, TrafficCategory> = {
  Google: "search",
  Bing: "search",
  DuckDuckGo: "search",
  Yahoo: "search",
  Baidu: "search",
  "ChatGPT / OpenAI": "ai",
  Perplexity: "ai",
  "Google Gemini": "ai",
  Claude: "ai",
  Reddit: "social",
  "X / Twitter": "social",
  Facebook: "social",
  LinkedIn: "social",
  Instagram: "social",
  Threads: "social",
  TikTok: "social",
  YouTube: "social",
  Pinterest: "social",
  Discord: "social",
  Telegram: "social",
  WhatsApp: "social",
  Slack: "social",
  Quora: "social",
  "Product Hunt": "referral",
  "Hacker News": "referral",
  Medium: "referral",
  GitHub: "referral",
  AlternativeTo: "referral",
  "There's An AI For That": "referral",
  Futurepedia: "referral",
  Newsletter: "email",
  Email: "email",
  "Direct / None": "direct",
};

function categoryForLabel(label: string): TrafficCategory {
  if (label in LABEL_CATEGORIES) return LABEL_CATEGORIES[label];
  // Anything unrecognized — "Other (somehost.com)" or a stray utm value —
  // is a genuine external referral we just don't have a named bucket for.
  return "referral";
}

export const CATEGORY_LABELS: Record<TrafficCategory, string> = {
  search: "Search engines",
  ai: "AI tools",
  social: "Social media",
  referral: "Referral / other sites",
  email: "Email / newsletter",
  direct: "Direct / None",
};

const OWN_HOSTS = ["aipick.site", "www.aipick.site", "localhost"];

const SOURCE_PATTERNS: { label: string; hosts: string[] }[] = [
  { label: "Google", hosts: ["google."] },
  { label: "Bing", hosts: ["bing.com"] },
  { label: "DuckDuckGo", hosts: ["duckduckgo.com"] },
  { label: "Yahoo", hosts: ["search.yahoo.", "yahoo.com"] },
  { label: "Baidu", hosts: ["baidu.com"] },
  { label: "ChatGPT / OpenAI", hosts: ["chat.openai.com", "chatgpt.com", "openai.com"] },
  { label: "Perplexity", hosts: ["perplexity.ai"] },
  { label: "Google Gemini", hosts: ["gemini.google.com"] },
  { label: "Claude", hosts: ["claude.ai"] },
  { label: "Reddit", hosts: ["reddit.com"] },
  { label: "X / Twitter", hosts: ["twitter.com", "x.com", "t.co"] },
  { label: "Facebook", hosts: ["facebook.com", "fb.com", "m.facebook.com"] },
  { label: "LinkedIn", hosts: ["linkedin.com", "lnkd.in"] },
  { label: "Instagram", hosts: ["instagram.com"] },
  { label: "Threads", hosts: ["threads.net"] },
  { label: "TikTok", hosts: ["tiktok.com"] },
  { label: "Product Hunt", hosts: ["producthunt.com"] },
  { label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { label: "Pinterest", hosts: ["pinterest.com", "pin.it"] },
  { label: "Hacker News", hosts: ["news.ycombinator.com"] },
  { label: "Quora", hosts: ["quora.com"] },
  { label: "Medium", hosts: ["medium.com"] },
  { label: "Discord", hosts: ["discord.com", "discordapp.com"] },
  { label: "Telegram", hosts: ["t.me", "telegram.org", "telegram.me"] },
  { label: "WhatsApp", hosts: ["whatsapp.com", "wa.me"] },
  { label: "Slack", hosts: ["slack.com"] },
  { label: "GitHub", hosts: ["github.com"] },
  { label: "AlternativeTo", hosts: ["alternativeto.net"] },
  { label: "There's An AI For That", hosts: ["theresanaiforthat.com"] },
  { label: "Futurepedia", hosts: ["futurepedia.io"] },
];

// Well-known referring-site UTM `utm_source` values, used as a fallback
// when no `referer`/`document.referrer` reached us at all (many social
// apps and some browsers strip the header per their Referrer-Policy, but
// links out of those apps are often tagged with UTM params instead).
const UTM_SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  chatgpt: "ChatGPT / OpenAI",
  openai: "ChatGPT / OpenAI",
  perplexity: "Perplexity",
  reddit: "Reddit",
  twitter: "X / Twitter",
  x: "X / Twitter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  threads: "Threads",
  tiktok: "TikTok",
  producthunt: "Product Hunt",
  youtube: "YouTube",
  pinterest: "Pinterest",
  newsletter: "Newsletter",
  email: "Email",
};

function hostFromReferrer(rawReferrer: string): string | null {
  try {
    return new URL(rawReferrer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Classifies a raw `referer`/`document.referrer` value (and, as a
// fallback, a path's own `utm_source` query param) into a human-readable
// traffic source. Returns "Direct / None" for empty referrers or
// same-site navigation, and "Other (<host>)" for a real but unrecognized
// external referrer — the host is always preserved so nothing gets
// collapsed into an unlabeled bucket.
// Classifies a raw `referer`/`document.referrer` value (and, as a
// fallback, a path's own `utm_source` query param) into a human-readable
// traffic source, plus which broad category it belongs to (search / AI
// tool / social media / referral / email / direct). Returns
// "Direct / None" for empty referrers or same-site navigation, and
// "Other (<host>)" for a real but unrecognized external referrer — the
// host is always preserved so nothing gets collapsed into an unlabeled
// bucket.
export function classifyReferrer(
  rawReferrer: string | null | undefined,
  path?: string | null
): { label: string; category: TrafficCategory } {
  const label = classifyReferrerLabel(rawReferrer, path);
  return { label, category: categoryForLabel(label) };
}

function classifyReferrerLabel(
  rawReferrer: string | null | undefined,
  path?: string | null
): string {
  const host = rawReferrer ? hostFromReferrer(rawReferrer) : null;

  if (host) {
    if (OWN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return "Direct / None";
    }
    for (const { label, hosts } of SOURCE_PATTERNS) {
      if (hosts.some((h) => host.includes(h))) return label;
    }
    return `Other (${host})`;
  }

  // No referrer at all — check for a utm_source on the visited path
  // before giving up and calling it Direct.
  if (path) {
    try {
      const utmSource = new URL(path, "https://aipick.site").searchParams
        .get("utm_source")
        ?.toLowerCase();
      if (utmSource) {
        return UTM_SOURCE_LABELS[utmSource] ?? `Other (utm: ${utmSource})`;
      }
    } catch {
      // malformed path — fall through to Direct
    }
  }

  return "Direct / None";
}
