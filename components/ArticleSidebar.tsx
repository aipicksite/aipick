import Link from "next/link";
import CopyLinkButton from "@/components/CopyLinkButton";

export default function ArticleSidebar({
  shareUrl,
}: {
  shareUrl: string;
}) {
  return (
    <aside className="mt-10 lg:mt-0">
      <div className="lg:sticky lg:top-24 flex flex-col gap-4">
        <div className="border border-line rounded-lg bg-surface p-4">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
            Share this article
          </p>
          <CopyLinkButton text={shareUrl} />
        </div>

        <div className="border border-line rounded-lg p-4 bg-gradient-to-br from-plum/5 to-forest/5">
          <p className="font-display font-semibold text-sm text-ink mb-1.5">
            Looking for an AI tool?
          </p>
          <p className="text-sm text-ink/60 leading-relaxed mb-3">
            Browse community-voted picks across every category on AIPick.
          </p>
          <Link
            href="/tools"
            className="inline-flex text-sm font-medium text-plum hover:underline"
          >
            Explore all tools →
          </Link>
        </div>

        {/* Reserved for a future paid sticky ad slot. Intentionally just a
            placeholder for now — do not put the TOC or other real content
            back here; this space is spoken for. Swap this block out once
            the ad unit is ready. */}
        <div className="border border-dashed border-line/60 rounded-lg p-4 min-h-[250px] flex items-center justify-center">
          <p className="text-xs text-ink/30 uppercase tracking-wide">Ad space reserved</p>
        </div>
      </div>
    </aside>
  );
}
