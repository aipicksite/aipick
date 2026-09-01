const PALETTE = [
  { bg: "#3E2A5C", fg: "#F4E3BE" }, // plum / gold
  { bg: "#28603F", fg: "#DCEBE0" }, // forest
  { bg: "#B84A3A", fg: "#F3DAD3" }, // coral
  { bg: "#C68A28", fg: "#2C1D43" }, // gold
  { bg: "#1F3A5F", fg: "#DCE6F2" }, // navy
  { bg: "#6B4226", fg: "#F0E1D2" }, // umber
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function ToolAvatar({
  name,
  logoUrl,
  size = 44,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-[10px] object-cover shrink-0 border border-line"
        style={{ width: size, height: size }}
      />
    );
  }

  const { bg, fg } = paletteFor(name || "?");
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      aria-hidden
      className="rounded-[10px] shrink-0 flex items-center justify-center font-display font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
