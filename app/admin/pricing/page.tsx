import { requireAdmin } from "@/lib/admin";
import SubmitButton from "@/components/SubmitButton";
import { updatePricingPlan, clearFreePromo } from "./actions";

export default async function AdminPricingPage() {
  const { supabase } = await requireAdmin();
  const { data: plans } = await supabase.from("pricing_plans").select("*").order("key");

  const list = (plans as any[]) ?? [];

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Pricing</h1>
      <p className="text-sm text-ink/55 mt-1">
        Changes apply immediately on /submit and /update-ai. Set a "Free until" date to run a
        limited-time free promotion for a plan — it overrides the price for everyone until then.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {list.map((plan) => {
          const freeUntilLocal = plan.free_until
            ? new Date(plan.free_until).toISOString().slice(0, 16)
            : "";
          const isFreeNow = plan.free_until && new Date(plan.free_until).getTime() > Date.now();

          return (
            <form
              key={plan.key}
              action={updatePricingPlan}
              className="bg-surface border border-line rounded-lg p-5"
            >
              <input type="hidden" name="key" value={plan.key} />
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">{plan.label}</h3>
                <span className="text-xs text-ink/40">{plan.key}</span>
              </div>

              {isFreeNow && (
                <div className="mt-2 bg-forest-soft border border-forest/20 text-forest text-xs rounded-md px-3 py-2 flex items-center justify-between">
                  <span>Free until {new Date(plan.free_until).toLocaleString()}</span>
                  <button
                    formAction={clearFreePromo.bind(null, plan.key)}
                    className="underline hover:no-underline"
                  >
                    End now
                  </button>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium block mb-1 text-ink/60">Price (USD)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(plan.amount_cents / 100).toFixed(2)}
                    className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1 text-ink/60">Free until</label>
                  <input
                    name="free_until"
                    type="datetime-local"
                    defaultValue={freeUntilLocal}
                    className="w-full bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={plan.active} />
                    Active
                  </label>
                </div>
              </div>

              <SubmitButton
                pendingText="Saving…"
                className="mt-4 bg-plum text-white text-xs font-medium px-3.5 py-1.5 rounded-md hover:bg-plum-deep"
              >
                Save
              </SubmitButton>
            </form>
          );
        })}
      </div>
    </main>
  );
}
