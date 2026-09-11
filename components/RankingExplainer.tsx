export default function RankingExplainer() {
  return (
    <details className="mt-4 group rounded-lg border border-ink/10 bg-ink/[0.02] open:bg-ink/[0.03]">
      <summary className="cursor-pointer select-none list-none px-4 py-2.5 text-xs font-medium text-ink/60 flex items-center justify-between">
        <span>How this ranking works</span>
        <span className="text-ink/30 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="px-4 pb-4 pt-1 text-xs text-ink/60 leading-relaxed space-y-2">
        <p>
          Rank is based on a combination of real, ongoing signals from the AIPick community —
          not a paid placement or a one-time snapshot.
        </p>
        <ul className="space-y-1 list-disc pl-4">
          <li>
            <span className="font-medium text-ink/70">Upvote ratio</span> — the share of votes
            that are positive, not just the raw vote count.
          </li>
          <li>
            <span className="font-medium text-ink/70">Review rating</span> — the average
            star rating left by users who've actually reviewed the tool.
          </li>
          <li>
            <span className="font-medium text-ink/70">Review volume</span> — more reviews give
            a rating more weight, so a 5.0 from one review won't outrank a 4.7 from hundreds.
          </li>
          <li>
            <span className="font-medium text-ink/70">Recent activity</span> — tools that keep
            getting votes and reviews are favored over ones that went quiet.
          </li>
          <li>
            <span className="font-medium text-ink/70">Verification</span> — tools claimed and
            verified by their owners get a small trust boost, shown with a ✓ badge.
          </li>
        </ul>
        <p>
          Rankings update automatically every few hours as new votes and reviews come in, and
          can change at any time — nobody can pay to move up this list.
        </p>
      </div>
    </details>
  );
}
