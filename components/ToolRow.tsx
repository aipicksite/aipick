import Link from "next/link";
import type { Tool } from "@/types/database";
import ToolAvatar from "./ToolAvatar";
import VerificationBadge from "./VerificationBadge";

const PRICING_LABEL: Record<string, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

function medalClass(rank?: number) {
  if (rank === 1) return "medal-1";
  if (rank === 2) return "medal-2";
  if (rank === 3) return "medal-3";
  return "";
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}K`;
  return `${n}`;
}

export default function ToolRow({ tool, rank }: { tool: Tool; rank?: number }) {
  const net = tool.upvotes - tool.downvotes;
  const medal = medalClass(rank);
  const isOwnerVerified =
    tool.verification_level === "owner_verified" ||
    tool.verification_level === "admin_verified" ||
    tool.verification_level === "fully_verified";

  return (
    <Link href={`/tool/${tool.slug}`} className="tool-row group">
      {rank !== undefined && (
        <span
          className={`rank-badge shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            medal || "bg-base text-ink/40 border border-line"
          }`}
        >
          {rank}
        </span>
      )}

      <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={44} />

      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-[15px] leading-tight group-hover:text-plum transition-colors flex items-center gap-1.5">
          {tool.name}
          <VerificationBadge level={tool.verification_level} size="sm" />
        </h3>
        <p className="text-sm text-ink/55 mt-0.5 leading-snug line-clamp-1 sm:line-clamp-none">
          {tool.short_description}
        </p>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 shrink-0 rank-badge text-forest font-bold text-sm w-16 justify-end">
        <span aria-hidden>▲</span>
        {formatCount(net)}
      </div>

      {tool.rating_count > 0 && (
        <div className="hidden md:flex flex-col items-end shrink-0 w-20">
          <span className="text-xs font-semibold text-gold">★ {tool.rating_avg.toFixed(1)}</span>
          <span className="text-[11px] text-ink/40 tabular-nums">({formatCount(tool.rating_count)})</span>
        </div>
      )}

      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        {isOwnerVerified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-plum bg-plum/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            ✓ Verified Owner
          </span>
        ) : (
          tool.pricing_type && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-line text-ink/60 whitespace-nowrap">
              {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_summary}
            </span>
          )
        )}
      </div>

      <span className="hidden sm:inline-flex shrink-0 items-center justify-center text-xs font-semibold text-plum border border-plum/30 rounded-lg px-3.5 py-2 group-hover:bg-plum group-hover:text-white transition-colors whitespace-nowrap">
        View Details
      </span>
    </Link>
  );
}
