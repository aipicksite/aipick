"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Drop-in replacement for `<input type="text" name="q" defaultValue={q} />`
 * inside a `method="get"` filter form. Instead of waiting for a submit
 * click, it debounces keystrokes and pushes the updated `q` param straight
 * into the URL — the server component re-renders with live-filtered
 * results as the admin types, same UX pattern as the live tool search.
 * Resets `page` to 1 whenever the query changes so pagination stays sane.
 */
export default function LiveFilterInput({
  name = "q",
  defaultValue = "",
  placeholder,
  className,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set(name, next.trim());
      else params.delete(name);
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
  }

  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={className}
    />
  );
}
