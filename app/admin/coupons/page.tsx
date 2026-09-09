import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import SubmitButton from "@/components/SubmitButton";
import { createCoupon, toggleCoupon, deleteCoupon } from "./actions";

export default async function AdminCouponsPage() {
  await requireAdmin(); // gate access; coupons has no public/session read policy by design
  const service = createServiceClient();
  const { data: coupons } = await service
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (coupons as any[]) ?? [];

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Coupons</h1>
      <p className="text-sm text-ink/55 mt-1">
        Leave "Applies to" empty to allow the code on every paid plan, or list plan keys
        (submit_basic, submit_featured, update_tool) comma-separated to restrict it.
      </p>

      <form action={createCoupon} className="mt-6 bg-surface border border-line rounded-lg p-5 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium block mb-1 text-ink/60">Code</label>
          <input name="code" required placeholder="LAUNCH50" className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1 text-ink/60">Type</label>
          <select name="discount_type" className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum">
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed $ off</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1 text-ink/60">Value</label>
          <input name="discount_value" type="number" step="0.01" min="0" required placeholder="50" className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1 text-ink/60">Max redemptions (optional)</label>
          <input name="max_redemptions" type="number" min="1" placeholder="Unlimited" className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1 text-ink/60">Expires (optional)</label>
          <input name="expires_at" type="datetime-local" className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1 text-ink/60">Applies to (optional)</label>
          <input name="applies_to" placeholder="submit_basic,submit_featured" className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum" />
        </div>
        <div className="sm:col-span-3">
          <SubmitButton pendingText="Creating…" className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep">
            Create coupon
          </SubmitButton>
        </div>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3 text-sm">
            <div>
              <span className="font-mono font-medium">{c.code}</span>{" "}
              <span className="text-ink/50">
                — {c.discount_type === "percent" ? `${c.discount_value}% off` : `$${c.discount_value} off`}
                {c.applies_to?.length ? ` · ${c.applies_to.join(", ")}` : " · all plans"}
                {c.max_redemptions ? ` · ${c.redemption_count}/${c.max_redemptions} used` : ` · ${c.redemption_count} used`}
                {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <form action={toggleCoupon.bind(null, c.id, !c.active)}>
                <button className={`text-xs px-2 py-1 rounded-full border ${c.active ? "border-forest/25 text-forest bg-forest-soft" : "border-line text-ink/40"}`}>
                  {c.active ? "Active" : "Disabled"}
                </button>
              </form>
              <form action={deleteCoupon.bind(null, c.id)}>
                <button className="text-xs text-coral hover:underline">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-ink/55 py-6">No coupons yet.</p>}
      </div>
    </main>
  );
}
