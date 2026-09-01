import Link from "next/link";
import type { Tool } from "@/types/database";
import ToolAvatar from "./ToolAvatar";

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

export default function ToolRow({ tool, rank }: { tool: Tool; rank?: number }) {
  const net = tool.upvotes - tool.downvotes;
  const medal = medalClass(rank);

  return (
    <Link href={`/tool/${tool.slug}`} className="tool-row group">
      {rank !== undefined && (
        <span
          className={`rank-badge shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
            medal || "bg-base text-ink/40 border border-line"
          }`}
        >
          {rank}
        </span>
      )}

      <ToolAvatar name={tool.name} logoUrl={tool.logo_url} />

      <div className="flex-1 min-w-0">
        <h3 className="font-display font-medium text-[15px] leading-tight group-hover:text-plum transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-ink/55 truncate mt-0.5">
          {tool.short_description}
        </p>
      </div>

      {tool.pricing_type && (
        <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 rounded-full border border-line text-ink/60 shrink-0">
          {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_summary}
        </span>
      )}

      <span className="rank-badge shrink-0 text-sm font-bold w-16 text-right tabular-nums text-forest">
        ▲ {net}
      </span>
    </Link>
  );
}
