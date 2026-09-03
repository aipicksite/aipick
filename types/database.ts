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
  rating_avg: number;
  rating_count: number;
  owner_id: string | null;
  verified: boolean;
  highlights: string[];
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  ease_of_use: number | null;
  value_for_money: number | null;
  would_recommend: boolean | null;
  body: string | null;
  helpful_count: number;
  status: "published" | "flagged" | "removed";
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

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  body: string;
  published_at: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
};

export type ToolSubmission = {
  id: string;
  submitted_by: string;
  name: string;
  website_url: string;
  short_description: string | null;
  description: string | null;
  pricing_type: "free" | "freemium" | "paid" | null;
  pricing_summary: string | null;
  category_names: string | null;
  highlights: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  created_tool_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type ToolClaim = {
  id: string;
  tool_id: string;
  user_id: string;
  business_email: string;
  role: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};
