import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const BASE_URL = "https://aipick.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [{ data: tools }, { data: categories }, { data: posts }] = await Promise.all([
    supabase.from("tools").select("slug, updated_at").eq("status", "active"),
    supabase.from("categories").select("slug"),
    supabase
      .from("blog_posts")
      .select("slug, published_at")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString()),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/compare`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/submit`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/top/best-free-ai-tools`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/top/trending-ai-tools`, changeFrequency: "daily", priority: 0.8 },
  ];

  const toolPages: MetadataRoute.Sitemap = (tools ?? []).map((t) => ({
    url: `${BASE_URL}/tool/${t.slug}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).flatMap((c) => [
    { url: `${BASE_URL}/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${BASE_URL}/top/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 },
  ]);

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...toolPages, ...categoryPages, ...blogPages];
}
