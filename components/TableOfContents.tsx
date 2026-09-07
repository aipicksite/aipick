import type { TocItem } from "@/lib/article-toc";

export default function TableOfContents({
  items,
  variant = "inline",
}: {
  items: TocItem[];
  variant?: "inline" | "sidebar";
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={
        variant === "inline"
          ? "border border-line rounded-lg bg-surface p-5 my-8"
          : "border border-line rounded-lg bg-surface p-4"
      }
    >
      <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
        In this article
      </p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              className="text-ink/65 hover:text-plum transition-colors leading-snug block"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
