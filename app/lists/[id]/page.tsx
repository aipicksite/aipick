import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Tool } from "@/types/database";
import ToolRow from "@/components/ToolRow";
import RemoveFromListButton from "@/components/RemoveFromListButton";
import DeleteListButton from "@/components/DeleteListButton";
import ListLikeButton from "@/components/ListLikeButton";
import ShareListButton from "@/components/ShareListButton";
import ListCommentsSection from "@/components/ListCommentsSection";

type Props = { params: { id: string } };

async function getList(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("custom_lists")
    .select("*, list_items(tool_id, tools(*))")
    .eq("id", id)
    .maybeSingle();
  return data as any;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const list = await getList(params.id);
  if (!list || !list.is_public) return {};
  return {
    title: `${list.title} — AI Tool List | AIPick`,
    description: list.description ?? `A curated list of AI tools on AIPick.`,
  };
}

export default async function ListDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const list = await getList(params.id);
  if (!list) notFound();

  const isOwner = user?.id === list.user_id;
  if (!list.is_public && !isOwner) notFound();

  const tools = (list.list_items ?? []).map((item: any) => item.tools).filter(Boolean) as Tool[];

  let liked = false;
  let comments: any[] = [];
  if (list.is_public) {
    const [likeRow, { data: commentRows }] = await Promise.all([
      user
        ? supabase
            .from("list_likes")
            .select("id")
            .eq("list_id", list.id)
            .eq("user_id", user.id)
            .maybeSingle()
            .then((r) => r.data)
        : Promise.resolve(null),
      supabase
        .from("list_comments")
        .select("id, body, created_at, user_id, profiles(username)")
        .eq("list_id", list.id)
        .order("created_at", { ascending: true }),
    ]);
    liked = !!likeRow;
    comments = (commentRows ?? []).map((c: any) => ({
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      userId: c.user_id,
      authorLabel: c.profiles?.username ?? "AIPick user",
      isMine: user?.id === c.user_id,
    }));
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">
        {list.is_public ? "Public list" : "Private list"}
      </span>
      <div className="flex items-start justify-between gap-4 mt-1">
        <h1 className="font-display font-bold text-3xl">{list.title}</h1>
        {isOwner && <DeleteListButton listId={list.id} />}
      </div>
      {list.description && <p className="text-ink/60 mt-2">{list.description}</p>}

      {list.is_public && (
        <div className="flex items-center gap-2 mt-4">
          <ListLikeButton
            listId={list.id}
            initialLiked={liked}
            initialCount={list.likes_count ?? 0}
            isLoggedIn={!!user}
          />
          <ShareListButton listId={list.id} />
        </div>
      )}

      <div className="mt-8 flex flex-col">
        {tools.map((tool) => (
          <div key={tool.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <ToolRow tool={tool} />
            </div>
            {isOwner && <RemoveFromListButton listId={list.id} toolId={tool.id} />}
          </div>
        ))}

        {tools.length === 0 && (
          <p className="text-sm text-ink/55 py-10">
            {isOwner
              ? "No tools yet — visit any tool page and use \"Add to list\" to start building this out."
              : "This list is empty."}
          </p>
        )}
      </div>

      {list.is_public && (
        <ListCommentsSection
          listId={list.id}
          initialComments={comments}
          isLoggedIn={!!user}
          isListOwner={isOwner}
        />
      )}
    </main>
  );
}
