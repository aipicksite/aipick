import { requireAdmin } from "@/lib/admin";
import BlogForm from "@/components/BlogForm";
import { createBlogPost } from "../actions";

export default async function NewBlogPostPage() {
  await requireAdmin();

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">New blog post</h1>
      <BlogForm action={createBlogPost} submitLabel="Create post" />
    </main>
  );
}
