export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="9" fill="#3E2A5C" />
      {/* Ascending bars — a small ranking/leaderboard motif */}
      <rect x="7" y="17" width="4.5" height="9" rx="1.5" fill="#C68A28" />
      <rect x="13.75" y="12" width="4.5" height="14" rx="1.5" fill="#F4E3BE" />
      <rect x="20.5" y="6" width="4.5" height="20" rx="1.5" fill="#C68A28" />
    </svg>
  );
}
