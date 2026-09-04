import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import ComparePicker from "@/components/ComparePicker";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare AI Tools | AIPick",
  description: "Pick any two AI tools and compare pricing, platforms, ratings and community votes side by side.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: { a?: string };
}) {
  const supabase = createClient();
  const { data: tools } = await supabase
    .from("tools")
    .select("slug, name")
    .eq("status", "active")
    .order("name");

  const toolList = tools ?? [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Compare</span>
      <h1 className="font-display font-bold text-3xl mt-1">Compare AI tools</h1>
      <p className="text-ink/60 mt-3">
        Pick any two tools to see pricing, platforms and community votes side by side.
      </p>

      <ComparePicker tools={toolList} initialA={searchParams?.a} />

      {toolList.length === 0 && (
        <p className="text-sm text-ink/50 mt-10">No tools to compare yet.</p>
      )}
    </main>
  );
}
