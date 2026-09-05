const OWN_HOSTS = ["aipick.site", "www.aipick.site", "localhost"];

const SOURCE_PATTERNS: { label: string; hosts: string[] }[] = [
  { label: "Google", hosts: ["google."] },
  { label: "Bing", hosts: ["bing.com"] },
  { label: "ChatGPT / OpenAI", hosts: ["chat.openai.com", "chatgpt.com", "openai.com"] },
  { label: "Perplexity", hosts: ["perplexity.ai"] },
  { label: "Google Gemini", hosts: ["gemini.google.com"] },
  { label: "Reddit", hosts: ["reddit.com"] },
  { label: "X / Twitter", hosts: ["twitter.com", "x.com", "t.co"] },
  { label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  { label: "LinkedIn", hosts: ["linkedin.com"] },
  { label: "Instagram", hosts: ["instagram.com"] },
  { label: "Product Hunt", hosts: ["producthunt.com"] },
  { label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { label: "Pinterest", hosts: ["pinterest.com"] },
];

// Classifies a raw `referer` header value into a human-readable traffic source.
// Returns "Direct / None" for empty referrers or same-site navigation.
export function classifyReferrer(rawReferrer: string | null | undefined): string {
  if (!rawReferrer) return "Direct / None";

  let host: string;
  try {
    host = new URL(rawReferrer).hostname.toLowerCase();
  } catch {
    return "Other";
  }

  if (OWN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return "Direct / None";
  }

  for (const { label, hosts } of SOURCE_PATTERNS) {
    if (hosts.some((h) => host.includes(h))) return label;
  }

  return `Other (${host})`;
}
