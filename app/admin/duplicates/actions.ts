"use server";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function mergeDuplicateTools(keepId: string, removeId: string) {
  await requireAdmin();
  const admin = createServiceClient();
  const { error } = await admin.rpc("merge_duplicate_tools", {
    keep_id: keepId,
    remove_id: removeId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duplicates");
}

export async function dismissDuplicatePair(idA: string, idB: string) {
  await requireAdmin();
  const admin = createServiceClient();
  await admin.from("duplicate_dismissals").upsert(
    { tool_id_a: idA, tool_id_b: idB },
    { onConflict: "tool_id_a,tool_id_b" }
  );
  revalidatePath("/admin/duplicates");
}
