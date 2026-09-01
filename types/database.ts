export type Tool = {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  logo_url: string | null;
  short_description: string | null;
  description: string | null;
  pricing_type: "free" | "freemium" | "paid";
  pricing_summary: string | null;
  platforms: string[];
  status: "active" | "discontinued";
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};
