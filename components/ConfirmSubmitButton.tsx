"use client";

import { useFormStatus } from "react-dom";

export default function ConfirmSubmitButton({
  confirmMessage,
  className,
  pendingText = "Working…",
  children,
}: {
  confirmMessage: string;
  className?: string;
  pendingText?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
