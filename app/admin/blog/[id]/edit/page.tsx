import { requireAdmin } from "@/lib/admin";
import { notFound } from "next/navigation";
import BlogForm from "@/components/BlogForm";
import { updateBlogPost } from "../../actions";

type Props = { params: { id: string } };

export default async function EditBlogPostPage({ params }: Props) {
  const { supabase } = await requireAdmin();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  const boundUpdate = updateBlogPost.bind(null, params.id);

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Edit blog post</h1>
      <BlogForm post={post} action={boundUpdate} submitLabel="Save changes" />
    </main>
  );
}
