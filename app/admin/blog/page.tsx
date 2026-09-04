import { requireAdmin } from "@/lib/admin";
import type { BlogPost } from "@/types/database";
import Link from "next/link";
import { deleteBlogPost } from "./actions";

export default async function AdminBlogPage() {
  const { supabase } = await requireAdmin();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  const postList = (posts as BlogPost[] | null) ?? [];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="bg-plum text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-plum-deep transition-colors"
        >
          + New post
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {postList.map((post) => {
          const isPublished = !!post.published_at && new Date(post.published_at) <= new Date();
          return (
            <div
              key={post.id}
              className="flex items-center gap-4 bg-surface border border-line rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium">{post.title}</span>
                <span className="text-ink/45 text-sm ml-2">/{post.slug}</span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full border shrink-0 ${
                  isPublished
                    ? "border-forest/25 text-forest bg-forest-soft"
                    : "border-gold/25 text-gold bg-gold-soft"
                }`}
              >
                {isPublished ? "Published" : "Draft"}
              </span>
              <Link
                href={`/admin/blog/${post.id}/edit`}
                className="text-sm text-plum hover:underline shrink-0"
              >
                Edit
              </Link>
              <form action={deleteBlogPost.bind(null, post.id)}>
                <button type="submit" className="text-sm text-coral hover:underline shrink-0">
                  Delete
                </button>
              </form>
            </div>
          );
        })}
        {postList.length === 0 && (
          <p className="py-8 text-sm text-ink/60">No blog posts yet — write the first one.</p>
        )}
      </div>
    </main>
  );
}
