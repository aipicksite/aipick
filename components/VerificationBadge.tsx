import type { VerificationLevel } from "@/types/database";

export const VERIFICATION_LEVELS: {
  value: VerificationLevel;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    value: "unverified",
    label: "Unverified",
    short: "Unverified",
    description: "No verification has been done yet.",
  },
  {
    value: "website_verified",
    label: "Website Verified",
    short: "Website Verified",
    description: "We've automatically confirmed the listed website is live and matches the tool.",
  },
  {
    value: "owner_verified",
    label: "Owner Verified",
    short: "Verified",
    description: "The tool's owner has claimed this listing and confirmed the details.",
  },
  {
    value: "admin_verified",
    label: "Admin Verified",
    short: "Admin Verified",
    description: "An AIPick admin has manually reviewed and confirmed this listing.",
  },
  {
    value: "fully_verified",
    label: "Fully Verified",
    short: "Fully Verified",
    description: "This listing has passed every verification step: website, owner, and admin review.",
  },
];

const STYLES: Record<VerificationLevel, { icon: string; classes: string }> = {
  unverified: { icon: "", classes: "" },
  website_verified: { icon: "🌐", classes: "text-sky-700 bg-sky-100" },
  owner_verified: { icon: "✓", classes: "text-forest bg-forest-soft" },
  admin_verified: { icon: "🛡", classes: "text-plum bg-plum/10" },
  fully_verified: { icon: "★", classes: "text-gold bg-gold-soft" },
};

type Props = {
  level: VerificationLevel | null | undefined;
  size?: "sm" | "md";
  title?: string;
};

export default function VerificationBadge({ level, size = "md", title }: Props) {
  if (!level || level === "unverified") return null;

  const meta = VERIFICATION_LEVELS.find((l) => l.value === level);
  const style = STYLES[level];
  const sizeClasses = size === "sm" ? "text-[11px] px-1.5 py-px" : "text-xs px-2 py-0.5";

  return (
    <span
      title={title ?? meta?.description}
      className={`inline-flex items-center gap-1 font-medium rounded-full shrink-0 ${sizeClasses} ${style.classes}`}
    >
      {style.icon} {meta?.short}
    </span>
  );
}
