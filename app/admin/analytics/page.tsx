import { redirect } from "next/navigation";

// Analytics was merged into the Overview page (single combined dashboard) —
// keep this route alive so old bookmarks/links don't 404.
export default function AdminAnalyticsRedirect() {
  redirect("/admin");
}
