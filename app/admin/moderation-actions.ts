"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function addAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  await supabase.from("admin_users").insert({ email });
  revalidatePath("/admin/admins");
}

export async function removeAdmin(adminRowId: string) {
  const { supabase, user } = await requireAdmin();

  // Safety: don't let an admin remove themselves and lock everyone out
  // of a possibly-empty admin list by accident.
  const { data: row } = await supabase
    .from("admin_users")
    .select("email")
    .eq("id", adminRowId)
    .single();

  if (row?.email === user.email) return;

  await supabase.from("admin_users").delete().eq("id", adminRowId);
  revalidatePath("/admin/admins");
}

export async function setReviewStatus(
  reviewId: string,
  status: "published" | "flagged" | "removed"
) {
  const { supabase } = await requireAdmin();
  await supabase.from("reviews").update({ status }).eq("id", reviewId);
  revalidatePath("/admin/reviews");
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function approveSubmission(submissionId: string) {
  const { supabase } = await requireAdmin();

  const { data: submission } = await supabase
    .from("tool_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (!submission) return;

  // Featured submissions join the shared 15-slot FIFO featured queue
  // (lib/featured-queue.ts) rather than getting an immediate fixed window —
  // this is the same queue an admin manually marking a tool "Featured" uses.
  const featuredRequestedAt = submission.requested_featured ? new Date().toISOString() : null;

  const { data: tool, error } = await supabase
    .from("tools")
    .insert({
      name: submission.name,
      slug: toSlug(submission.name),
      website_url: submission.website_url,
      short_description: submission.short_description,
      description: submission.description,
      pricing_type: submission.pricing_type ?? "freemium",
      pricing_summary: submission.pricing_summary,
      platforms: [],
      highlights: (submission.highlights ?? "")
        .split("\n")
        .map((h: string) => h.trim())
        .filter(Boolean),
      status: "active",
      featured_requested_at: featuredRequestedAt,
    })
    .select("id")
    .single();

  if (error || !tool) {
    await supabase
      .from("tool_submissions")
      .update({ reviewer_note: error?.message ?? "Could not create tool", reviewed_at: new Date().toISOString() })
      .eq("id", submissionId);
    revalidatePath("/admin/submissions");
    return;
  }

  // Attach categories by name, creating any that don't exist yet.
  const categoryNames = (submission.category_names ?? "")
    .split(",")
    .map((c: string) => c.trim())
    .filter(Boolean);

  for (const name of categoryNames) {
    const slug = toSlug(name);
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    let categoryId = existing?.id;

    // No exact slug match — check for a near-duplicate (e.g. "Video
    // Generation" vs "AI Video Generation") via Postgres trigram similarity
    // before creating what might just be the same category worded differently.
    if (!categoryId) {
      const { data: fuzzyMatches } = await supabase.rpc("find_similar_category", {
        candidate_name: name,
      });
      categoryId = fuzzyMatches?.[0]?.id;
    }

    if (!categoryId) {
      categoryId = (await supabase.from("categories").insert({ name, slug }).select("id").single()).data?.id;
    }

    if (categoryId) {
      await supabase.from("tool_categories").insert({ tool_id: tool.id, category_id: categoryId });
    }
  }

  await supabase
    .from("tool_submissions")
    .update({ status: "approved", created_tool_id: tool.id, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);

  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectSubmission(submissionId: string, note: string) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("tool_submissions")
    .update({ status: "rejected", reviewer_note: note || null, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);
  revalidatePath("/admin/submissions");
}

export async function approveClaim(claimId: string) {
  const { supabase } = await requireAdmin();

  const { data: claim } = await supabase
    .from("tool_claims")
    .select("*")
    .eq("id", claimId)
    .single();

  if (!claim) return;

  // Free "claim" (kind === 'claim') only proves ownership — the listing
  // shows an "Ownership claimed" badge, not the Verified badge. Verified is
  // reserved for paid "update" claims, which actually enrich the listing
  // (and unlock the owner-reply-to-reviews perk). See app/tool/[slug]/page.tsx.
  const toolUpdate: Record<string, unknown> = { owner_id: claim.user_id };
  if (claim.kind === "update") {
    toolUpdate.verified = true;
  }

  // Paid "update" claims (from /update-ai) carry proposed edits — apply the
  // ones the owner actually filled in. Plain free claims (kind === 'claim')
  // only verify ownership and touch nothing else.
  if (claim.kind === "update") {
    if (claim.requested_short_description) toolUpdate.short_description = claim.requested_short_description;
    if (claim.requested_description) toolUpdate.description = claim.requested_description;
    if (claim.requested_pricing_summary) toolUpdate.pricing_summary = claim.requested_pricing_summary;
    if (claim.requested_screenshot_url) toolUpdate.screenshot_url = claim.requested_screenshot_url;
    if (claim.requested_video_url) toolUpdate.video_url = claim.requested_video_url;
  }

  await supabase.from("tools").update(toolUpdate).eq("id", claim.tool_id);

  await supabase
    .from("tool_claims")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", claimId);

  // Reject any other pending claims on the same tool.
  await supabase
    .from("tool_claims")
    .update({ status: "rejected", reviewer_note: "Another claim was approved for this tool.", reviewed_at: new Date().toISOString() })
    .eq("tool_id", claim.tool_id)
    .neq("id", claimId)
    .eq("status", "pending");

  revalidatePath("/admin/claims");
  revalidatePath("/");
}

export async function rejectClaim(claimId: string, note: string) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("tool_claims")
    .update({ status: "rejected", reviewer_note: note || null, reviewed_at: new Date().toISOString() })
    .eq("id", claimId);
  revalidatePath("/admin/claims");
}
