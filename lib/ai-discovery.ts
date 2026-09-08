import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiscoverySettings } from "@/lib/settings";

type Candidate = {
  name: string;
  website_url: string;
  short_description?: string;
  description?: string;
  pricing_type?: string;
  pricing_summary?: string;
  category_names?: string | string[];
  highlights?: string[];
};

export type DiscoveryResult = {
  summary: string;
  requested: number;
  returned: number;
  added: number;
  skipped: { name: string; reason: string }[];
  groundedSearchUsed?: boolean;
  rawModelOutput?: string; // kept when parsing fails OR the model returned zero results, to help debugging from the admin UI
};

function normalizeName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildPrompt(existingNamesSample: string[], totalExistingCount: number, batchSize: number, focus: string) {
  return `You are helping curate a directory of AI tools and AI-powered products at AIPick.site.

Find ${batchSize} REAL, currently operating AI tools/products. Search the web to confirm each one is real and still active before including it — do not rely on memory alone, and do not invent or guess a website URL.

We already have ${totalExistingCount} tools in our database — including these (a sample, not the full list):
${existingNamesSample.join(", ")}

Avoid repeating anything on that sample list or obvious re-brands/variants of them. It's fine if you're not 100% sure something is new — we automatically filter out anything too similar to what we already have after you respond, so focus on finding real, notable tools rather than trying to perfectly avoid every possible overlap.

${focus ? `Preferred focus for this batch: ${focus}` : "Cover a good spread of different categories rather than clustering on one."}

Rules:
- If you have web search available, use it to confirm each tool is real, currently live, and has the exact URL you're providing.
- If web search is NOT available to you in this response, it's fine to rely on well-established tools you're confident existed as of your training data — just don't invent a URL you're not sure of, and don't include anything you're only vaguely aware of.
- Skip anything already in the exclusion list above, including close variants of the same product.
- Descriptions must be factual and specific to that product — no generic filler.
- Return whatever real tools you can find, even if it's fewer than ${batchSize} — only return an empty array if you genuinely cannot think of or find any qualifying tool at all.

Respond with ONLY a raw JSON array (no markdown code fences, no commentary before or after) of exactly this shape:
[
  {
    "name": "Tool Name",
    "website_url": "https://example.com",
    "short_description": "One sentence, under 20 words, on what it does.",
    "description": "2-3 factual sentences on what it does and what makes it notable.",
    "pricing_type": "free" | "freemium" | "paid",
    "pricing_summary": "Short one-line pricing summary.",
    "category_names": "Comma-separated category name(s) that best fit, e.g. Video Generation",
    "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"]
  }
]`;
}

function extractJsonArray(text: string): Candidate[] {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model output did not contain a JSON array.");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Parsed output was not an array.");
  return parsed;
}

async function callGemini(model: string, prompt: string): Promise<{ text: string; grounded: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in your environment variables.");

  async function request(withSearch: boolean) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  }

  try {
    const text = await request(true);
    return { text, grounded: true };
  } catch {
    // Some model versions/keys don't support the google_search tool — retry
    // once without it rather than failing the whole run.
    const text = await request(false);
    return { text, grounded: false };
  }
}

async function callOpenAI(model: string, prompt: string): Promise<{ text: string; grounded: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in your environment variables.");

  async function request(withSearch: boolean) {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        ...(withSearch ? { tools: [{ type: "web_search" }] } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    // Responses API: output is an array of items; find the assistant message text.
    const text =
      data.output_text ??
      data.output
        ?.flatMap((item: any) => item.content ?? [])
        .filter((c: any) => c.type === "output_text")
        .map((c: any) => c.text)
        .join("") ??
      "";
    if (!text) throw new Error("OpenAI returned an empty response.");
    return text;
  }

  try {
    const text = await request(true);
    return { text, grounded: true };
  } catch {
    // Not every model on every account has web_search access — retry once
    // without it rather than failing the whole run.
    const text = await request(false);
    return { text, grounded: false };
  }
}

export async function runDiscovery(
  admin: SupabaseClient,
  settings: DiscoverySettings
): Promise<DiscoveryResult> {
  const batchSize = Math.max(1, Math.min(30, parseInt(settings.discovery_batch_size, 10) || 10));

  const [{ count: totalToolCount }, { data: recentTools }, { data: pendingSubs }] = await Promise.all([
    admin.from("tools").select("*", { count: "exact", head: true }),
    admin.from("tools").select("name").order("created_at", { ascending: false }).limit(150),
    admin.from("tool_submissions").select("name").eq("status", "pending"),
  ]);

  // Only a capped sample goes into the prompt (token cost stays flat no
  // matter how large the catalog gets) — the real dedup safety net is the
  // DB-side fuzzy match below (022_fuzzy_matching.sql), which checks every
  // existing tool/pending submission via Postgres trigram similarity, not
  // just whatever fit in the prompt.
  const sampleNames = ((recentTools ?? []) as { name: string }[]).map((t) => t.name);
  const pendingNames = ((pendingSubs ?? []) as { name: string }[]).map((s) => s.name);

  const prompt = buildPrompt(sampleNames, totalToolCount ?? sampleNames.length, batchSize, settings.discovery_focus);

  let raw: string;
  let groundedSearchUsed: boolean;
  if (settings.discovery_provider === "openai") {
    ({ text: raw, grounded: groundedSearchUsed } = await callOpenAI(settings.discovery_model, prompt));
  } else {
    ({ text: raw, grounded: groundedSearchUsed } = await callGemini(settings.discovery_model, prompt));
  }

  let candidates: Candidate[];
  try {
    candidates = extractJsonArray(raw);
  } catch (e) {
    return {
      summary: `Model response couldn't be parsed as JSON: ${(e as Error).message}`,
      requested: batchSize,
      returned: 0,
      added: 0,
      skipped: [],
      groundedSearchUsed,
      rawModelOutput: raw.slice(0, 4000),
    };
  }

  if (candidates.length === 0) {
    return {
      summary: `Requested ${batchSize}, but the model returned zero candidates${
        groundedSearchUsed ? "" : " (web search grounding was unavailable for this call, so it fell back to a plain text response)"
      }. See the raw output below for why — often the model was overly cautious, or the prompt needs a narrower focus.`,
      requested: batchSize,
      returned: 0,
      added: 0,
      skipped: [],
      groundedSearchUsed,
      rawModelOutput: raw.slice(0, 4000),
    };
  }

  // Cheap in-memory pass first (catches exact/near-exact matches within the
  // sample and within this batch, no DB round-trip needed), then a fuzzy
  // DB check per remaining candidate against the FULL tools + pending
  // tables — this is what actually scales to a large catalog.
  const seenNormalized = new Set([...sampleNames, ...pendingNames].map(normalizeName));
  const toInsert: Record<string, unknown>[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const c of candidates) {
    const name = (c.name ?? "").trim();
    const websiteUrl = (c.website_url ?? "").trim();
    if (!name || !websiteUrl) {
      skipped.push({ name: name || "(unnamed)", reason: "missing name or website_url" });
      continue;
    }
    const key = normalizeName(name);
    if (seenNormalized.has(key)) {
      skipped.push({ name, reason: "duplicate of an existing tool or pending submission" });
      continue;
    }

    const { data: isDup } = await admin.rpc("is_duplicate_tool_name", { candidate_name: name });
    if (isDup) {
      skipped.push({ name, reason: "close match to an existing tool (fuzzy match)" });
      continue;
    }
    seenNormalized.add(key); // also dedupes within this same batch

    toInsert.push({
      name,
      website_url: websiteUrl,
      short_description: c.short_description?.trim() || null,
      description: c.description?.trim() || null,
      pricing_type: ["free", "freemium", "paid"].includes(String(c.pricing_type))
        ? c.pricing_type
        : null,
      pricing_summary: c.pricing_summary?.trim() || null,
      category_names: Array.isArray(c.category_names)
        ? c.category_names.join(", ")
        : c.category_names?.trim() || null,
      highlights: Array.isArray(c.highlights) ? c.highlights.join("\n") : null,
      status: "pending",
      source: "ai_discovery",
      ai_model: `${settings.discovery_provider}:${settings.discovery_model}`,
      submitted_by: null,
    });
  }

  if (toInsert.length > 0) {
    const { error } = await admin.from("tool_submissions").insert(toInsert);
    if (error) {
      return {
        summary: `Model returned ${candidates.length} candidates, but saving them failed: ${error.message}`,
        requested: batchSize,
        returned: candidates.length,
        added: 0,
        skipped,
        groundedSearchUsed,
      };
    }
  }

  return {
    summary: `Requested ${batchSize}, model returned ${candidates.length}, added ${toInsert.length} as pending submissions, skipped ${skipped.length}.${
      groundedSearchUsed ? "" : " (Ran without web search grounding.)"
    }`,
    requested: batchSize,
    returned: candidates.length,
    added: toInsert.length,
    skipped,
    groundedSearchUsed,
  };
}
