import Link from "next/link";
import type { Tool } from "@/types/database";
import ToolAvatar from "./ToolAvatar";
import ToolScreenshot from "./ToolScreenshot";

const PRICING_LABEL: Record<string, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

function medalClass(rank: number) {
  if (rank === 1) return "medal-1";
  if (rank === 2) return "medal-2";
  if (rank === 3) return "medal-3";
  return "bg-base text-ink/40 border border-line";
}

export default function ToolListicle({ tools, rankOffset = 0 }: { tools: Tool[]; rankOffset?: number }) {
  if (tools.length === 0) {
    return <p className="py-8 text-sm text-ink/60">No tools here yet.</p>;
  }

  return (
    <>
      {/* Quick-jump list */}
      <div className="mt-8 border border-line rounded-lg divide-y divide-line overflow-hidden">
        {tools.map((tool, i) => (
          <a
            key={tool.id}
            href={`#${tool.slug}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-base transition-colors text-sm"
          >
            <span className={`rank-badge w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${medalClass(i + 1 + rankOffset)}`}>
              {i + 1 + rankOffset}
            </span>
            <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={22} />
            <span className="font-medium truncate">{tool.name}</span>
            <span className="ml-auto text-ink/40 text-xs shrink-0">
              ▲ {tool.upvotes - tool.downvotes}
            </span>
          </a>
        ))}
      </div>

      {/* Detailed write-up per tool */}
      <div className="mt-14 flex flex-col gap-14">
        {tools.map((tool, i) => (
          <article key={tool.id} id={tool.slug} className="scroll-mt-20">
            <div className="flex items-center gap-3">
              <span className={`rank-badge w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${medalClass(i + 1 + rankOffset)}`}>
                {i + 1 + rankOffset}
              </span>
              <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={36} />
              <h2 className="font-display font-bold text-xl">
                <Link href={`/tool/${tool.slug}`} className="hover:text-plum">
                  {tool.name}
                </Link>
              </h2>
              {tool.verified && (
                <span className="text-xs font-medium text-forest bg-forest-soft px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>

            <div className="sm:grid sm:grid-cols-[220px_1fr] sm:gap-6 mt-4">
              <div className="rounded-lg overflow-hidden border border-line aspect-[4/3] sm:sticky sm:top-20 h-fit">
                <ToolScreenshot
                  websiteUrl={tool.website_url}
                  overrideUrl={tool.screenshot_url}
                  name={tool.name}
                  className="w-full h-full"
                />
              </div>

              <div className="mt-4 sm:mt-0 min-w-0">
                {tool.short_description && (
                  <p className="text-[17px] leading-relaxed text-ink/80 font-medium">
                    {tool.short_description}
                  </p>
                )}

                {tool.description && (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/65">{tool.description}</p>
                )}

                {tool.highlights?.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {tool.highlights.map((h, hi) => {
                      const dotColors = ["bg-forest", "bg-gold", "bg-plum", "bg-coral"];
                      return (
                        <li key={hi} className="flex gap-2.5 text-sm text-ink/70">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dotColors[hi % dotColors.length]}`} />
                          <span>{h}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="flex flex-wrap items-center gap-2.5 mt-5 text-xs">
                  {tool.pricing_type && (
                    <span className="px-2.5 py-1 bg-forest-soft text-forest font-medium rounded-full">
                      {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_type}
                      {tool.pricing_summary && ` · ${tool.pricing_summary}`}
                    </span>
                  )}
                  {tool.rating_count > 0 && (
                    <span className="px-2.5 py-1 border border-line rounded-full text-ink/60">
                      ★ {tool.rating_avg.toFixed(1)} ({tool.rating_count} reviews)
                    </span>
                  )}
                  <span className="px-2.5 py-1 border border-line rounded-full text-ink/60">
                    ▲ {tool.upvotes - tool.downvotes} net votes
                  </span>
                </div>

                <div className="flex gap-3 mt-4">
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep transition-colors"
                  >
                    Visit {tool.name} →
                  </a>
                  <Link
                    href={`/tool/${tool.slug}`}
                    className="border border-line text-sm font-medium px-4 py-2 rounded-md hover:border-plum hover:text-plum transition-colors"
                  >
                    Full review & reviews
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
