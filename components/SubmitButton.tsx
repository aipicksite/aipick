"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText = "Working…",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
