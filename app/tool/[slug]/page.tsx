import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

async function getTool(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Tool | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getTool(params.slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — Review, Pricing & Alternatives | AIPick`,
    description: tool.short_description ?? undefined,
  };
}

export default async function ToolPage({ params }: Props) {
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{tool.name}</h1>
      <p className="text-gray-600 mt-2">{tool.short_description}</p>

      <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
        <span>{tool.pricing_summary}</span>
        <span>▲ {tool.upvotes - tool.downvotes} votes</span>
        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-blue-600 hover:underline"
        >
          Visit website →
        </a>
      </div>

      <article className="prose mt-8 max-w-none">
        <p>{tool.description}</p>
      </article>
    </main>
  );
}
