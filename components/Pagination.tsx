import Link from "next/link";

export default function Pagination({
  currentPage,
  totalPages,
  buildUrl,
}: {
  currentPage: number;
  totalPages: number;
  buildUrl: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  // Show first, last, current ±1, with ellipses between gaps.
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const pageList = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Pagination">
      {prevDisabled ? (
        <span className="px-3 py-1.5 text-sm text-ink/30 border border-line rounded-md">← Prev</span>
      ) : (
        <Link href={buildUrl(currentPage - 1)} className="px-3 py-1.5 text-sm border border-line rounded-md hover:border-plum hover:text-plum transition-colors">
          ← Prev
        </Link>
      )}

      {pageList.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pageList[i - 1] !== p - 1 && <span className="text-ink/30 px-1">…</span>}
          <Link
            href={buildUrl(p)}
            className={`w-9 h-9 flex items-center justify-center text-sm rounded-md tabular-nums ${
              p === currentPage
                ? "bg-plum text-white"
                : "border border-line hover:border-plum hover:text-plum transition-colors"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}

      {nextDisabled ? (
        <span className="px-3 py-1.5 text-sm text-ink/30 border border-line rounded-md">Next →</span>
      ) : (
        <Link href={buildUrl(currentPage + 1)} className="px-3 py-1.5 text-sm border border-line rounded-md hover:border-plum hover:text-plum transition-colors">
          Next →
        </Link>
      )}
    </nav>
  );
}
